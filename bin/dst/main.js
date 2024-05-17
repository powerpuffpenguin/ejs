"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var flags_1 = require("./flags");
var command_1 = require("./unit/command");
var timer_1 = require("./examples/timer");
var net_server_1 = require("./examples/net_server");
var net_client_1 = require("./examples/net_client");
var udp_server_1 = require("./examples/udp_server");
var udp_client_1 = require("./examples/udp_client");
var root = new flags_1.Command({
    use: "main.js",
    short: "iotjs example and test",
    run: function (_, cmd) {
        cmd.print();
    },
});
root.add(command_1.command, timer_1.command, net_server_1.command, net_client_1.command, udp_server_1.command, udp_client_1.command);
new flags_1.Parser(root).parse(ejs.args.slice(2));
