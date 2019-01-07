import { Centrum } from '../../../lib/Centrum';

import { Channel } from '../Channel/Channel';
import { BackMessages, BackPubs, BackPushes, BackSubs, BackPulls } from './BackMessages';

import {ConnectedFrontData, ConnectedClientData, FrontToBackMessage, FrontConnectMessage, CONNECTION_STATUS} from '../types';

class BackChannel extends Channel {
    private pub: BackPubs;
    private sub: BackSubs;
    private push: BackPushes;
    private pull: BackPulls;

    // lookup of frontUid to frontServerIndex
    private _connectedFrontsData: Map<string, ConnectedFrontData>;
    private _mirroredFrontUids: Set<string>;


    // to be used when clients start interacting with channels.
    private _connectedClientsData: Map<string, ConnectedClientData>;
    private _writingClientUids: Set<string>;
    private _listeningClientUids: Set<string>;

    constructor(channelId, centrum: Centrum) {
        super(channelId, centrum);

        this._connectedFrontsData = new Map();
        this._mirroredFrontUids = new Set();

        this._connectedClientsData = new Map();
        this._writingClientUids = new Set();
        this._listeningClientUids = new Set();

        this.initializeMessageFactories();
        this.registerPreConnectedSubs();
        this.registerPreConnectedPubs();
    }

    /**
     * sets the onMessageHandler function
     * @param handler - function that gets executed, gets parameters message and frontUid
     */
    public onMessage(handler: (message: any, frontUid: string) => void) : void {
        this.onMessageHandler = handler;
    }

    public broadcastPatchedState() {
       // this.sendPatchedStateHandler();
    };

    public broadcastSetState(){
       // this.sendSetStateHandler();
    };

    /**
     * sends message to specific front channel based on frontUid
     * @param message - data sent to back channel.
     * @param frontUid - uid of front channel to send message to
     */
    public send(message: any, frontUid: string) : void {
        this.push.SEND_FRONT[frontUid]({ message, channelId: this.channelId});
    }

    /**
     * sends message to supplied front channels based on frontUids or if omitted broadcasts to all front channels regardless of channel Id.
     * @param message
     * @param frontUids
     */
    public broadcast(message: any, frontUids?: Array<string>) {
        if(frontUids) {
            frontUids.forEach(frontUid => {
                this.send(message, frontUid);
            });
        } else {
            console.log('publishing to all fronts');
            this.pub.BROADCAST_ALL_FRONTS({
                message,
                channelId: this.channelId,
            });
        }
    }

    /**
     * sends message to all front channels that share channelId with back channel.
     * @param message
     * @param frontUids
     */
    public broadcastMirrored(message: any) {
        this.pub.BROADCAST_MIRROR_FRONTS(message);
    }

    public getFrontUidForClient(clientUid) : string {
        return this._connectedClientsData.get(clientUid).frontUid;
    }

    get connectedFrontsData() : Map<string, ConnectedFrontData> {
        return this._connectedFrontsData;
    }

    get mirroredFrontUids() : Array<string> {
        return Array.from(this._mirroredFrontUids)
    }

    private onMessageQueue(messages: Array<any>, frontUid: string) {
        for(let i = 0; i < messages.length; i++) {
            this._onMessage(messages[i], frontUid);
        }
    }

    private _onMessage(message: any, frontUid: string) : void {
        this.onMessageHandler(message, frontUid);
    }

    private onMessageHandler(message: any, frontUid: string) : void {
        throw new Error(`Unimplemented onMessageHandler in back channel ${this.channelId} Use backChannel.onMessage to implement.`);
    }

    /**
     * subscriptions that we want to register before front channels start connecting.
     */
    private registerPreConnectedSubs() : void {

        // registers sub that handles requests the same regardless of the frontUid.
        this.sub.CONNECT.register(this.onFrontConnected.bind(this));

        this.sub.BROADCAST_ALL_BACK.register((data: FrontToBackMessage) => {
            const { message, frontUid } = data;
            this._onMessage(message, frontUid);
        });

        this.sub.SEND_BACK.register((data: FrontToBackMessage) => {
            const { message, frontUid } = data;
            this._onMessage(message, frontUid);
        });
    }

    /**
     * publications that we want to be able to send out before channels start connecting.
     */
    private registerPreConnectedPubs() : void {
        // handler that broadcasts instance already exists on centrum before creating it if its not the first backChannel instantiated
        this.pub.BROADCAST_ALL_FRONTS.register();
        this.pub.BROADCAST_MIRROR_FRONTS.register();
    }

    /**
     * initializes channel pub and sub  handlers when we receive a connect message from front channel.
     * @param frontData - { channelId, frontUid, frontServerIndex }
     */
    private onFrontConnected(frontData: ConnectedFrontData) {
        const { channelId, frontUid, serverIndex } = frontData;
        if(channelId === this.channelId) {
            this.pull.SEND_QUEUED.register(frontUid, (messages => {
                for(let i = 0; i < messages.length; i++) {
                    this.onMessageHandler(messages[i], frontUid);
                }
            }));

            // add to mirror set since its same channelId
            this._mirroredFrontUids.add(frontUid);
        }

        // keep connected data stored for all fronts.
        this._connectedFrontsData.set(frontUid, frontData);

        // register send pusher for unique frontuid.
        //TODO: optimize so instead of keeping a 1:1 push for each front uid, keep a 1:1 push to serverIndex of frontuid and then the correct handler will be callled
        this.push.SEND_FRONT.register(frontUid);

        // create push then remove since this wont be done again unless theres a disconnection.
        this.push.CONNECTION_CHANGE.register(frontUid);
        this.push.CONNECTION_CHANGE[frontUid]({ channelId: this.channelId, connectionStatus: CONNECTION_STATUS.CONNECTED });
        this.push.CONNECTION_CHANGE.unregister();
    }

    /**
     * initializes needed message factories for front channels.
     */
    private initializeMessageFactories() {
        const { pub, push, sub, pull } = new BackMessages(this.centrum, this);
        this.pub = pub;
        this.push = push;
        this.sub = sub;
        this.pull = pull;
    }
}

export default BackChannel;