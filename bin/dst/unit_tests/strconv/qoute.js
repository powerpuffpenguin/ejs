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
var hex = __importStar(require("ejs/encoding/hex"));
var m = unit_1.test.module("ejs/strconv");
var quotetests = [
    { "in": "07080c0d0a090b", "out": "225c615c625c665c725c6e5c745c7622", "ascii": "225c615c625c665c725c6e5c745c7622", "graphic": "225c615c625c665c725c6e5c745c7622" },
    { "in": "5c", "out": "225c5c22", "ascii": "225c5c22", "graphic": "225c5c22" },
    { "in": "616263ff646566", "out": "226162635c78666664656622", "ascii": "226162635c78666664656622", "graphic": "226162635c78666664656622" },
    { "in": "e298ba", "out": "22e298ba22", "ascii": "225c753236336122", "graphic": "22e298ba22" },
    { "in": "f48fbfbf", "out": "225c55303031306666666622", "ascii": "225c55303031306666666622", "graphic": "225c55303031306666666622" },
    { "in": "04", "out": "225c78303422", "ascii": "225c78303422", "graphic": "225c78303422" },
    { "in": "21c2a021e2808021e3808021", "out": "22215c7530306130215c7532303030215c75333030302122", "ascii": "22215c7530306130215c7532303030215c75333030302122", "graphic": "2221c2a021e2808021e380802122" },
    { "in": "7f", "out": "225c78376622", "ascii": "225c78376622", "graphic": "225c78376622" },
];
m.test("Quote", function (assert) {
    var e_1, _a;
    try {
        for (var quotetests_1 = __values(quotetests), quotetests_1_1 = quotetests_1.next(); !quotetests_1_1.done; quotetests_1_1 = quotetests_1.next()) {
            var test_1 = quotetests_1_1.value;
            var out = strconv.quote(hex.decode(test_1.in));
            assert.equal(test_1.out, hex.encodeToString(out), test_1);
            var builder = new strconv.StringBuilder();
            builder.appendQuote(hex.decode(test_1.in));
            assert.equal(test_1.out, hex.encodeToString(builder.toBuffer()), test_1);
            var buf = new TextEncoder().encode("abc");
            builder = new strconv.StringBuilder(buf, buf.length);
            builder.appendQuote(hex.decode(test_1.in));
            assert.equal(buf, builder.toBuffer().subarray(0, buf.length), test_1);
            assert.equal(test_1.out, hex.encodeToString(builder.toBuffer().subarray(buf.length)), test_1);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (quotetests_1_1 && !quotetests_1_1.done && (_a = quotetests_1.return)) _a.call(quotetests_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
m.test("QuoteToASCII", function (assert) {
    var e_2, _a;
    try {
        for (var quotetests_2 = __values(quotetests), quotetests_2_1 = quotetests_2.next(); !quotetests_2_1.done; quotetests_2_1 = quotetests_2.next()) {
            var test_2 = quotetests_2_1.value;
            var out = strconv.quoteToASCII(hex.decode(test_2.in));
            assert.equal(test_2.ascii, hex.encodeToString(out), test_2);
            var builder = new strconv.StringBuilder();
            builder.appendQuoteToASCII(hex.decode(test_2.in));
            assert.equal(test_2.ascii, hex.encodeToString(builder.toBuffer()), test_2);
            var buf = new TextEncoder().encode("abc");
            builder = new strconv.StringBuilder(buf, buf.length);
            builder.appendQuoteToASCII(hex.decode(test_2.in));
            assert.equal(buf, builder.toBuffer().subarray(0, buf.length), test_2);
            assert.equal(test_2.ascii, hex.encodeToString(builder.toBuffer().subarray(buf.length)), test_2);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (quotetests_2_1 && !quotetests_2_1.done && (_a = quotetests_2.return)) _a.call(quotetests_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
});
m.test("QuoteToGraphic", function (assert) {
    var e_3, _a;
    try {
        for (var quotetests_3 = __values(quotetests), quotetests_3_1 = quotetests_3.next(); !quotetests_3_1.done; quotetests_3_1 = quotetests_3.next()) {
            var test_3 = quotetests_3_1.value;
            var out = strconv.quoteToGraphic(hex.decode(test_3.in));
            assert.equal(test_3.graphic, hex.encodeToString(out), test_3);
            var builder = new strconv.StringBuilder();
            builder.appendQuoteToGraphic(hex.decode(test_3.in));
            assert.equal(test_3.graphic, hex.encodeToString(builder.toBuffer()), test_3);
            var buf = new TextEncoder().encode("abc");
            builder = new strconv.StringBuilder(buf, buf.length);
            builder.appendQuoteToGraphic(hex.decode(test_3.in));
            assert.equal(buf, builder.toBuffer().subarray(0, buf.length), test_3);
            assert.equal(test_3.graphic, hex.encodeToString(builder.toBuffer().subarray(buf.length)), test_3);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (quotetests_3_1 && !quotetests_3_1.done && (_a = quotetests_3.return)) _a.call(quotetests_3);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
var quoterunetests = [
    { "in": 97, "out": "276127", "ascii": "276127", "graphic": "276127" },
    { "in": 7, "out": "275c6127", "ascii": "275c6127", "graphic": "275c6127" },
    { "in": 92, "out": "275c5c27", "ascii": "275c5c27", "graphic": "275c5c27" },
    { "in": 255, "out": "27c3bf27", "ascii": "275c753030666627", "graphic": "27c3bf27" },
    { "in": 9786, "out": "27e298ba27", "ascii": "275c753236336127", "graphic": "27e298ba27" },
    { "in": 57005, "out": "27efbfbd27", "ascii": "275c756666666427", "graphic": "27efbfbd27" },
    { "in": 65533, "out": "27efbfbd27", "ascii": "275c756666666427", "graphic": "27efbfbd27" },
    { "in": 1114111, "out": "275c55303031306666666627", "ascii": "275c55303031306666666627", "graphic": "275c55303031306666666627" },
    { "in": 1114112, "out": "27efbfbd27", "ascii": "275c756666666427", "graphic": "27efbfbd27" },
    { "in": 4, "out": "275c78303427", "ascii": "275c78303427", "graphic": "275c78303427" },
    { "in": 160, "out": "275c753030613027", "ascii": "275c753030613027", "graphic": "27c2a027" },
    { "in": 8192, "out": "275c753230303027", "ascii": "275c753230303027", "graphic": "27e2808027" },
    { "in": 12288, "out": "275c753330303027", "ascii": "275c753330303027", "graphic": "27e3808027" },
];
m.test("QuoteRune", function (assert) {
    var e_4, _a;
    try {
        for (var quoterunetests_1 = __values(quoterunetests), quoterunetests_1_1 = quoterunetests_1.next(); !quoterunetests_1_1.done; quoterunetests_1_1 = quoterunetests_1.next()) {
            var test_4 = quoterunetests_1_1.value;
            var out = strconv.quoteRune(test_4.in);
            assert.equal(test_4.out, hex.encodeToString(out), test_4);
            var builder = new strconv.StringBuilder();
            builder.appendQuoteRune(test_4.in);
            assert.equal(test_4.out, hex.encodeToString(builder.toBuffer()), test_4);
            var buf = new TextEncoder().encode("abc");
            builder = new strconv.StringBuilder(buf, buf.length);
            builder.appendQuoteRune(test_4.in);
            assert.equal(buf, builder.toBuffer().subarray(0, buf.length), test_4);
            assert.equal(test_4.out, hex.encodeToString(builder.toBuffer().subarray(buf.length)), test_4);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (quoterunetests_1_1 && !quoterunetests_1_1.done && (_a = quoterunetests_1.return)) _a.call(quoterunetests_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
});
m.test("QuoteRuneToASCII", function (assert) {
    var e_5, _a;
    try {
        for (var quoterunetests_2 = __values(quoterunetests), quoterunetests_2_1 = quoterunetests_2.next(); !quoterunetests_2_1.done; quoterunetests_2_1 = quoterunetests_2.next()) {
            var test_5 = quoterunetests_2_1.value;
            var out = strconv.quoteRuneToASCII(test_5.in);
            assert.equal(test_5.ascii, hex.encodeToString(out), test_5);
            var builder = new strconv.StringBuilder();
            builder.appendQuoteRuneToASCII(test_5.in);
            assert.equal(test_5.ascii, hex.encodeToString(builder.toBuffer()), test_5);
            var buf = new TextEncoder().encode("abc");
            builder = new strconv.StringBuilder(buf, buf.length);
            builder.appendQuoteRuneToASCII(test_5.in);
            assert.equal(buf, builder.toBuffer().subarray(0, buf.length), test_5);
            assert.equal(test_5.ascii, hex.encodeToString(builder.toBuffer().subarray(buf.length)), test_5);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (quoterunetests_2_1 && !quoterunetests_2_1.done && (_a = quoterunetests_2.return)) _a.call(quoterunetests_2);
        }
        finally { if (e_5) throw e_5.error; }
    }
});
m.test("QuoteRuneToGraphic", function (assert) {
    var e_6, _a;
    try {
        for (var quoterunetests_3 = __values(quoterunetests), quoterunetests_3_1 = quoterunetests_3.next(); !quoterunetests_3_1.done; quoterunetests_3_1 = quoterunetests_3.next()) {
            var test_6 = quoterunetests_3_1.value;
            var out = strconv.quoteRuneToGraphic(test_6.in);
            assert.equal(test_6.graphic, hex.encodeToString(out), test_6);
            var builder = new strconv.StringBuilder();
            builder.appendQuoteRuneToGraphic(test_6.in);
            assert.equal(test_6.graphic, hex.encodeToString(builder.toBuffer()), test_6);
            var buf = new TextEncoder().encode("abc");
            builder = new strconv.StringBuilder(buf, buf.length);
            builder.appendQuoteRuneToGraphic(test_6.in);
            assert.equal(buf, builder.toBuffer().subarray(0, buf.length), test_6);
            assert.equal(test_6.graphic, hex.encodeToString(builder.toBuffer().subarray(buf.length)), test_6);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (quoterunetests_3_1 && !quoterunetests_3_1.done && (_a = quoterunetests_3.return)) _a.call(quoterunetests_3);
        }
        finally { if (e_6) throw e_6.error; }
    }
});
var canbackquotetests = [
    { "in": "60", "out": false },
    { "in": "00", "out": false },
    { "in": "01", "out": false },
    { "in": "02", "out": false },
    { "in": "03", "out": false },
    { "in": "04", "out": false },
    { "in": "05", "out": false },
    { "in": "06", "out": false },
    { "in": "07", "out": false },
    { "in": "08", "out": false },
    { "in": "09", "out": true },
    { "in": "0a", "out": false },
    { "in": "0b", "out": false },
    { "in": "0c", "out": false },
    { "in": "0d", "out": false },
    { "in": "0e", "out": false },
    { "in": "0f", "out": false },
    { "in": "10", "out": false },
    { "in": "11", "out": false },
    { "in": "12", "out": false },
    { "in": "13", "out": false },
    { "in": "14", "out": false },
    { "in": "15", "out": false },
    { "in": "16", "out": false },
    { "in": "17", "out": false },
    { "in": "18", "out": false },
    { "in": "19", "out": false },
    { "in": "1a", "out": false },
    { "in": "1b", "out": false },
    { "in": "1c", "out": false },
    { "in": "1d", "out": false },
    { "in": "1e", "out": false },
    { "in": "1f", "out": false },
    { "in": "7f", "out": false },
    { "in": "27202122232425262728292a2b2c2d2e2f3a3b3c3d3e3f405b5c5d5e5f7b7c7d7e", "out": true },
    { "in": "30313233343536373839", "out": true },
    { "in": "4142434445464748494a4b4c4d4e4f505152535455565758595a", "out": true },
    { "in": "6162636465666768696a6b6c6d6e6f707172737475767778797a", "out": true },
    { "in": "e298ba", "out": true },
    { "in": "80", "out": false },
    { "in": "61e0a07a", "out": false },
    { "in": "efbbbf616263", "out": false },
    { "in": "61efbbbf7a", "out": false },
];
m.test("CanBackquote", function (assert) {
    var e_7, _a;
    try {
        for (var canbackquotetests_1 = __values(canbackquotetests), canbackquotetests_1_1 = canbackquotetests_1.next(); !canbackquotetests_1_1.done; canbackquotetests_1_1 = canbackquotetests_1.next()) {
            var test_7 = canbackquotetests_1_1.value;
            assert.equal(test_7.out, strconv.canBackquote(hex.decode(test_7.in)), test_7);
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (canbackquotetests_1_1 && !canbackquotetests_1_1.done && (_a = canbackquotetests_1.return)) _a.call(canbackquotetests_1);
        }
        finally { if (e_7) throw e_7.error; }
    }
});
var unquotetests = [
    { "in": "2222", "out": "" },
    { "in": "226122", "out": "61" },
    { "in": "2261626322", "out": "616263" },
    { "in": "22e298ba22", "out": "e298ba" },
    { "in": "2268656c6c6f20776f726c6422", "out": "68656c6c6f20776f726c64" },
    { "in": "225c78464622", "out": "ff" },
    { "in": "225c33373722", "out": "ff" },
    { "in": "225c753132333422", "out": "e188b4" },
    { "in": "225c55303030313031313122", "out": "f0908491" },
    { "in": "225c553030303130313131313122", "out": "f09084913131" },
    { "in": "225c615c625c665c6e5c725c745c765c5c5c2222", "out": "07080c0a0d090b5c22" },
    { "in": "222722", "out": "27" },
    { "in": "276127", "out": "61" },
    { "in": "27e298b927", "out": "e298b9" },
    { "in": "275c6127", "out": "07" },
    { "in": "275c78313027", "out": "10" },
    { "in": "275c33373727", "out": "ff" },
    { "in": "275c753132333427", "out": "e188b4" },
    { "in": "275c55303030313031313127", "out": "f0908491" },
    { "in": "275c7427", "out": "09" },
    { "in": "272027", "out": "20" },
    { "in": "275c2727", "out": "27" },
    { "in": "272227", "out": "22" },
    { "in": "6060", "out": "" },
    { "in": "606160", "out": "61" },
    { "in": "6061626360", "out": "616263" },
    { "in": "60e298ba60", "out": "e298ba" },
    { "in": "6068656c6c6f20776f726c6460", "out": "68656c6c6f20776f726c64" },
    { "in": "605c78464660", "out": "5c784646" },
    { "in": "605c33373760", "out": "5c333737" },
    { "in": "605c60", "out": "5c" },
    { "in": "600a60", "out": "0a" },
    { "in": "600960", "out": "09" },
    { "in": "602060", "out": "20" },
    { "in": "60610d6260", "out": "6162" },
];
var misquoted = [
    "",
    "22",
    "2261",
    "2227",
    "6222",
    "225c22",
    "225c3922",
    "225c313922",
    "225c31323922",
    "275c27",
    "275c3927",
    "275c313927",
    "275c31323927",
    "27616227",
    "225c78312122",
    "225c55313233343536373822",
    "225c7a22",
    "60",
    "60787878",
    "6060780d",
    "6022",
    "225c2722",
    "275c2227",
    "220a22",
    "225c6e0a22",
    "270a27",
    "225c756465616422",
    "225c75643833645c756465346622",
];
function testUnquote(assert, i, out, err) {
    var got = '';
    if (err) {
        var gotErr = void 0;
        try {
            strconv.unquote(hex.decode(i));
        }
        catch (e) {
            gotErr = e;
        }
        if (gotErr) {
            assert.equal(err.message, gotErr.message, i, out);
        }
        else {
            assert.equal(err, gotErr, i, out);
        }
    }
    else {
        got = hex.encodeToString(strconv.unquote(hex.decode(i)));
        assert.equal(out, got, i, out);
    }
}
m.test("Unquote", function (assert) {
    var e_8, _a, e_9, _b, e_10, _c;
    try {
        for (var unquotetests_1 = __values(unquotetests), unquotetests_1_1 = unquotetests_1.next(); !unquotetests_1_1.done; unquotetests_1_1 = unquotetests_1.next()) {
            var test_8 = unquotetests_1_1.value;
            testUnquote(assert, test_8.in, test_8.out, undefined);
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (unquotetests_1_1 && !unquotetests_1_1.done && (_a = unquotetests_1.return)) _a.call(unquotetests_1);
        }
        finally { if (e_8) throw e_8.error; }
    }
    try {
        for (var quotetests_4 = __values(quotetests), quotetests_4_1 = quotetests_4.next(); !quotetests_4_1.done; quotetests_4_1 = quotetests_4.next()) {
            var test_9 = quotetests_4_1.value;
            testUnquote(assert, test_9.out, test_9.in, undefined);
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (quotetests_4_1 && !quotetests_4_1.done && (_b = quotetests_4.return)) _b.call(quotetests_4);
        }
        finally { if (e_9) throw e_9.error; }
    }
    try {
        for (var misquoted_1 = __values(misquoted), misquoted_1_1 = misquoted_1.next(); !misquoted_1_1.done; misquoted_1_1 = misquoted_1.next()) {
            var s = misquoted_1_1.value;
            testUnquote(assert, s, "", strconv.ErrSyntax);
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (misquoted_1_1 && !misquoted_1_1.done && (_c = misquoted_1.return)) _c.call(misquoted_1);
        }
        finally { if (e_10) throw e_10.error; }
    }
});
