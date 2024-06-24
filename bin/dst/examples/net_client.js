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
    use: 'net-client',
    short: 'net echo client example',
    prepare: function (flags, _) {
        var address = flags.string({
            name: 'addr',
            short: 'a',
            usage: 'dial address',
            default: ":9000",
        });
        var network = flags.string({
            name: 'network',
            usage: 'network',
            values: [
                'tcp', 'tcp4', 'tcp6', 'unix',
            ],
            default: 'tcp',
        });
        var count = flags.number({
            name: 'count',
            short: 'c',
            usage: 'send message count',
            default: 10,
        });
        var timeout = flags.number({
            name: "timeout",
            usage: "connect timeout",
            default: 1000,
        });
        return function () {
            var v = timeout.value;
            var abort;
            var timer;
            if (Number.isSafeInteger(v) && v > 1) {
                abort = new net.AbortController();
                timer = setTimeout(function () {
                    abort.abort('dial timeout');
                }, v);
            }
            (0, sync_1.go)(function (co) {
                var c;
                try {
                    c = net.dial(co, {
                        network: network.value,
                        address: address.value,
                        signal: abort === null || abort === void 0 ? void 0 : abort.signal,
                    });
                }
                catch (e) {
                    console.log("connect error:", e);
                    return;
                }
                finally {
                    if (timer) {
                        clearTimeout(timer);
                    }
                }
                console.log("connect success: ".concat(c.localAddr, " -> ").concat(c.remoteAddr));
                var r = new net.TcpConnReaderWriter(c);
                try {
                    var buf = new Uint8Array(128);
                    for (var i = 0; count.value < 1 || i < count.value; i++) {
                        var msg = new TextEncoder().encode("\u9019\u500B\u7B2C ".concat(i + 1, " \u500B message"));
                        r.write(co, msg);
                        var n = r.read(co, buf);
                        if (!n) {
                            console.log("read eof");
                            break;
                        }
                        var data = buf.subarray(0, n);
                        console.log("recv:", new TextDecoder().decode(data), data);
                    }
                    r.close();
                    console.log("completed");
                }
                catch (e) {
                    r.close();
                    console.log("udp error: ".concat(e));
                }
            });
        };
    },
});
