import { Command, Parser } from "./flags";

import { command as unit } from "./unit/command";

import { command as timer } from "./examples/timer";
import { command as fibonacci } from "./examples/fibonacci";

import { command as net_server } from "./examples/net_server";
import { command as net_client } from "./examples/net_client";
import { command as udp_server } from "./examples/udp_server";
import { command as udp_client } from "./examples/udp_client";
import { command as http_server } from "./examples/http_server";
const root = new Command({
    use: "main.js",
    short: "iotjs example and test",
    run(_, cmd) {
        cmd.print()
    },
});
root.add(
    unit,
    timer,
    fibonacci,
    net_server,
    net_client,
    udp_server,
    udp_client,
    http_server,
)

new Parser(root).parse(ejs.args.slice(2))
