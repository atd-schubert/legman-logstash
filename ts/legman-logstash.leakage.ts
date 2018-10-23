import {EventEmitter} from "events";
import { iterate } from "leakage";
import Legman from "legman";
import {createServer} from "net";
import Logstash from "./";

const testPort = 53535;
const defaultTimeout = 60000; // sorry for that, but leakage tests take a lot of time!
const leakingTestIterations = 10;
const unleakingTestIterations = 100;
function noop(): void {
    // do nothing...
}
function sleep(ms = 1000): Promise<void> {
    return new Promise((resolve) => void setTimeout(resolve, ms));
}

describe("Legman leakage tests", () => {
    describe("un-leaky", () => {
        const emitter = new EventEmitter();
        const server = createServer((con) => {
            emitter.emit("connection", con);
        });

        before("create test server", (done) => server.listen(testPort, done));
        after("shut down test server", () => {
            server.close();
            return sleep();
        });

        it("should not leak while sending messages with a consumer", async () => {
            const base = new Legman({});
            const logstash = new Logstash(testPort);
            await logstash.connect();
            base.pipe(logstash);

            return iterate.async(() => {
                for (let i = 0; i < unleakingTestIterations; i += 1) {
                    base.write({msg: "test"});
                }
                return sleep(1);
            }).then(() => logstash.close());
        }).timeout(defaultTimeout);
    });
    describe("leaky", () => {
        it("should leak while being not connected", async () => {
            const base = new Legman({});
            const logstash = new Logstash(testPort);
            const noError = new Error("No error was emitted");
            base.pipe(logstash);

            return iterate.async(() => {
                for (let i = 0; i < leakingTestIterations; i += 1) {
                    base.write({msg: "test"});
                }
                return sleep(1);
            })
                .then(() => {
                    throw noError;
                })
                .catch((err) => { if (err === noError) {throw noError; }});
        }).timeout(defaultTimeout);

        // Because it stores all messages. It will not leak again after being connected again.
        it.skip("should leak with an interrupted connection").timeout(defaultTimeout);
    });
});
