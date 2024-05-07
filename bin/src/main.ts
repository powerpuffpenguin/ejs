import { Command, Parser } from "./flags";

import { command as unit } from "./unit/command";

import { command as net_server } from "./examples/net_server";

const root = new Command({
    use: "main.js",
    short: "iotjs example and test",
    run(_, cmd) {
        cmd.print()
    },
});
root.add(
    unit,
    net_server,
)

new Parser(root).parse(ejs.args.slice(2))
