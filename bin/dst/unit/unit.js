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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.run = exports.test = exports.Test = exports.Module = exports.Assert = void 0;
var Keys = /** @class */ (function () {
    function Keys() {
        this.keys_ = new Map();
        this.arrs_ = new Array();
    }
    Keys.prototype.get = function (k) {
        return this.keys_.get(k);
    };
    Keys.prototype.put = function (k, v) {
        if (this.keys_.has(k)) {
            throw new Error("key already exists: ".concat(k));
        }
        this.keys_.set(k, v);
        this.arrs_.push(k);
    };
    Keys.prototype.keys = function () {
        return this.arrs_;
    };
    return Keys;
}());
var AssertQuit = /** @class */ (function () {
    function AssertQuit() {
    }
    return AssertQuit;
}());
var assertQuit = new AssertQuit();
var Assert = /** @class */ (function () {
    function Assert(module, name) {
        this.module = module;
        this.name = name;
    }
    Assert.prototype.equal = function (expect, actual) {
        var msg = [];
        for (var _i = 2; _i < arguments.length; _i++) {
            msg[_i - 2] = arguments[_i];
        }
        var s_expect = JSON.stringify(expect);
        var s_actual = JSON.stringify(actual);
        if (s_expect == s_actual) {
            return;
        }
        console.log("--- FAIL: ".concat(this.name));
        console.log("  Error: not equal");
        console.log("  Expect:", s_expect);
        console.log("  Actual:", s_actual);
        if (msg.length != 0) {
            console.log.apply(console, __spreadArray(["  Message:"], __read(msg), false));
        }
        var stack = new Error().stack;
        if (typeof stack === "string") {
            console.log("  Stack:", stack);
        }
        throw assertQuit;
    };
    return Assert;
}());
exports.Assert = Assert;
var Module = /** @class */ (function () {
    function Module(name) {
        this.name = name;
        this.keys_ = new Keys();
    }
    /**
     * 註冊測試函數
     */
    Module.prototype.test = function (name, run) {
        this.keys_.put(name, run);
    };
    Module.prototype.run = function (func, fail) {
        return __awaiter(this, void 0, void 0, function () {
            var at, passed, failed, matched, first, _a, _b, key, func_1, func_1_1, match, f, assert, at_1, used, e_1, used, e_2_1, used;
            var e_2, _c, e_3, _d;
            return __generator(this, function (_e) {
                switch (_e.label) {
                    case 0:
                        at = Date.now();
                        passed = 0;
                        failed = 0;
                        matched = false;
                        first = true;
                        _e.label = 1;
                    case 1:
                        _e.trys.push([1, 8, 9, 10]);
                        _a = __values(this.keys_.keys()), _b = _a.next();
                        _e.label = 2;
                    case 2:
                        if (!!_b.done) return [3 /*break*/, 7];
                        key = _b.value;
                        if (func.length != 0) {
                            matched = false;
                            try {
                                for (func_1 = (e_3 = void 0, __values(func)), func_1_1 = func_1.next(); !func_1_1.done; func_1_1 = func_1.next()) {
                                    match = func_1_1.value;
                                    if (match.match(key)) {
                                        matched = true;
                                        break;
                                    }
                                }
                            }
                            catch (e_3_1) { e_3 = { error: e_3_1 }; }
                            finally {
                                try {
                                    if (func_1_1 && !func_1_1.done && (_d = func_1.return)) _d.call(func_1);
                                }
                                finally { if (e_3) throw e_3.error; }
                            }
                            if (!matched) {
                                return [3 /*break*/, 6];
                            }
                        }
                        if (first) {
                            first = false;
                            console.log(this.name);
                        }
                        f = this.keys_.get(key);
                        assert = new Assert(this.name, key);
                        at_1 = Date.now();
                        _e.label = 3;
                    case 3:
                        _e.trys.push([3, 5, , 6]);
                        return [4 /*yield*/, f(assert)];
                    case 4:
                        _e.sent();
                        used = (Date.now() - at_1) / 1000;
                        console.log(" - ".concat(key, " passed, used ").concat(used, "s"));
                        passed++;
                        return [3 /*break*/, 6];
                    case 5:
                        e_1 = _e.sent();
                        used = (Date.now() - at_1) / 1000;
                        if (e_1 !== assertQuit) {
                            console.trace("".concat(e_1));
                        }
                        console.log(" - ".concat(key, " failed, used ").concat(used, "s"));
                        failed++;
                        return [3 /*break*/, 6];
                    case 6:
                        _b = _a.next();
                        return [3 /*break*/, 2];
                    case 7: return [3 /*break*/, 10];
                    case 8:
                        e_2_1 = _e.sent();
                        e_2 = { error: e_2_1 };
                        return [3 /*break*/, 10];
                    case 9:
                        try {
                            if (_b && !_b.done && (_c = _a.return)) _c.call(_a);
                        }
                        finally { if (e_2) throw e_2.error; }
                        return [7 /*endfinally*/];
                    case 10:
                        if (passed || failed) {
                            used = (Date.now() - at) / 1000;
                            console.log(" * ".concat(passed, " passed, ").concat(failed, " failed, used ").concat(used, "s"));
                        }
                        return [2 /*return*/, [passed, failed]];
                }
            });
        });
    };
    return Module;
}());
exports.Module = Module;
var Test = /** @class */ (function () {
    function Test() {
        this.keys_ = new Keys();
    }
    Test.prototype.keys = function () {
        return this.keys_;
    };
    /**
     * 返回測試模塊，如果不存在就創建一個新的
     */
    Test.prototype.module = function (name) {
        var m = this.keys_.get(name);
        if (m) {
            return m;
        }
        m = new Module(name);
        this.keys_.put(name, m);
        return m;
    };
    return Test;
}());
exports.Test = Test;
exports.test = new Test();
/**
 * 運行所有註冊的測試代碼
 * @param module 設置要測試的模塊
 * @param func 設置要測試的函數
 * @param fail 如果爲 true 會忽略未通過的測試，繼續後續未完成的測試
 */
function run(module, func, fail) {
    return __awaiter(this, void 0, void 0, function () {
        var at, n, passed, failed, keys, matched, _a, _b, key, module_1, module_1_1, match, _c, v0, v1, e_4_1, used;
        var e_4, _d, e_5, _e;
        return __generator(this, function (_f) {
            switch (_f.label) {
                case 0:
                    at = Date.now();
                    n = 0;
                    passed = 0;
                    failed = 0;
                    keys = exports.test.keys();
                    matched = false;
                    _f.label = 1;
                case 1:
                    _f.trys.push([1, 6, 7, 8]);
                    _a = __values(keys.keys()), _b = _a.next();
                    _f.label = 2;
                case 2:
                    if (!!_b.done) return [3 /*break*/, 5];
                    key = _b.value;
                    if (module.length != 0) {
                        matched = false;
                        try {
                            for (module_1 = (e_5 = void 0, __values(module)), module_1_1 = module_1.next(); !module_1_1.done; module_1_1 = module_1.next()) {
                                match = module_1_1.value;
                                if (match.match(key)) {
                                    matched = true;
                                    break;
                                }
                            }
                        }
                        catch (e_5_1) { e_5 = { error: e_5_1 }; }
                        finally {
                            try {
                                if (module_1_1 && !module_1_1.done && (_e = module_1.return)) _e.call(module_1);
                            }
                            finally { if (e_5) throw e_5.error; }
                        }
                        if (!matched) {
                            return [3 /*break*/, 4];
                        }
                    }
                    return [4 /*yield*/, keys.get(key).run(func, fail)];
                case 3:
                    _c = __read.apply(void 0, [_f.sent(), 2]), v0 = _c[0], v1 = _c[1];
                    if (!v0 && !v1) {
                        return [3 /*break*/, 4];
                    }
                    n++;
                    passed += v0;
                    failed += v1;
                    if (!fail && v1) {
                        return [3 /*break*/, 5];
                    }
                    _f.label = 4;
                case 4:
                    _b = _a.next();
                    return [3 /*break*/, 2];
                case 5: return [3 /*break*/, 8];
                case 6:
                    e_4_1 = _f.sent();
                    e_4 = { error: e_4_1 };
                    return [3 /*break*/, 8];
                case 7:
                    try {
                        if (_b && !_b.done && (_d = _a.return)) _d.call(_a);
                    }
                    finally { if (e_4) throw e_4.error; }
                    return [7 /*endfinally*/];
                case 8:
                    used = (Date.now() - at) / 1000;
                    console.log("test ".concat(n, " modules, ").concat(passed, " passed, ").concat(failed, " failed, used ").concat(used, "s"));
                    if (failed > 0) {
                        ejs.exit(1);
                    }
                    return [2 /*return*/];
            }
        });
    });
}
exports.run = run;
