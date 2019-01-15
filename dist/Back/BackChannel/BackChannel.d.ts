import { Messenger } from 'centrum-messengers/dist/core/Messenger';
import { Channel } from '../../Channel/Channel';
import { BackMasterChannel } from '../BackMaster/MasterChannel';
import { ConnectedFrontData } from '../../types';
declare class BackChannel extends Channel {
    private master;
    private pub;
    private sub;
    private push;
    private pull;
    private _connectedFrontsData;
    private _mirroredFrontUids;
    state: any;
    private _previousState;
    private _previousStateEncoded;
    private linkedFrontUids;
    private linkedFrontMasterIndexes;
    private masterIndexToFrontUidLookup;
    readonly backMasterIndex: number;
    constructor(channelId: any, messenger: Messenger, master: BackMasterChannel);
    /**
     * sets the onMessageHandler function
     * @param handler - function that gets executed, gets parameters message and frontUid
     */
    onMessage(handler: (message: any, frontUid: string) => void): void;
    /**
     * sends state patches to mirrored channels
     * @returns {boolean}
     */
    patchState(): boolean;
    /**
     *  accepts link from front channel and sends back state for it to be retrieved asynchronously.
     */
    acceptLink(frontUid: any, clientUid?: any): void;
    /**
     * sends message to specific front channel based on frontUid
     * @param message - data sent to back channel.
     * @param frontUid - uid of front channel to send message to
     */
    send(message: any, frontUid: string): void;
    /**
     * sends message to supplied front channels based on frontUids or if omitted broadcasts to all front channels regardless of channel Id.
     * @param message
     * @param frontUids
     */
    broadcast(message: any, frontUids?: Array<string>): void;
    /**
     * sends message to all front channels that share channelId with back channel.
     * @param message
     */
    broadcastLinked(message: any): void;
    setState(newState: any): void;
    processMessageFromMaster(message: any, frontMasterIndex: number): void;
    readonly connectedFrontsData: Map<string, ConnectedFrontData>;
    readonly mirroredFrontUids: Array<string>;
    private _onMessage;
    private onMessageHandler;
    /**
     * subscriptions that we want to register before front channels start connecting.
     */
    private registerPreConnectedSubs;
    /**
     * publications that we want to be able to send out before channels start connecting.
     */
    private registerPreConnectedPubs;
    /**
     * initializes channel pub and sub  handlers when we receive a connect message from front channel.
     * @param frontData - { channelId, frontUid, frontMasterIndex }
     */
    private onMirrorConnected;
    /**
     * initializes needed message factories for front channels.
     */
    private initializeMessageFactories;
}
export default BackChannel;
