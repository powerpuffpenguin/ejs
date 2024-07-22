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
