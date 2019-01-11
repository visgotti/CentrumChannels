import {clearInterval} from "timers";
import * as msgpack from 'notepack.io';
/*
import FrontChannel from '../src/core/Front/FrontChannel';
import BackChannel from '../src/core/Back/BackChannel';


import { FrontMasterChannel } from '../src/core/Front/FrontMaster/MasterChannel';
import { BackMasterChannel } from '../src/core/Back/BackMaster/MasterChannel';

import { Messenger } from 'centrum-messengers/dist/core/Messenger';

const { TEST_CLUSTER_OPTIONS, makeRandomMessages, arrayAverage, getRandomChannelIds, formatBytes, applyPatches } = require('./testHelpers');
const options = TEST_CLUSTER_OPTIONS;

interface TestFrontMessage {
    message: any,
    frontUid: string,
}

import * as assert from 'assert';
import * as mocha from 'mocha';

const messageFactories = {
    xxsmall: ((minMessages, maxMessages) =>  (makeRandomMessages(minMessages, maxMessages, 1, 1, 1, 1, 1, 1))),
    xsmall: ((minMessages, maxMessages) =>  (makeRandomMessages(minMessages, maxMessages, 3, 5, 5, 10, 15, 25))),
    small: ((minMessages, maxMessages) =>  (makeRandomMessages(minMessages, maxMessages, 15, 50, 10, 30, 100, 300))),
    medium: ((minMessages, maxMessages) =>  makeRandomMessages(minMessages, maxMessages, 30, 70, 10, 30, 200, 500)),
    large: ((minMessages, maxMessages) =>  makeRandomMessages(minMessages, maxMessages, 40, 80, 10, 30, 300, 800)),
    xlarge: ((minMessages, maxMessages) =>  makeRandomMessages(minMessages, maxMessages, 50, 90, 10, 30, 500, 1000)),
};

const messageFactory = messageFactories.xsmall;

const TEST_FRONT_URI = 'tcp://127.0.0.1:4000';
const TEST_BACK_URI = 'tcp://127.0.0.1:5000';

describe('FrontChannel', function() {

    let FrontChannel1: FrontChannel;
    let FrontChannel2: FrontChannel;
    let BackChannel1: BackChannel;
    let BackChannel2; BackChannel;
    before('Initialize a centrum messenger for the Front Channels and the Back Channels', (done) => {
        const frontMessenger = new Messenger({ id: 'testFront', publish: { pubSocketURI: TEST_FRONT_URI } , subscribe: { pubSocketURIs: [TEST_BACK_URI] } });
        const backMessenger = new Messenger({ id: 'testBack', publish: { pubSocketURI: TEST_BACK_URI } , subscribe: { pubSocketURIs: [TEST_FRONT_URI] } });

        const frontMaster = new FrontMasterChannel([0, 1], 2, 0, frontMessenger);
        const backMaster = new BackMasterChannel([0, 1], 0, backMessenger);

        FrontChannel1 = frontMaster.frontChannels[0];
        FrontChannel2 = frontMaster.frontChannels[1];
        BackChannel1 = backMaster.backChannels[0];
        BackChannel2 = backMaster.backChannels[1];

        assert.strictEqual(FrontChannel1.channelId, 0);
        assert.strictEqual(FrontChannel2.channelId, 1);

        assert.strictEqual(BackChannel1.channelId, 0);
        assert.strictEqual(BackChannel2.channelId, 1);

        setTimeout(() => {
            done();
        }, 200);
    });

    afterEach(() => {
        FrontChannel1.onConnected(() => {});
        FrontChannel2.onConnected(() => {});
        FrontChannel1.onSetState(() => {});
        FrontChannel2.onSetState(() => {});
    });

    after(done => {
        FrontChannel1.close();
        FrontChannel2.close();
        BackChannel1.close();
        BackChannel2.close();
        setTimeout(() => {
            done();
        }, 200);
    });
    describe('backChannel getters', () => {
        it.only('backChannel.mirroredFrontUids has one for each front server made.', (done) => {
            backChannels.forEach(backChannel => {
                assert.strictEqual(backChannel.mirroredFrontUids.length, options.frontServers)
            });
            done();
        });
        it.only('backChannel.connectedFrontsData has data for each frontUid', (done) => {
            backChannels.forEach(backChannel => {
                const dataMap = backChannel.connectedFrontsData;

                const keys = Array.from(dataMap.keys());

                assert.strictEqual(keys.length, frontChannels.length);
            });
            done();
        });
    });

    describe('backChannel.send', () => {
        it.only('tests it sends to correct frontUid with correct data', (done) => {
            frontChannels[0].onMessage((message, channelId) => {
                assert.strictEqual(channelId, backChannels[0].channelId);
                assert.deepStrictEqual(message, { "foo": "bar"});
                done();
            });
            backChannels[0].send({ "foo": "bar"}, frontChannels[0].frontUid)
        });
    });

    describe('backChannel.broadcast', () => {
        it.only('sends to all front channels if no second parameter is passed in.', (done) => {
            let actualReceived = 0;
            // each front channel should get it
            const expectedReceived = frontChannels.length;

            frontChannels.forEach(frontChannel => {
                frontChannel.onMessage((message, channelId) => {
                    assert.strictEqual(channelId, backChannels[0].channelId);
                    actualReceived += message;
                    if(actualReceived === expectedReceived) {
                        setTimeout(() => {
                            assert.strictEqual(actualReceived, expectedReceived);
                            done();
                        }, 50)
                    }
                });
            });
            backChannels[0].broadcast(1);
        });

        it.only('only sends to front channels specified by uid as the second parameter.', (done) => {
            let actualReceived = 0;

            // get random front channels to send to.
            const randomUids = frontChannels.reduce((uids, frontChannel) => {
                if(Math.random() > .8) {
                    uids.push(frontChannel.frontUid)
                }
                return uids
            }, []);

            frontChannels.forEach(frontChannel => {
                frontChannel.onMessage((message, channelId) => {
                    actualReceived += message;
                    assert.strictEqual(channelId, backChannels[0].channelId);
                    if(actualReceived === randomUids.length) {
                        setTimeout(() => {
                            assert.strictEqual(actualReceived, randomUids.length);
                            done();
                        }, 50)
                    }
                });
            });

            backChannels[0].broadcast(1, randomUids);
        });
    });

    describe('backChannel.broadcastLinked with NO LINKED FRONTS', () => {
        it.only('no channels receive the broadcast', (done) => {
            let actualReceived = 0;
            let expectedReceive = 0;

            frontChannels.forEach(frontChannel => {
                frontChannel.onMessage((message, channelId) => {
                    assert.strictEqual(frontChannel.channelId, channelId);
                    assert.strictEqual(frontChannel.channelId, backChannels[0].channelId);
                    actualReceived+=message;
                });
            });
            backChannels[0].broadcastLinked(1);

            setTimeout(() => {
                assert.strictEqual(actualReceived, expectedReceive);
                done();
            }, 100);
        });
    });

    describe('backChannel.broadcastLinked with LINKED FRONT', () => {
        it.only('sends to all front channels since theyre all connected as well as a state broadcast when they connect', (done) => {
            backChannels[0].setState({ "foo": "bar" });

            setTimeout(() => {

            }, 1000);

            let expectedReceive = options.frontServers;

            let broadcastsReceived = 0;
            let statesReceived = 0;

            frontChannels.forEach(frontChannel => {
                if(frontChannel.channelId === backChannels[0].channelId) {
                    frontChannel.link();
                }
                frontChannel.onMessage((message, channelId) => {
                    assert.strictEqual(frontChannel.channelId, channelId);
                    assert.strictEqual(frontChannel.channelId, backChannels[0].channelId);
                    broadcastsReceived+=message;
                });
                frontChannel.onSetState((newState) => {
                    statesReceived+=1;
                });
            });

            setTimeout(() => {
                backChannels[0].broadcastLinked(1);
            }, 100);

            setTimeout(() => {
                assert.strictEqual(broadcastsReceived, expectedReceive);
                assert.strictEqual(statesReceived, expectedReceive);
                done();
            }, 200);
        });
    });

    describe('backChannel.setState', () => {
        it.only('sets and gets state correctly', (done) => {
            backChannels[0].setState({ 'foo': 'bar' });
            assert.deepStrictEqual(backChannels[0].state, {'foo':'bar'});
            done();
        })
    });

    describe('backChannel.sendState', () => {
        it.only('throws if state is null', (done) => {
            backChannels[0].setState(null);
            assert.throws(() => { backChannels[0].sendState() });
            done();
        });
        it.only('sends state to linked front channels', (done) => {
            let actualReceived = 0;
            let expectedReceive = options.frontServers;


            backChannels[0].setState({ "foo": "bar" });

            frontChannels.forEach(frontChannel => {
                if(frontChannel.channelId === backChannels[0].channelId) {
                    backChannels[0].sendState(frontChannel.frontUid);
                }
                frontChannel.onSetState(state => {
                    actualReceived++;
                    if(actualReceived === expectedReceive) {
                        setTimeout(() => {
                            assert.strictEqual(actualReceived, expectedReceive);
                            done();
                        }, 100)
                    }
                });
            });
        });
    });
    describe('backChannel.broadcastPatch', () => {
        it.only('throws if state is null', (done) => {
            backChannels[0].setState(null);
            assert.throws(() => { backChannels[0].broadcastPatch() });
            done();
        });
        it.only('returns false if theres no state differences', (done) => {
            backChannels[0].setState({ "foo": "bar" });
            backChannels[0].setState({ "foo": "bar" });
            assert.strictEqual(backChannels[0].broadcastPatch(), false);
            done();
        });
        it.only('returns true if state was changed', (done) => {
            backChannels[0].setState({ "foo": "bar" });
            backChannels[0].state.foo = "baz";
            assert.strictEqual(backChannels[0].broadcastPatch(), true);
            done();
        });
    });
});
*/