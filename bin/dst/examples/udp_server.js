"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
var flags_1 = require("../flags");
var net = __importStar(require("ejs/net"));
var sync_1 = require("ejs/sync");
exports.command = new flags_1.Command({
    use: 'udp-server',
    short: 'udp echo server example',
    prepare: function (flags, _) {
        var address = flags.string({
            name: 'addr',
            short: 'a',
            usage: 'listen address',
            default: ":9000",
        });
        var network = flags.string({
            name: 'network',
            usage: 'network',
            values: [
                'udp', 'udp4', 'udp6',
            ],
            default: 'udp',
        });
        var count = flags.number({
            name: 'count',
            short: 'c',
            usage: 'max service count',
            default: -1,
        });
        return function () {
            // create a listener
            var c = net.UdpConn.listen({
                network: network.value,
                address: address.value,
            });
            console.log("listen: ".concat(c.localAddr));
            var max = count.value;
            var i = 0;
            var buf = new Uint8Array(1024 * 32);
            var addr = new net.UdpAddr();
            var r = new net.UdpConnReader(c, undefined, true);
            (0, sync_1.go)(function (co) {
                try {
                    for (var i_1 = 0; max < 1 || i_1 < max; i_1++) {
                        var data = r.read(co, addr);
                        console.log("recv ".concat(addr, ":"), data);
                        c.writeTo(data, addr);
                    }
                }
                catch (e) {
                    console.log("error: ".concat(e));
                }
                finally {
                    c.close();
                }
            });
            // // recv
            // c.onReadable = (r) => {
            //     const n = r.read(buf, addr)
            //     const data = buf.subarray(0, n)
            //     console.log(`recv ${addr}:`, data)
            //     c.writeTo(data, addr)
            //     // Shut down the service after processing max requests
            //     if (max > 0) {
            //         i++
            //         if (i >= max) {
            //             c.close()
            //         }
            //     }
            // }
        };
    },
});
