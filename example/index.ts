import Legman from "legman";
import Logstash from "../lib";
const logstash = new Logstash(
    process.env.LOGSTASH_PORT && parseInt(process.env.LOGSTASH_PORT, 10) || 9500,
    process.env.LOGSTASH_HOSTNAME || "logstash",
);

logstash.connect();
const leg = new Legman({app: "com.atd-schubert.legman-test"});

leg
    .filter((message) => ["error", "warn", "log", "info"].includes(message.loglevel))
    .pipe(logstash);

// Type of messages
[
    new Error("This is a plain error"),
    "This is a plain string",
    { loglevel: "error", msg: "This is a message payload marked as error" },
    { loglevel: "warn", msg: "This is a message payload marked as warning" },
    { loglevel: "log", msg: "This is a message payload marked as log" },
    { loglevel: "info", msg: "This is a message payload marked as info" },
    { loglevel: "log", msg: "This is a message payload marked as log" },
    { loglevel: "debug", msg: "You will not see this message marked as debug" },
    { loglevel: "something-else", msg: "You will not see this message marked as something-else" },
    { loglevel: "info", msg: "Some additional properties", method: "GET", statusCode: 200, path: "/" },
].forEach((payload) => setInterval(() => leg.write(payload), Math.random() * 60 * 1000));
