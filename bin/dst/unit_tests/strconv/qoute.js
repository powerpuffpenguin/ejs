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
var quotetests = [
    { "in": "\u0007\u0008\u000c\r\n\t\u000b", "out": "\"\\a\\b\\f\\r\\n\\t\\v\"", "ascii": "\"\\a\\b\\f\\r\\n\\t\\v\"", "graphic": "\"\\a\\b\\f\\r\\n\\t\\v\"" },
    { "in": "\\", "out": "\"\\\\\"", "ascii": "\"\\\\\"", "graphic": "\"\\\\\"" },
    { "in": "abc\ufffddef", "out": "\"abc\\xffdef\"", "ascii": "\"abc\\xffdef\"", "graphic": "\"abc\\xffdef\"" },
    { "in": "☺", "out": "\"☺\"", "ascii": "\"\\u263a\"", "graphic": "\"☺\"" },
    { "in": "􏿿", "out": "\"\\U0010ffff\"", "ascii": "\"\\U0010ffff\"", "graphic": "\"\\U0010ffff\"" },
    { "in": "\u0004", "out": "\"\\x04\"", "ascii": "\"\\x04\"", "graphic": "\"\\x04\"" },
    { "in": "! ! !　!", "out": "\"!\\u00a0!\\u2000!\\u3000!\"", "ascii": "\"!\\u00a0!\\u2000!\\u3000!\"", "graphic": "\"! ! !　!\"" },
    { "in": "", "out": "\"\\x7f\"", "ascii": "\"\\x7f\"", "graphic": "\"\\x7f\"" }
];
m.test("Quote", function (assert) {
    var e_1, _a;
    try {
        for (var quotetests_1 = __values(quotetests), quotetests_1_1 = quotetests_1.next(); !quotetests_1_1.done; quotetests_1_1 = quotetests_1.next()) {
            var test_1 = quotetests_1_1.value;
            assert.equal(test_1.out, strconv.quote(test_1.in), test_1);
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
