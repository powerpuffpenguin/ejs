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
var os = __importStar(require("ejs/os"));
var sync_1 = require("ejs/sync");
exports.command = new flags_1.Command({
    use: 'net-server',
    short: 'net echo server example',
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
                'tcp', 'tcp4', 'tcp6', 'unix',
            ],
            default: 'tcp',
        });
        var count = flags.number({
            name: 'count',
            short: 'c',
            usage: 'max service count',
            default: -1,
        });
        var sync = flags.bool({
            name: 'sync',
            usage: 'sync listener',
            default: false,
        });
        var backlog = flags.number({
            name: 'backlog',
            usage: 'accept backlog',
            default: 5,
        });
        var certFile = flags.string({
            name: 'certFile',
            usage: 'x509 cert file path',
        });
        var keyFile = flags.string({
            name: 'keyFile',
            usage: 'x509 key file path',
        });
        return function () {
            // create a listener
            var tls;
            if (certFile.value != '' && keyFile.value != '') {
                tls = {
                    certificate: [
                        {
                            cert: os.readTextFileSync(certFile.value),
                            key: os.readTextFileSync(keyFile.value),
                        }
                    ]
                };
            }
            var l = net.listen({
                network: network.value,
                address: address.value,
                sync: sync.value,
                backlog: backlog.value,
                tls: tls
            });
            if (sync.value) {
                if (tls) {
                    console.log("tls sync listen: ".concat(l.addr));
                }
                else {
                    console.log("sync listen: ".concat(l.addr));
                }
            }
            else {
                if (tls) {
                    console.log("tls listen: ".concat(l.addr));
                }
                else {
                    console.log("listen: ".concat(l.addr));
                }
            }
            l.onError = function (e) {
                console.log("accept err:", e);
            };
            var max = count.value;
            var i = 0;
            // accept connection
            l.onAccept = function (c) {
                (0, sync_1.go)(function (co) {
                    onAccept(co, c);
                });
                // Shut down the service after processing max requests
                if (max > 0) {
                    i++;
                    if (i >= max) {
                        l.close();
                    }
                }
            };
        };
    },
});
function onAccept(co, c) {
    console.log("one in: ".concat(c.remoteAddr));
    var rw = new net.TcpConnReaderWriter(c);
    var buf = new Uint8Array(1024 * 32);
    try {
        while (true) {
            var n = rw.read(co, buf);
            if (!n) {
                break;
            }
            var data = buf.subarray(0, n);
            console.log("recv ".concat(c.remoteAddr, ":"), data);
            while (data.length) {
                n = rw.write(co, data);
                data = data.subarray(n);
            }
        }
    }
    catch (e) {
        console.log("error", e);
        rw.close();
    }
}
