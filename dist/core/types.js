"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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