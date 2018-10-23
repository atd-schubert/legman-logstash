# Legman-Logstash

Legman-Logstash is a writeable stream build for sending messages from a [Legman](https://github.com/atd-schubert/legman)
stream into a [Logstash](https://www.elastic.co/products/logstash) instance.

## How to use in NodeJS

At first you have to install this module and Legman into your application:

```bash
npm i --save legman legman-logstash
# OR
yarn add legman legman-logstash
```

After that you can import and use LegmanLogstash in your code.

### Using Legman with Logstash in TypeScript

```typescript
import Legman from "legman";
import LegmanLogstash from "legman-logstash";

const logstashPort: number = 9500;
const logstashHostname: string | undefined = "logstash";
const logstash = new LegmanLogstash(logstashPort, logstashHostname);

const loggerLeg = new Legman({app: "Identifier for my application"});
loggerLeg
    .filter((message) => ["error", "warn", "info"].includes(message.loglevel)) // pre-filter messages for Logstash
    .pipe(logstash);
const httpLogger = loggerLeg.influx({context: "http"}, true);

app.get("/example", (req, res, next) => {
    httpLogger.write({
        msg: "Incoming request",
        loglevel: "info",
        path: req.url,
        method: req.method,
    });
    // ...
});
```

### Using Legman with Logstash in JavaScript

```typescript
const Legman = require("legman");
const LegmanLogstash = require("legman-logstash");

const logstashPort = 9500;
const logstashHostname = "logstash";
const logstash = new LegmanLogstash(logstashPort, logstashHostname);

const loggerLeg = new Legman({app: "Identifier for my application"});
loggerLeg
    .filter((message) => ["error", "warn", "info"].includes(message.loglevel)) // pre-filter messages for Logstash
    .pipe(logstash);
const httpLogger = loggerLeg.influx({context: "http"}, true);

app.get("/example", (req, res, next) => {
    httpLogger.write({
        msg: "Incoming request",
        loglevel: "info",
        path: req.url,
        method: req.method,
    });
    // ...
});
```

## How to configure Logstash

Logstash should use the `tcp` input with `json_lines` codec. Take a look at the example and the `docker-compose.yml`.

Example configuration:
```
input { tcp { port => 9500 codec => json_lines } } output { elasticsearch { index => "example" hosts => ["elasticsearch:9200"] } }
```

## Example

You can run a full integrated example with the ELK complete stack by running `npm run docker:example`. After that you
can open Kibana with your browser on its default port `5601` on your docker host.

On your first visit you have to create an index for Elasticsearch with the help of Kibana. Click on `Management` and
take the link to `Index Patterns` on the `Kibana` tab. Input `example` as index pattern and click next step. Select a
timestamp from the dropdown menu. `@timestamp` is the one from Logstash and `timestamp` is the one from your
application. I would recommend the `timestamp` property, because it is the timestamp when the message was emitted and
not the timestamp when the message was received by Logstash.

The example will log random messages from NodeJS to Logstash to ElasticSearch to Kibana. The source code of the example
is located at the `./example` folder.

## Script tasks

* `transpile`: Transpiles the library from TypeScript into JavaScript with type declarations
* `lint`: Lints your code against the recommend TSLint ruleset.
* `test`: Transpiles, lints and runs software-tests with coverage.
* `leakage`: Transpiles, lints and runs software-tests with leakage tests.
* `docker:lint`: Runs the `lint` task in a docker environment.
* `docker:test`: Runs the `test` task in a docker environment.
* `docker:leakage`: Runs the `leakage` task in a docker environment.
* `docker:example`: Runs an example within the docker environment.

## License

This module is under [ISC license](LICENSE) copyright 2018 by [Arne Schubert](mailto:atd.schubert@gmail.com)
