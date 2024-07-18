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
var unit_1 = require("../../unit/unit");
var strconv = __importStar(require("ejs/strconv"));
var m = unit_1.test.module("ejs/strconv");
var itob64tests = [
    { "_s": "0", "in": "0000000000000000", "base": 10, "out": "0" },
    { "_s": "1", "in": "0000000000000001", "base": 10, "out": "1" },
    { "_s": "-1", "in": "ffffffffffffffff", "base": 10, "out": "-1" },
    { "_s": "12345678", "in": "0000000000bc614e", "base": 10, "out": "12345678" },
    { "_s": "-987654321", "in": "ffffffffc521974f", "base": 10, "out": "-987654321" },
    { "_s": "2147483647", "in": "000000007fffffff", "base": 10, "out": "2147483647" },
    { "_s": "-2147483647", "in": "ffffffff80000001", "base": 10, "out": "-2147483647" },
    { "_s": "2147483648", "in": "0000000080000000", "base": 10, "out": "2147483648" },
    { "_s": "-2147483648", "in": "ffffffff80000000", "base": 10, "out": "-2147483648" },
    { "_s": "2147483649", "in": "0000000080000001", "base": 10, "out": "2147483649" },
    { "_s": "-2147483649", "in": "ffffffff7fffffff", "base": 10, "out": "-2147483649" },
    { "_s": "4294967295", "in": "00000000ffffffff", "base": 10, "out": "4294967295" },
    { "_s": "-4294967295", "in": "ffffffff00000001", "base": 10, "out": "-4294967295" },
    { "_s": "4294967296", "in": "0000000100000000", "base": 10, "out": "4294967296" },
    { "_s": "-4294967296", "in": "ffffffff00000000", "base": 10, "out": "-4294967296" },
    { "_s": "4294967297", "in": "0000000100000001", "base": 10, "out": "4294967297" },
    { "_s": "-4294967297", "in": "fffffffeffffffff", "base": 10, "out": "-4294967297" },
    { "_s": "1125899906842624", "in": "0004000000000000", "base": 10, "out": "1125899906842624" },
    { "_s": "9223372036854775807", "in": "7fffffffffffffff", "base": 10, "out": "9223372036854775807" },
    { "_s": "-9223372036854775807", "in": "8000000000000001", "base": 10, "out": "-9223372036854775807" },
    { "_s": "-9223372036854775808", "in": "8000000000000000", "base": 10, "out": "-9223372036854775808" },
    { "_s": "0", "in": "0000000000000000", "base": 2, "out": "0" },
    { "_s": "10", "in": "000000000000000a", "base": 2, "out": "1010" },
    { "_s": "-1", "in": "ffffffffffffffff", "base": 2, "out": "-1" },
    { "_s": "32768", "in": "0000000000008000", "base": 2, "out": "1000000000000000" },
    { "_s": "-8", "in": "fffffffffffffff8", "base": 8, "out": "-10" },
    { "_s": "6416645477", "in": "000000017e763d65", "base": 8, "out": "57635436545" },
    { "_s": "16777216", "in": "0000000001000000", "base": 8, "out": "100000000" },
    { "_s": "16", "in": "0000000000000010", "base": 16, "out": "10" },
    { "_s": "-81985529216486895", "in": "fedcba9876543211", "base": 16, "out": "-123456789abcdef" },
    { "_s": "9223372036854775807", "in": "7fffffffffffffff", "base": 16, "out": "7fffffffffffffff" },
    { "_s": "9223372036854775807", "in": "7fffffffffffffff", "base": 2, "out": "111111111111111111111111111111111111111111111111111111111111111" },
    { "_s": "-9223372036854775808", "in": "8000000000000000", "base": 2, "out": "-1000000000000000000000000000000000000000000000000000000000000000" },
    { "_s": "16", "in": "0000000000000010", "base": 17, "out": "g" },
    { "_s": "25", "in": "0000000000000019", "base": 25, "out": "10" },
    { "_s": "32544027072", "in": "0000000793c671c0", "base": 35, "out": "holycow" },
    { "_s": "38493362624", "in": "00000008f66219c0", "base": 36, "out": "holycow" },
];
m.test("Itoa", function (assert) {
    var e_1, _a;
    var s;
    var formatInt = strconv._formatInt;
    var formatUint = strconv._formatUint;
    var itoa = strconv._itoa;
    try {
        for (var itob64tests_1 = __values(itob64tests), itob64tests_1_1 = itob64tests_1.next(); !itob64tests_1_1.done; itob64tests_1_1 = itob64tests_1.next()) {
            var test_1 = itob64tests_1_1.value;
            s = formatInt(test_1.in, test_1.base);
            assert.equal(test_1.out, s, test_1);
            var buf = new TextEncoder().encode("abc");
            var builder = new strconv.StringBuilder(buf, buf.length);
            builder._appendInt(test_1.in, test_1.base);
            assert.equal("abc" + test_1.out, builder.toString(), test_1);
            builder.reset();
            builder._appendInt(test_1.in, test_1.base);
            assert.equal(test_1.out, builder.toString(), test_1);
            if (test_1._s[0] != "-") {
                s = formatUint(test_1.in, test_1.base);
                assert.equal(test_1.out, s, test_1);
                var buf_1 = new TextEncoder().encode("abc");
                var builder_1 = new strconv.StringBuilder(buf_1, buf_1.length);
                builder_1._appendInt(test_1.in, test_1.base);
                assert.equal("abc" + test_1.out, builder_1.toString(), test_1);
                builder_1.reset();
                builder_1._appendInt(test_1.in, test_1.base);
                assert.equal(test_1.out, builder_1.toString(), test_1);
            }
            if (test_1.base == 10) {
                s = itoa(test_1.in);
                assert.equal(test_1.out, s, test_1);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (itob64tests_1_1 && !itob64tests_1_1.done && (_a = itob64tests_1.return)) _a.call(itob64tests_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
