import * as fossilDelta from 'fossil-delta';
import * as msgpack from 'notepack.io';

import FrontChannel from './FrontChannel';

enum STATE_UPDATE_TYPES {
    SET,
    PATCH
}

export class Client {
    readonly uid: string;
    public state: any;
    private connectedChannels: Map<string, FrontChannel>;
    private queuedEncodedUpdates: any;
    private processorChannel: FrontChannel;

    constructor(uid) {
        this.uid = uid;
        this.processorChannel = null;

        this.queuedEncodedUpdates = {};

        this.state = null;
    }

    /**
     * this sets the channel where client messages get processed.
     * if the client isnt connected, it will call the connect method first.
     * @param channel
     */
    public async setProcessorChannel(channel: FrontChannel) {
        if(!(this.connectedChannels.has(channel.channelId))) {
            try{
                await this.connectChannel(channel);
                this.processorChannel = channel;
                return true;
            } catch (err) {
                throw err;
            }
        } else {
            this.processorChannel = channel;
            return true;
        }
    }

    public addEncodedStateSet(channelId, state) {
        if(!(channelId in this.queuedEncodedUpdates)) {
            this.queuedEncodedUpdates[channelId] = [];
        }
        this.queuedEncodedUpdates[channelId].push({ type: STATE_UPDATE_TYPES.SET, state });
    }

    public addEncodedStatePatch(channelId, patch) {
        if(!(channelId in this.queuedEncodedUpdates)) {
            this.queuedEncodedUpdates[channelId] = [];
        }
        this.queuedEncodedUpdates[channelId].push({ type: STATE_UPDATE_TYPES.PATCH, patch });
    }

    public clearEncodedStateUpdates() {
        Object.keys(this.queuedEncodedUpdates).forEach(channelId => {
            this.queuedEncodedUpdates[channelId].length = 0;
        });
    }

    /**
     * Message that will be received by every server.
     * @param message
     */
    public sendGlobal(message) {
        if(!(this.processorChannel)) {
            throw new Error('Client must have a channel set as its processor channel to send messages. See Client.setProcessor');
        }

        const data = {
            clientUid: this.uid,
            message,
        };

        this.processorChannel.broadcast(data);
    }

    /**
     * sends message to back channel with processorId.
     * @param message
     */
    public sendLocal(message) {
        if(!(this.processorChannel)) {
            throw new Error('Client must have a channel set as its processor channel to send messages. See Client.setProcessor');
        }

        const data = {
            clientUid: this.uid,
            message,
        };

        this.processorChannel.addMessage(data);
    }

    public disconnect() {
        this.connectedChannels.forEach(channel => {
            channel.disconnectClient(clientUid);
        });
    }

    /**
     * Sets connected channel of client also links it.
     * @param channel
     */
    public async connectChannel(channel: FrontChannel) {
        try {
            const state = await channel.addClient(this);
            this.addEncodedStateSet(channel.channelId, state);
            this.connectedChannels.set(channel.channelId, channel);
            return true;
        } catch (err) {
            throw err;
        }
    }

    // removes queued updates from channel.
    public onChannelDisconnect(channelId) {
        if(this.processorChannel.channelId === channelId) {
            this.processorChannel = null;
        }
        delete this.queuedEncodedUpdates[channelId];
        this.connectedChannels.delete(channelId);
    }
}