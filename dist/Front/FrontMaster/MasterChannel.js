"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const msgpack = require("notepack.io");
const MasterMessages_1 = require("./MasterMessages");
const FrontChannel_1 = require("../FrontChannel");
const Channel_1 = require("../../Channel/Channel");
class FrontMasterChannel extends Channel_1.Channel {
    constructor(channelIds, totalChannels, frontMasterIndex, messenger) {
        super(frontMasterIndex, messenger);
        this.frontMasterIndex = frontMasterIndex;
        this.frontChannels = {};
        this.frontChannelIds = [];
        this._linkedBackMasterLookup = {};
        this._connectedBackMasters = new Set(); //todo make this a lookup similar to linked with count of connected channels.
        channelIds.forEach(channelId => {
            const frontChannel = new FrontChannel_1.default(channelId, totalChannels, messenger, this);
            this.frontChannels[channelId] = frontChannel;
            this.frontChannelIds.push(channelId);
        });
        this.initializeMessageFactories();
    }
    get connectedBackMasters() {
        return Array.from(this._connectedBackMasters.values());
    }
    connect() {
        return __awaiter(this, void 0, void 0, function* () {
            try {
                let awaitingConnections = this.frontChannelIds.length;
                for (let i = 0; i < this.frontChannelIds.length; i++) {
                    const connected = yield this.frontChannels[i].connect();
                    // makes sure we connected to at least 1 back master index.
                    if (connected && connected.backMasterIndexes.length) {
                        connected.backMasterIndexes.forEach(backMasterIndex => {
                            // registers pusher if the connected back master index wasnt registered yet.
                            this._connectedBackMasters.add(backMasterIndex);
                            this.push.SEND_QUEUED.register(backMasterIndex);
                        });
                        awaitingConnections--;
                        if (awaitingConnections === 0) {
                            return true;
                        }
                    }
                    else {
                        throw new Error('Error connecting.');
                    }
                }
            }
            catch (err) {
                throw err;
            }
        });
    }
    sendQueuedMessages() {
        for (let key in this._linkedBackMasterLookup) {
            this.push.SEND_QUEUED[key](this._linkedBackMasterLookup[key].queuedMessages);
            this._linkedBackMasterLookup[key].queuedMessages.length = 0;
        }
    }
    /**
     * adds a message to the queue for a specific back Master Channel
     * @param message - message to send
     * @param backMasterIndex - server index that the linked back channel lives on.
     */
    addQueuedMessage(message, backMasterIndex, channelId) {
        if (!(this._linkedBackMasterLookup[backMasterIndex])) {
            throw `The Back Master at index ${backMasterIndex} was not linked`;
        }
        this._linkedBackMasterLookup[backMasterIndex].queuedMessages.push([channelId, message]);
    }
    unlinkChannel(backMasterIndex) {
        if (--(this._linkedBackMasterLookup[backMasterIndex].linkedChannelsCount) === 0) {
            this._linkedBackMasterLookup[backMasterIndex].queuedMessages.length = 0;
            delete this._linkedBackMasterLookup[backMasterIndex];
        }
    }
    linkChannel(backMasterIndex) {
        if (!(this._linkedBackMasterLookup[backMasterIndex])) {
            this._linkedBackMasterLookup[backMasterIndex] = { linkedChannelsCount: 1, queuedMessages: [] };
        }
        else {
            this._linkedBackMasterLookup[backMasterIndex].linkedChannelsCount++;
        }
    }
    get linkedBackMasterLookup() {
        return this._linkedBackMasterLookup;
    }
    /**
     * initializes needed message factories for front channels.
     */
    initializeMessageFactories() {
        const { push, pull } = new MasterMessages_1.MasterMessages(this.messenger);
        this.push = push;
        this.pull = pull;
        this.pull.PATCH_STATE.register(this.frontMasterIndex, (data) => {
            const decoded = msgpack.decode(data);
            for (let i = 0; i < decoded.length; i++) {
                const channelId = decoded[i][0];
                const encodedPatch = decoded[i][1];
                this.frontChannels[channelId].patchState(encodedPatch);
            }
        });
    }
    close() {
        for (let i = 0; i < this.frontChannelIds.length; i++) {
            this.frontChannels[this.frontChannelIds[i]].close();
        }
    }
}
exports.FrontMasterChannel = FrontMasterChannel;