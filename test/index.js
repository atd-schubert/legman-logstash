"use strict";
require("../lib/legman-logstash.spec");

if (process.env.LEAKAGE_TEST) {
    require("../lib/legman-logstash.leakage");
}
