import { Command, Parser } from "./flags";

import { command as unit } from "./unit/command";

import { command as tcp_server } from "./examples/tcp_server";

const root = new Command({
    use: "main.js",
    short: "iotjs example and test",
    run(_, cmd) {
        cmd.print()
    },
});
root.add(
    unit,
    tcp_server,
)

new Parser(root).parse(ejs.args.slice(2))
