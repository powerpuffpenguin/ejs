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
var nil = undefined;
var ErrSyntax = strconv.ErrSyntax;
var ErrRange = strconv.ErrRange;
var parseUint64Tests = [
    { in: "", out: 0, err: ErrSyntax },
    { in: "0", out: 0, err: nil },
    { in: "1", out: 1, err: nil },
    { in: "12345", out: 12345, err: nil },
    { in: "012345", out: 12345, err: nil },
    { in: "12345x", out: 0, err: ErrSyntax },
    { in: "98765432100", out: 98765432100, err: nil },
    { in: "18446744073709551615", out: "18446744073709551615", err: nil },
    { in: "18446744073709551616", out: 0, err: ErrRange },
    { in: "18446744073709551620", out: 0, err: ErrRange },
    { in: "1_2_3_4_5", out: 0, err: ErrSyntax },
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "1__2345", out: 0, err: ErrSyntax },
    { in: "12345_", out: 0, err: ErrSyntax },
    { in: "-0", out: 0, err: ErrSyntax },
    { in: "-1", out: 0, err: ErrSyntax },
    { in: "+1", out: 0, err: ErrSyntax },
];
var parseUint64BaseTests = [
    { in: "", base: 0, out: 0, err: ErrSyntax },
    { in: "0", base: 0, out: 0, err: nil },
    { in: "0x", base: 0, out: 0, err: ErrSyntax },
    { in: "0X", base: 0, out: 0, err: ErrSyntax },
    { in: "1", base: 0, out: 1, err: nil },
    { in: "12345", base: 0, out: 12345, err: nil },
    { in: "012345", base: 0, out: 5349, err: nil },
    { in: "0x12345", base: 0, out: 0x12345, err: nil },
    { in: "0X12345", base: 0, out: 0x12345, err: nil },
    { in: "12345x", base: 0, out: 0, err: ErrSyntax },
    { in: "0xabcdefg123", base: 0, out: 0, err: ErrSyntax },
    { in: "123456789abc", base: 0, out: 0, err: ErrSyntax },
    { in: "98765432100", base: 0, out: 98765432100, err: nil },
    { in: "18446744073709551615", base: 0, out: "18446744073709551615", err: nil },
    { in: "18446744073709551616", base: 0, out: 0, err: ErrRange },
    { in: "18446744073709551620", base: 0, out: 0, err: ErrRange },
    { in: "0xFFFFFFFFFFFFFFFF", base: 0, out: "18446744073709551615", err: nil },
    { in: "0x10000000000000000", base: 0, out: 0, err: ErrRange },
    { in: "01777777777777777777777", base: 0, out: "18446744073709551615", err: nil },
    { in: "01777777777777777777778", base: 0, out: 0, err: ErrSyntax },
    { in: "02000000000000000000000", base: 0, out: 0, err: ErrRange },
    { in: "0200000000000000000000", base: 0, out: "2305843009213693952", err: nil },
    { in: "0b", base: 0, out: 0, err: ErrSyntax },
    { in: "0B", base: 0, out: 0, err: ErrSyntax },
    { in: "0b101", base: 0, out: 5, err: nil },
    { in: "0B101", base: 0, out: 5, err: nil },
    { in: "0o", base: 0, out: 0, err: ErrSyntax },
    { in: "0O", base: 0, out: 0, err: ErrSyntax },
    { in: "0o377", base: 0, out: 255, err: nil },
    { in: "0O377", base: 0, out: 255, err: nil },
    // underscores allowed with base == 0 only
    { in: "1_2_3_4_5", base: 0, out: 12345, err: nil },
    { in: "_12345", base: 0, out: 0, err: ErrSyntax },
    { in: "1__2345", base: 0, out: 0, err: ErrSyntax },
    { in: "12345_", base: 0, out: 0, err: ErrSyntax },
    { in: "1_2_3_4_5", base: 10, out: 0, err: ErrSyntax },
    { in: "_12345", base: 10, out: 0, err: ErrSyntax },
    { in: "1__2345", base: 10, out: 0, err: ErrSyntax },
    { in: "12345_", base: 10, out: 0, err: ErrSyntax },
    { in: "0x_1_2_3_4_5", base: 0, out: 0x12345, err: nil },
    { in: "_0x12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x1__2345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x1234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "0x12345_", base: 0, out: 0, err: ErrSyntax },
    { in: "1_2_3_4_5", base: 16, out: 0, err: ErrSyntax },
    { in: "_12345", base: 16, out: 0, err: ErrSyntax },
    { in: "1__2345", base: 16, out: 0, err: ErrSyntax },
    { in: "1234__5", base: 16, out: 0, err: ErrSyntax },
    { in: "12345_", base: 16, out: 0, err: ErrSyntax },
    { in: "0_1_2_3_4_5", base: 0, out: 5349, err: nil },
    { in: "_012345", base: 0, out: 0, err: ErrSyntax },
    { in: "0__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "01234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "012345_", base: 0, out: 0, err: ErrSyntax },
    { in: "0o_1_2_3_4_5", base: 0, out: 5349, err: nil },
    { in: "_0o12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0o__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0o1234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "0o12345_", base: 0, out: 0, err: ErrSyntax },
    { in: "0_1_2_3_4_5", base: 8, out: 0, err: ErrSyntax },
    { in: "_012345", base: 8, out: 0, err: ErrSyntax },
    { in: "0__12345", base: 8, out: 0, err: ErrSyntax },
    { in: "01234__5", base: 8, out: 0, err: ErrSyntax },
    { in: "012345_", base: 8, out: 0, err: ErrSyntax },
    { in: "0b_1_0_1", base: 0, out: 5, err: nil },
    { in: "_0b101", base: 0, out: 0, err: ErrSyntax },
    { in: "0b__101", base: 0, out: 0, err: ErrSyntax },
    { in: "0b1__01", base: 0, out: 0, err: ErrSyntax },
    { in: "0b10__1", base: 0, out: 0, err: ErrSyntax },
    { in: "0b101_", base: 0, out: 0, err: ErrSyntax },
    { in: "1_0_1", base: 2, out: 0, err: ErrSyntax },
    { in: "_101", base: 2, out: 0, err: ErrSyntax },
    { in: "1_01", base: 2, out: 0, err: ErrSyntax },
    { in: "10_1", base: 2, out: 0, err: ErrSyntax },
    { in: "101_", base: 2, out: 0, err: ErrSyntax },
];
var parseInt64Tests = [
    { in: "", out: 0, err: ErrSyntax },
    { in: "0", out: 0, err: nil },
    { in: "-0", out: 0, err: nil },
    { in: "+0", out: 0, err: nil },
    { in: "1", out: 1, err: nil },
    { in: "-1", out: -1, err: nil },
    { in: "+1", out: 1, err: nil },
    { in: "12345", out: 12345, err: nil },
    { in: "-12345", out: -12345, err: nil },
    { in: "012345", out: 12345, err: nil },
    { in: "-012345", out: -12345, err: nil },
    { in: "98765432100", out: 98765432100, err: nil },
    { in: "-98765432100", out: -98765432100, err: nil },
    { in: "9223372036854775807", out: "9223372036854775807", err: nil },
    { in: "-9223372036854775807", out: "-9223372036854775807", err: nil },
    { in: "9223372036854775808", out: 0, err: ErrRange },
    { in: "-9223372036854775808", out: "-9223372036854775808", err: nil },
    { in: "9223372036854775809", out: 0, err: ErrRange },
    { in: "-9223372036854775809", out: 0, err: ErrRange },
    { in: "-1_2_3_4_5", out: 0, err: ErrSyntax },
    { in: "-_12345", out: 0, err: ErrSyntax },
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "1__2345", out: 0, err: ErrSyntax },
    { in: "12345_", out: 0, err: ErrSyntax },
    { in: "123%45", out: 0, err: ErrSyntax },
];
var parseInt64BaseTests = [
    { in: "", base: 0, out: 0, err: ErrSyntax },
    { in: "0", base: 0, out: 0, err: nil },
    { in: "-0", base: 0, out: 0, err: nil },
    { in: "1", base: 0, out: 1, err: nil },
    { in: "-1", base: 0, out: -1, err: nil },
    { in: "12345", base: 0, out: 12345, err: nil },
    { in: "-12345", base: 0, out: -12345, err: nil },
    { in: "012345", base: 0, out: 5349, err: nil },
    { in: "-012345", base: 0, out: -5349, err: nil },
    { in: "0x12345", base: 0, out: 0x12345, err: nil },
    { in: "-0X12345", base: 0, out: -0x12345, err: nil },
    { in: "12345x", base: 0, out: 0, err: ErrSyntax },
    { in: "-12345x", base: 0, out: 0, err: ErrSyntax },
    { in: "98765432100", base: 0, out: 98765432100, err: nil },
    { in: "-98765432100", base: 0, out: -98765432100, err: nil },
    { in: "9223372036854775807", base: 0, out: "9223372036854775807", err: nil },
    { in: "-9223372036854775807", base: 0, out: "-9223372036854775807", err: nil },
    { in: "9223372036854775808", base: 0, out: 0, err: ErrRange },
    { in: "-9223372036854775808", base: 0, out: "-9223372036854775808", err: nil },
    { in: "9223372036854775809", base: 0, out: 0, err: ErrRange },
    { in: "-9223372036854775809", base: 0, out: 0, err: ErrRange },
    // other bases
    { in: "g", base: 17, out: 16, err: nil },
    { in: "10", base: 25, out: 25, err: nil },
    { in: "holycow", base: 35, out: (((((17 * 35 + 24) * 35 + 21) * 35 + 34) * 35 + 12) * 35 + 24) * 35 + 32, err: nil },
    { in: "holycow", base: 36, out: (((((17 * 36 + 24) * 36 + 21) * 36 + 34) * 36 + 12) * 36 + 24) * 36 + 32, err: nil },
    // base 2
    { in: "0", base: 2, out: 0, err: nil },
    { in: "-1", base: 2, out: -1, err: nil },
    { in: "1010", base: 2, out: 10, err: nil },
    { in: "1000000000000000", base: 2, out: 1 << 15, err: nil },
    { in: "111111111111111111111111111111111111111111111111111111111111111", base: 2, out: "9223372036854775807", err: nil },
    { in: "1000000000000000000000000000000000000000000000000000000000000000", base: 2, out: 0, err: ErrRange },
    { in: "-1000000000000000000000000000000000000000000000000000000000000000", base: 2, out: "-9223372036854775808", err: nil },
    { in: "-1000000000000000000000000000000000000000000000000000000000000001", base: 2, out: 0, err: ErrRange },
    // base 8
    { in: "-10", base: 8, out: -8, err: nil },
    { in: "57635436545", base: 8, out: 6416645477, err: nil },
    { in: "100000000", base: 8, out: 1 << 24, err: nil },
    // base 16
    { in: "10", base: 16, out: 16, err: nil },
    { in: "-123456789abcdef", base: 16, out: "-81985529216486895", err: nil },
    { in: "7fffffffffffffff", base: 16, out: "9223372036854775807", err: nil },
    // underscores
    { in: "-0x_1_2_3_4_5", base: 0, out: -0x12345, err: nil },
    { in: "0x_1_2_3_4_5", base: 0, out: 0x12345, err: nil },
    { in: "-_0x12345", base: 0, out: 0, err: ErrSyntax },
    { in: "_-0x12345", base: 0, out: 0, err: ErrSyntax },
    { in: "_0x12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x1__2345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x1234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "0x12345_", base: 0, out: 0, err: ErrSyntax },
    { in: "-0_1_2_3_4_5", base: 0, out: -5349, err: nil },
    { in: "0_1_2_3_4_5", base: 0, out: 5349, err: nil },
    { in: "-_012345", base: 0, out: 0, err: ErrSyntax },
    { in: "_-012345", base: 0, out: 0, err: ErrSyntax },
    { in: "_012345", base: 0, out: 0, err: ErrSyntax },
    { in: "0__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "01234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "012345_", base: 0, out: 0, err: ErrSyntax },
    { in: "+0xf", base: 0, out: 0xf, err: nil },
    { in: "-0xf", base: 0, out: -0xf, err: nil },
    { in: "0x+f", base: 0, out: 0, err: ErrSyntax },
    { in: "0x-f", base: 0, out: 0, err: ErrSyntax },
];
var parseUint32Tests = [
    { in: "", out: 0, err: ErrSyntax },
    { in: "0", out: 0, err: nil },
    { in: "1", out: 1, err: nil },
    { in: "12345", out: 12345, err: nil },
    { in: "012345", out: 12345, err: nil },
    { in: "12345x", out: 0, err: ErrSyntax },
    { in: "987654321", out: 987654321, err: nil },
    { in: "4294967295", out: 4294967295, err: nil },
    { in: "4294967296", out: 0, err: ErrRange },
    { in: "1_2_3_4_5", out: 0, err: ErrSyntax },
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "1__2345", out: 0, err: ErrSyntax },
    { in: "12345_", out: 0, err: ErrSyntax },
];
var parseInt32Tests = [
    { in: "", out: 0, err: ErrSyntax },
    { in: "0", out: 0, err: nil },
    { in: "-0", out: 0, err: nil },
    { in: "1", out: 1, err: nil },
    { in: "-1", out: -1, err: nil },
    { in: "12345", out: 12345, err: nil },
    { in: "-12345", out: -12345, err: nil },
    { in: "012345", out: 12345, err: nil },
    { in: "-012345", out: -12345, err: nil },
    { in: "12345x", out: 0, err: ErrSyntax },
    { in: "-12345x", out: 0, err: ErrSyntax },
    { in: "987654321", out: 987654321, err: nil },
    { in: "-987654321", out: -987654321, err: nil },
    { in: "2147483647", out: 2147483647, err: nil },
    { in: "-2147483647", out: -2147483647, err: nil },
    { in: "2147483648", out: 0, err: ErrRange },
    { in: "-2147483648", out: -2147483648, err: nil },
    { in: "2147483649", out: 0, err: ErrRange },
    { in: "-2147483649", out: 0, err: ErrRange },
    { in: "-1_2_3_4_5", out: 0, err: ErrSyntax },
    { in: "-_12345", out: 0, err: ErrSyntax },
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "1__2345", out: 0, err: ErrSyntax },
    { in: "12345_", out: 0, err: ErrSyntax },
    { in: "123%45out:", out: 0, err: ErrSyntax },
];
m.test("ParseUint32", function (assert) {
    var e_1, _a;
    try {
        for (var parseUint32Tests_1 = __values(parseUint32Tests), parseUint32Tests_1_1 = parseUint32Tests_1.next(); !parseUint32Tests_1_1.done; parseUint32Tests_1_1 = parseUint32Tests_1.next()) {
            var test_1 = parseUint32Tests_1_1.value;
            if (test_1.err) {
                try {
                    strconv.parseUint(test_1.in, 10, 32);
                }
                catch (e) {
                    if (e instanceof strconv.NumError) {
                        assert.equal(test_1.err.message, e.unwrap().message, test_1);
                        continue;
                    }
                    continue;
                }
                assert.true(false, test_1, "not throw", test_1);
            }
            else {
                assert.equal("".concat(test_1.out), "".concat(strconv.parseUint(test_1.in, 10, 32)), test_1);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (parseUint32Tests_1_1 && !parseUint32Tests_1_1.done && (_a = parseUint32Tests_1.return)) _a.call(parseUint32Tests_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
m.test("ParseUint64", function (assert) {
    var e_2, _a;
    try {
        for (var parseUint64Tests_1 = __values(parseUint64Tests), parseUint64Tests_1_1 = parseUint64Tests_1.next(); !parseUint64Tests_1_1.done; parseUint64Tests_1_1 = parseUint64Tests_1.next()) {
            var test_2 = parseUint64Tests_1_1.value;
            if (test_2.err) {
                try {
                    strconv.parseUint(test_2.in, 10, 64, true);
                }
                catch (e) {
                    if (e instanceof strconv.NumError) {
                        assert.equal(test_2.err.message, e.unwrap().message, test_2);
                        continue;
                    }
                    continue;
                }
                assert.true(false, test_2, "not throw", test_2);
            }
            else {
                assert.equal("".concat(test_2.out), "".concat(strconv.parseUint(test_2.in, 10, 64, true)), test_2);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (parseUint64Tests_1_1 && !parseUint64Tests_1_1.done && (_a = parseUint64Tests_1.return)) _a.call(parseUint64Tests_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
});
m.test("ParseUint64Base", function (assert) {
    var e_3, _a;
    try {
        for (var parseUint64BaseTests_1 = __values(parseUint64BaseTests), parseUint64BaseTests_1_1 = parseUint64BaseTests_1.next(); !parseUint64BaseTests_1_1.done; parseUint64BaseTests_1_1 = parseUint64BaseTests_1.next()) {
            var test_3 = parseUint64BaseTests_1_1.value;
            if (test_3.err) {
                try {
                    strconv.parseUint(test_3.in, test_3.base, 64, true);
                }
                catch (e) {
                    if (e instanceof strconv.NumError) {
                        assert.equal(test_3.err.message, e.unwrap().message, test_3);
                        continue;
                    }
                    continue;
                }
                assert.true(false, test_3, "not throw", test_3);
            }
            else {
                assert.equal("".concat(test_3.out), "".concat(strconv.parseUint(test_3.in, test_3.base, 64, true)), test_3);
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (parseUint64BaseTests_1_1 && !parseUint64BaseTests_1_1.done && (_a = parseUint64BaseTests_1.return)) _a.call(parseUint64BaseTests_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
m.test("ParseInt32", function (assert) {
    var e_4, _a;
    try {
        for (var parseInt32Tests_1 = __values(parseInt32Tests), parseInt32Tests_1_1 = parseInt32Tests_1.next(); !parseInt32Tests_1_1.done; parseInt32Tests_1_1 = parseInt32Tests_1.next()) {
            var test_4 = parseInt32Tests_1_1.value;
            if (test_4.err) {
                try {
                    strconv.parseInt(test_4.in, 10, 32, true);
                }
                catch (e) {
                    if (e instanceof strconv.NumError) {
                        assert.equal(test_4.err.message, e.unwrap().message, test_4);
                        continue;
                    }
                    continue;
                }
                assert.true(false, test_4, "not throw", test_4);
            }
            else {
                assert.equal("".concat(test_4.out), "".concat(strconv.parseInt(test_4.in, 10, 32, true)), test_4);
            }
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (parseInt32Tests_1_1 && !parseInt32Tests_1_1.done && (_a = parseInt32Tests_1.return)) _a.call(parseInt32Tests_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
});
m.test("ParseInt64", function (assert) {
    var e_5, _a;
    try {
        for (var parseInt64Tests_1 = __values(parseInt64Tests), parseInt64Tests_1_1 = parseInt64Tests_1.next(); !parseInt64Tests_1_1.done; parseInt64Tests_1_1 = parseInt64Tests_1.next()) {
            var test_5 = parseInt64Tests_1_1.value;
            if (test_5.err) {
                try {
                    strconv.parseInt(test_5.in, 10, 64, true);
                }
                catch (e) {
                    if (e instanceof strconv.NumError) {
                        assert.equal(test_5.err.message, e.unwrap().message, test_5);
                        continue;
                    }
                    continue;
                }
                assert.true(false, test_5, "not throw", test_5);
            }
            else {
                assert.equal("".concat(test_5.out), "".concat(strconv.parseInt(test_5.in, 10, 64, true)), test_5);
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (parseInt64Tests_1_1 && !parseInt64Tests_1_1.done && (_a = parseInt64Tests_1.return)) _a.call(parseInt64Tests_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
});
m.test("ParseInt64Base", function (assert) {
    var e_6, _a;
    try {
        for (var parseInt64BaseTests_1 = __values(parseInt64BaseTests), parseInt64BaseTests_1_1 = parseInt64BaseTests_1.next(); !parseInt64BaseTests_1_1.done; parseInt64BaseTests_1_1 = parseInt64BaseTests_1.next()) {
            var test_6 = parseInt64BaseTests_1_1.value;
            if (test_6.err) {
                try {
                    strconv.parseInt(test_6.in, test_6.base, 64, true);
                }
                catch (e) {
                    if (e instanceof strconv.NumError) {
                        assert.equal(test_6.err.message, e.unwrap().message, test_6);
                        continue;
                    }
                    continue;
                }
                assert.true(false, test_6, "not throw", test_6);
            }
            else {
                assert.equal("".concat(test_6.out), "".concat(strconv.parseInt(test_6.in, test_6.base, 64, true)), test_6);
            }
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (parseInt64BaseTests_1_1 && !parseInt64BaseTests_1_1.done && (_a = parseInt64BaseTests_1.return)) _a.call(parseInt64BaseTests_1);
        }
        finally { if (e_6) throw e_6.error; }
    }
});
m.test("Atoi", function (assert) {
    var e_7, _a;
    try {
        for (var parseInt64Tests_2 = __values(parseInt64Tests), parseInt64Tests_2_1 = parseInt64Tests_2.next(); !parseInt64Tests_2_1.done; parseInt64Tests_2_1 = parseInt64Tests_2.next()) {
            var test_7 = parseInt64Tests_2_1.value;
            if (test_7.err) {
                try {
                    strconv.atoi(test_7.in, true);
                }
                catch (e) {
                    if (e instanceof strconv.NumError) {
                        assert.equal(test_7.err.message, e.unwrap().message, test_7);
                        continue;
                    }
                    continue;
                }
                assert.true(false, test_7, "not throw", test_7);
            }
            else {
                assert.equal("".concat(test_7.out), "".concat(strconv.atoi(test_7.in, true)), test_7);
            }
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (parseInt64Tests_2_1 && !parseInt64Tests_2_1.done && (_a = parseInt64Tests_2.return)) _a.call(parseInt64Tests_2);
        }
        finally { if (e_7) throw e_7.error; }
    }
});
