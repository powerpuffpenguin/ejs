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
        return function () {
            // create a listener
            var l = net.listen({
                network: network.value,
                address: address.value,
            });
            console.log("tcp listen: ".concat(l.addr));
            l.onError = function (e) {
                console.log("accept err:", e);
            };
            var max = count.value;
            var i = 0;
            // accept connection
            l.onAccept = function (c) {
                onAccept(c);
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
var EchoService = /** @class */ (function () {
    function EchoService(c) {
        var _this = this;
        this.c = c;
        this.length_ = 0;
        c.onWritable = function () {
            var data = _this.data_;
            var len = _this.length_;
            if (data && len) {
                // Continue writing unsent data
                try {
                    c.write(data.subarray(0, len));
                }
                catch (e) {
                    console.log("write error", e);
                    c.close();
                }
            }
            // Resume data reading
            _this.serve();
        };
    }
    EchoService.prototype.serve = function () {
        var _this = this;
        // onMessage for read
        var c = this.c;
        c.onMessage = function (data) {
            try {
                console.log("recv ".concat(c.remoteAddr, ":"), data);
                if (c.write(data) === undefined) {
                    // write full，pause read
                    c.onMessage = undefined;
                    // clone data
                    var buf = _this.data_;
                    if (!buf || buf.length < data.length) {
                        buf = new Uint8Array(data.length);
                        _this.data_ = buf;
                    }
                    buf.set(data);
                    _this.length_ = data.length;
                }
            }
            catch (e) {
                console.log("write error", e);
                c.close();
            }
        };
    };
    return EchoService;
}());
function onAccept(c) {
    console.log("one in: ".concat(c.remoteAddr));
    c.onError = function (e) {
        console.log("one out", e);
    };
    // read and write net data
    new EchoService(c).serve();
}
