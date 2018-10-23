import { expect } from "chai";
import { EventEmitter } from "events";
import { createServer } from "net";
import { Writable } from "stream";
import Logstash from "./";

const testPort = 53535;

describe("Legman-Logstash", () => {
    describe("instantiation", () => {
        it("should be instantiatable", () => expect(new Logstash(testPort)).instanceOf(Logstash));
        it("should be an instance of a Writable Stream", () => expect(new Logstash(testPort)).instanceOf(Writable));
    });
    describe("connecting", () => {
        const emitter = new EventEmitter();
        const server = createServer((con) => {
            emitter.emit("connection", con);
        });

        before("create test server", (done) => {
            server.listen(testPort, done);
        });
        after("shut down test server", (done) => {
            server.close(done);
        });

        it("should connect and disconnect", (done: Mocha.Done) => {
            const logstash = new Logstash(testPort);
            emitter.once("connection", (connection) => {
                connection.on("end", () => done());
                logstash.close();
            });
            logstash.connect();
        });
        // Skipped because you can not just kill a server connection on node.js
        it.skip("should reconnect", (done: Mocha.Done) => {
            // const logstash = new Logstash(testPort);
            // emitter.once("connection", (connection) => {
            //     console.log("got connection");
            //     emitter.once("connection", (secondConnection) => {
            //         console.log("got second connection");
            //         logstash.close();
            //         done();
            //     });
            //     server.close();
            //     connection.destroy();
            //     console.log((server as any)._connections);
            //     server.listen(testPort);
            // });
            // logstash.connect();
        }).timeout(30000);
    });
    describe("sending logs", () => {
        const logstash = new Logstash(testPort);
        const emitter = new EventEmitter();
        const server = createServer((con) => {
            con.on("data", (data) => emitter.emit("data", data));
        });

        before("create test server", (done) => {
            server.listen(testPort, done);
        });
        before("connect logstash", () => logstash.connect());

        after("close logstash connection", () => logstash.close());

        after("shut down test server", (done) => {
            server.close(done);
        });

        it("send a message", (done: Mocha.Done) => {
            const testMessage = {msg: "this is a test message"};
            logstash.write(testMessage);
            emitter.once("data", (message) => {
                expect(JSON.parse(message.toString())).deep.equal(testMessage);
                done();
            });
        });
    });
});
