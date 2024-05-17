import { Command, Parser } from "./flags";

import { command as unit } from "./unit/command";

import { command as timer } from "./examples/timer";

import { command as net_server } from "./examples/net_server";
import { command as net_client } from "./examples/net_client";
import { command as udp_server } from "./examples/udp_server";
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
    net_server,
    net_client,
    udp_server,
)

new Parser(root).parse(ejs.args.slice(2))
