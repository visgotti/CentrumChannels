"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var MSG_CODES;
(function (MSG_CODES) {
    // FRONT MASTER -> BACK MASTER
    MSG_CODES[MSG_CODES["SEND_QUEUED"] = 0] = "SEND_QUEUED";
    //BACK MASTER -> FRONT MASTER
    MSG_CODES[MSG_CODES["PATCH_STATE"] = 1] = "PATCH_STATE";
    // FRONT -> BACK
    MSG_CODES[MSG_CODES["CONNECT"] = 2] = "CONNECT";
    MSG_CODES[MSG_CODES["DISCONNECT"] = 3] = "DISCONNECT";
    MSG_CODES[MSG_CODES["SEND_BACK"] = 4] = "SEND_BACK";
    MSG_CODES[MSG_CODES["BROADCAST_ALL_BACK"] = 5] = "BROADCAST_ALL_BACK";
    MSG_CODES[MSG_CODES["LINK"] = 6] = "LINK";
    MSG_CODES[MSG_CODES["UNLINK"] = 7] = "UNLINK";
    // BACK -> FRONT
    MSG_CODES[MSG_CODES["ACCEPT_LINK"] = 8] = "ACCEPT_LINK";
    MSG_CODES[MSG_CODES["CONNECTION_CHANGE"] = 9] = "CONNECTION_CHANGE";
    MSG_CODES[MSG_CODES["BROADCAST_LINKED_FRONTS"] = 10] = "BROADCAST_LINKED_FRONTS";
    MSG_CODES[MSG_CODES["BROADCAST_ALL_FRONTS"] = 11] = "BROADCAST_ALL_FRONTS";
    MSG_CODES[MSG_CODES["SEND_FRONT"] = 12] = "SEND_FRONT";
})(MSG_CODES || (MSG_CODES = {}));
/**
 * helper class with functions to make sure protocol codes stay synchronized between front and back channels.
 */
class Protocol {
    constructor() { }
    ;
    //FRONT MASTER -> BACK MASTER
    static SEND_QUEUED(frontServerIndex) { return Protocol.make(MSG_CODES.SEND_QUEUED, frontServerIndex); }
    ;
    static DISCONNECT() { return Protocol.make(MSG_CODES.DISCONNECT); }
    ; //todo: figure out all disconnection edge cases before implementing
    //BACK MASTER -> FRONT MASTERS
    static PATCH_STATE(backServerIndex) { return Protocol.make(MSG_CODES.PATCH_STATE, backServerIndex); }
    ;
    // FRONT -> BACKS
    static CONNECT() { return Protocol.make(MSG_CODES.CONNECT); }
    ;
    static BROADCAST_ALL_BACK() { return Protocol.make(MSG_CODES.BROADCAST_ALL_BACK); }
    ;
    static SEND_BACK(backChannelId) { return Protocol.make(MSG_CODES.SEND_BACK, backChannelId); }
    ;
    static LINK(frontUid) { return Protocol.make(MSG_CODES.LINK, frontUid); }
    ;
    static UNLINK(frontUid) { return Protocol.make(MSG_CODES.UNLINK, frontUid); }
    ;
    // BACK -> FRONTS
    static BROADCAST_LINKED_FRONTS(frontChannelId) { return Protocol.make(MSG_CODES.BROADCAST_LINKED_FRONTS, frontChannelId); }
    ;
    static BROADCAST_ALL_FRONTS() { return Protocol.make(MSG_CODES.BROADCAST_ALL_FRONTS); }
    ;
    // BACK -> FRONT
    static CONNECTION_CHANGE(frontUid) { return Protocol.make(MSG_CODES.CONNECTION_CHANGE, frontUid); }
    ;
    static SEND_FRONT(frontUid) { return Protocol.make(MSG_CODES.SEND_FRONT, frontUid); }
    ;
    static ACCEPT_LINK(frontUid) { return Protocol.make(MSG_CODES.ACCEPT_LINK, frontUid); }
    ;
    /**
     * returns concatenated protocol code if id is provided
     * @param code - unique code for different pub/sub types
     * @param id - if pub/sub message is unique between channels it needs an id so messages dont get leaked to other channels that don't need them.
     * @returns {string}
     */
    static make(code, id) {
        return id ? `${code.toString()}-${id}` : code.toString();
    }
}
exports.Protocol = Protocol;
/**
 * Class that implements logic to create needed message functions for a channel.
 * It uses a channel instance when creating said functions, so theres no need
 * to keep track of passing in parameters when wanting to register/unregister/call
 * a message since the factory keeps all of that in its scope when instantiated.
 */
class MessageFactory {
    constructor(messenger) {
        this.messenger = messenger;
    }
    pubCreator(protocol, encoder) {
        let pub = {};
        pub = (function (...args) {
            if (pub.publisher) {
                pub.publisher(...args);
            }
            else {
                throw new Error('Unitialized');
            }
        });
        pub.register = () => {
            pub.publisher = this.messenger.getOrCreatePublish(protocol, null, encoder);
            pub.unregister = (...args) => {
                this.messenger.removePublish(protocol);
            };
        };
        return pub;
    }
    /**
     * push will use the same messenger publisher so any registered subs will receive it but since the recipients
     * can change dynamically we want to be able to just give a 'to' parameter to create push and have the protocol
     * factory create the message name for us.
     * @param protocolFactory - Function used to create the publisher name based on the to parameter passed in.
     */
    pushCreator(protocolFactory, encoder) {
        let push = {};
        push.register = (to) => {
            push[to] = this.messenger.getOrCreatePublish(protocolFactory(to), null, encoder);
            push.unregister = () => {
                this.messenger.removePublish(protocolFactory(to));
                delete push[to];
            };
        };
        return push;
    }
    /**
     * used for subscriptions with multiple handlers. (multiple channels listening for the same broadcast)
     * @param protocol
     * @param id
     * @returns {any}
     */
    subCreator(protocol, id, decoder) {
        let sub = {};
        sub.register = (onSubscriptionHandler) => {
            sub.subscriber = this.messenger.createOrAddSubscription(protocol, id, onSubscriptionHandler, decoder);
            sub.unregister = () => {
                this.messenger.removeSubscriptionById(protocol, id);
            };
        };
        return sub;
    }
    /**
     * used for subscriptions with only one handler. (single handler listening for unique broadcast)
     * @param protocol
     * @returns {any}
     */
    pullCreator(protocolFactory, decoder) {
        let pull = {};
        pull.register = (from, onSubscriptionHandler) => {
            pull.subscriber = this.messenger.createSubscription(protocolFactory(from), protocolFactory(from), onSubscriptionHandler, decoder);
            pull.unregister = (from) => {
                this.messenger.removeAllSubscriptionsWithName(protocolFactory(from));
            };
        };
        return pull;
    }
}
class ChannelMessageFactory extends MessageFactory {
    constructor(messenger) {
        super(messenger);
    }
}
exports.ChannelMessageFactory = ChannelMessageFactory;
class MasterMessageFactory extends MessageFactory {
    constructor(messenger) {
        super(messenger);
    }
}
exports.MasterMessageFactory = MasterMessageFactory;
