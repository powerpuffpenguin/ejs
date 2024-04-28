import { Command, Parser } from "./flags";

import { command as unit } from "./unit/command";

const root = new Command({
    use: "main.js",
    short: "iotjs example and test",
    run(_, cmd) {
        cmd.print()
    },
});
root.add(
    unit,
)

new Parser(root).parse(ejs.args.slice(2))
