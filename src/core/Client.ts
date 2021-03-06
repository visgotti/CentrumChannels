import { STATE_UPDATE_TYPES } from './types';

import { FrontChannel } from './Front/FrontChannel/FrontChannel';
import { FrontMasterChannel } from './Front/FrontMaster/MasterChannel';

import { LinkResponse } from './Front/FrontChannel/FrontChannel';

class Client {
    readonly uid: string;
    public state: any;
    private masterChannel: FrontMasterChannel;
    private linkedChannels: Map<string, FrontChannel>;
    private _processorChannel: FrontChannel;
    private processorChannelId: string = '';
    private _queuedEncodedUpdates: any;

    constructor(uid: string, masterChannel: FrontMasterChannel) {
        if(!(uid)) throw new Error('Invalid client uid.');
        this.uid = uid;
        this.masterChannel = masterChannel;
        this.masterChannel.clientConnected(this);
        this._processorChannel = null;
        this.linkedChannels = new Map();
        this._queuedEncodedUpdates = {};
        this.state = null;
    }

    get queuedEncodedUpdates() {
        return this._queuedEncodedUpdates;
    }

    get processorChannel() {
        return this._processorChannel ? this.processorChannelId : null;
    }

    public isLinkedToChannel(channelId: string) : boolean {
        return this.linkedChannels.has(channelId);
    }

    /**
     * method to be overridden to handle direct client messages from back channels.
     */
    public onMessage(handler) {
        this.onMessageHandler = handler;
    }

    public onMessageHandler(data) { throw 'Unimplemented' };

    /**
     * Sets connected channel of client also links it.
     * @param channelId
     * @param options to send to back channel
     */
    public async linkChannel(channelId: string, options?: any) : Promise<LinkResponse> {
        try {
            const channel = this.masterChannel.frontChannels[channelId];
            if(!channel) throw new Error(`Invalid channelId ${channelId}`);
            const response = await channel.linkClient(this, options);
            this.linkedChannels.set(channelId, channel);
            this.addStateUpdate(channelId, response.encodedState, STATE_UPDATE_TYPES.SET);
            return response;
        } catch (err) {
            throw err;
        }
    }

    /**
     * setProcessorChannel will set the channel in which a client will relay its messages through.
     * The processor channel will forward the clients messages to the mirrored back channel in which
     * it will process the message and wind up sending back messages/state updates to any linked clients.
     * @param {string} channelId - channelId to set as processor channel.
     * @param {boolean=false} unlinkOld - if you want to unlink from the old processor channel after you set the new one.
     * @param {any} addOptions - options that get sent to the new processor channel
     * @param {any} removeOptions - options that get sent to the old processor channel
     * @returns {boolean}
     */
    public setProcessorChannel(channelId: string, unlinkOld=false, addOptions?: any, removeOptions?: any) : boolean {
        const channel = this.masterChannel.frontChannels[channelId];
        // confirm channel id was valid
        if(!channel) throw new Error(`Invalid channelId ${channelId} trying to be set as processor for client ${this.uid}`);

        // confirm its not already set as processor
        if(this._processorChannel && channelId === this._processorChannel.channelId) throw new Error(`ChannelId ${channelId} is already set as processor for client ${this.uid}`);

        // confirm that the client was previously linked to channel before setting it as processor
        if(!(this.linkedChannels.has(channelId))) throw new Error(`Please make sure there is a linkage to ${channelId} before setting it as processor for client ${this.uid}`);

        this._processorChannel && this._processorChannel.removeClientWrite(this.uid, removeOptions);

        channel.addClientWrite(this.uid, addOptions);

        if(unlinkOld) this.unlinkChannel(this._processorChannel.channelId);

        this._processorChannel = channel;
        this.processorChannelId = this._processorChannel.channelId;

        return true;
    }

    public addStateUpdate(channelId, update, type: STATE_UPDATE_TYPES) {
        if(!(this.linkedChannels.has(channelId))) return false;

        if(!(channelId in this._queuedEncodedUpdates)) {
            this._queuedEncodedUpdates[channelId] = [];
        }
        this._queuedEncodedUpdates[channelId].push([channelId, type, update ]);

        return this._queuedEncodedUpdates[channelId].length;
    }

    public clearStateUpdates() {
        Object.keys(this._queuedEncodedUpdates).forEach(channelId => {
            this._queuedEncodedUpdates[channelId].length = 0;
        });
    }

    /**
     * Message that will be received by every server.
     * @param message
     */
    public sendGlobal(data: Array<any>) {
        if(this._processorChannel) {
            this._processorChannel.broadcast(data, null, this.uid);
        }
    }

    /**
     * queues message on front channel to send back channel
     * @param message
     */
    public sendLocal(data: Array<any>) {
        if(this._processorChannel) {
            this._processorChannel.addMessage(data, this.uid);
        }
    }

    /**
     * sends message instantly
     * @param message
     */
    public sendLocalImmediate(data: Array<any>) {
        if(this._processorChannel) {
            this._processorChannel.send(data, this.processorChannelId, this.uid);
        }
    }

    public unlinkChannel(channelId?, options?) {
        if(this.linkedChannels.has(channelId)) {
            const linkedChannel = this.linkedChannels.get(channelId);

            linkedChannel.unlinkClient(this.uid, options);

            // checks to see if the current processor channel is the channel we're unlinking from, if so
            // send notification that were removing the client write.
            if(this._processorChannel && linkedChannel.channelId === this._processorChannel.channelId) {
                linkedChannel.removeClientWrite(this.uid);
            }
        } else {
            this.linkedChannels.forEach(channel => {
                channel.unlinkClient(this.uid);
            });
            this.masterChannel.clientDisconnected(this.uid)
        }
    }

    public onChannelDisconnect(channelId) {
        if(this._processorChannel && this._processorChannel.channelId === channelId) {
            this._processorChannel.removeClientWrite(this.uid);
            this._processorChannel = null;
            this.processorChannelId = '';
        }
        delete this._queuedEncodedUpdates[channelId];
        this.linkedChannels.delete(channelId);
    }
}

export default Client;