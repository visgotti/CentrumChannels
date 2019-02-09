"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var STATE_UPDATE_TYPES;
(function (STATE_UPDATE_TYPES) {
    STATE_UPDATE_TYPES[STATE_UPDATE_TYPES["SET"] = 0] = "SET";
    STATE_UPDATE_TYPES[STATE_UPDATE_TYPES["PATCH"] = 1] = "PATCH";
})(STATE_UPDATE_TYPES = exports.STATE_UPDATE_TYPES || (exports.STATE_UPDATE_TYPES = {}));
var CONNECTION_STATUS;
(function (CONNECTION_STATUS) {
    CONNECTION_STATUS["DISCONNECTED"] = "DISCONNECTED";
    CONNECTION_STATUS["DISCONNECTING"] = "DISCONNECTING";
    CONNECTION_STATUS["CONNECTING"] = "CONNECTING";
    CONNECTION_STATUS["CONNECTED"] = "CONNECTED";
})(CONNECTION_STATUS = exports.CONNECTION_STATUS || (exports.CONNECTION_STATUS = {}));
var CONNECTION_CHANGE;
(function (CONNECTION_CHANGE) {
    CONNECTION_CHANGE["CONNECTED"] = "CONNECTED";
    CONNECTION_CHANGE[CONNECTION_CHANGE["DISCONNECTED"] = CONNECTION_CHANGE.DISCONNECTED] = "DISCONNECTED";
})(CONNECTION_CHANGE = exports.CONNECTION_CHANGE || (exports.CONNECTION_CHANGE = {}));