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
    use: 'udp-client',
    short: 'udp echo client example',
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
                'udp', 'udp4', 'udp6',
            ],
            default: 'udp',
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
            net.UdpConn.dialHost({
                network: network.value,
                address: address.value,
                signal: abort === null || abort === void 0 ? void 0 : abort.signal,
            }, function (c, e) {
                if (timer) {
                    clearTimeout(timer);
                }
                if (!c) {
                    console.log("connect error:", e);
                    return;
                }
                console.log("connect success: ".concat(c.localAddr, " -> ").concat(c.remoteAddr));
                new State(c, count.value).next();
            });
        };
    },
});
var State = /** @class */ (function () {
    function State(c, count) {
        this.c = c;
        this.count = count;
        this.step_ = 0;
        this.serve();
    }
    State.prototype.serve = function () {
        var _this = this;
        var c = this.c;
        c.onMessage = function (data) {
            var pre = _this.data_;
            if (!pre) {
                console.log("unexpected message:", data);
                c.close();
                return;
            }
            else if (!ejs.equal(data, pre)) {
                console.log("not matched message:", pre, data);
                c.close();
                return;
            }
            console.log("recv:", new TextDecoder().decode(data), data);
            _this.data_ = undefined;
            _this.next();
        };
    };
    State.prototype.next = function () {
        if (this.step_ >= this.count) {
            this.c.close();
            console.log("completed");
            return;
        }
        try {
            this.step_++;
            this.data_ = new TextEncoder().encode("\u9019\u500B\u7B2C ".concat(this.step_, " \u500B message"));
            this.c.write(this.data_);
        }
        catch (e) {
            console.log('write error', e);
            this.c.close();
        }
    };
    return State;
}());
