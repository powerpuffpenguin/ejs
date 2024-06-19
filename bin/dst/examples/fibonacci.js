"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
    return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (_) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
var flags_1 = require("../flags");
var sync_1 = require("ejs/sync");
exports.command = new flags_1.Command({
    use: 'fibonacci',
    short: 'fibonacci test',
    prepare: function (flags, _) {
        var n = flags.number({
            name: 'seed',
            short: 's',
            usage: 'fibonacci seed',
            default: 24,
        });
        var mode = flags.string({
            name: 'mode',
            short: 'm',
            usage: 'mode',
            values: [
                'sync',
                'co',
                'im',
                'coim',
                'pro',
                'async', // 8.313s
            ],
            default: 'sync',
        });
        return function () {
            var at = Date.now();
            switch (mode.value) {
                case 'co':
                    (0, sync_1.go)(function (co) {
                        fibonacciPrint("fibonacciCo", n.value, fibonacciCo(co, n.value), at);
                    });
                    break;
                case 'coim':
                    (0, sync_1.go)(function (co) {
                        fibonacciPrint("fibonacciCoIm", n.value, fibonacciCoIm(co, n.value), at);
                    });
                    break;
                case 'async':
                    fibonacciAsync(n.value).then(function (total) {
                        fibonacciPrint("fibonacciAsync", n.value, total, at);
                    });
                    break;
                case 'pro':
                    fibonacciPromise(n.value).then(function (total) {
                        fibonacciPrint("fibonacciPromise", n.value, total, at);
                    });
                    break;
                case 'im':
                    fibonacciImmediate(n.value, function (total) {
                        fibonacciPrint("fibonacciImmediate", n.value, total, at);
                    });
                    break;
                default:
                    fibonacciPrint("fibonacci", n.value, fibonacci(n.value), at);
                    break;
            }
        };
    },
});
function fibonacciPrint(tag, n, total, at) {
    var used = (Date.now() - at) / 1000;
    console.log("".concat(tag, "(").concat(n, ") == ").concat(total, ", used ").concat(used, "s"));
}
function fibonacciCoIm(co, n) {
    if (n < 2) {
        return co.yield(function (notify) {
            setImmediate(function () {
                notify.value(n);
            });
        });
    }
    return fibonacciCoIm(co, n - 1) + fibonacciCoIm(co, n - 2);
}
function fibonacciCo(co, n) {
    if (n < 2) {
        return co.yield(function (notify) {
            notify.value(n);
        });
    }
    return fibonacciCo(co, n - 1) + fibonacciCo(co, n - 2);
}
function fibonacci(n) {
    if (n < 2) {
        return n;
    }
    return fibonacci(n - 1) + fibonacci(n - 2);
}
function fibonacciAsync(n) {
    return __awaiter(this, void 0, void 0, function () {
        var _a;
        return __generator(this, function (_b) {
            switch (_b.label) {
                case 0:
                    if (n < 2) {
                        return [2 /*return*/, n];
                    }
                    return [4 /*yield*/, fibonacciAsync(n - 1)];
                case 1:
                    _a = (_b.sent());
                    return [4 /*yield*/, fibonacciAsync(n - 2)];
                case 2: return [2 /*return*/, _a + (_b.sent())];
            }
        });
    });
}
function fibonacciPromise(n) {
    if (n < 2) {
        return Promise.resolve(n);
    }
    return new Promise(function (resolve) {
        var sum = 0;
        var count = 0;
        var cb = function (v) {
            sum += v;
            ++count;
            if (count == 2) {
                resolve(sum);
            }
        };
        fibonacciPromise(n - 1).then(cb);
        fibonacciPromise(n - 2).then(cb);
    });
    // return Promise.all(
    //     [
    //         fibonacciPromise(n - 1),
    //         fibonacciPromise(n - 2),
    //     ],
    // ).then((a) => {
    //     return a[0] + a[1]
    // })
}
function fibonacciImmediate(n, cb) {
    if (n < 2) {
        setImmediate(function () {
            cb(n);
        });
        return;
    }
    var total = 0;
    var sum = 0;
    var xcb = function (v) {
        sum += v;
        if (++total == 2) {
            cb(sum);
        }
    };
    fibonacciImmediate(n - 1, xcb);
    fibonacciImmediate(n - 2, xcb);
}
