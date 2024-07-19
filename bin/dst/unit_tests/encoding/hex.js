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
var hex = __importStar(require("ejs/encoding/hex"));
var m = unit_1.test.module("ejs/encoding/hex");
var encDecTests = [
    { enc: "", dec: new Uint8Array() },
    { enc: "0001020304050607", dec: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]) },
    { enc: "08090a0b0c0d0e0f", dec: new Uint8Array([8, 9, 10, 11, 12, 13, 14, 15]) },
    { enc: "f0f1f2f3f4f5f6f7", dec: new Uint8Array([0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7]) },
    { enc: "f8f9fafbfcfdfeff", dec: new Uint8Array([0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]) },
    { enc: "67", dec: new Uint8Array(['g'.charCodeAt(0)]) },
    { enc: "e3a1", dec: new Uint8Array([0xe3, 0xa1]) },
];
m.test("Encode", function (assert) {
    var e_1, _a;
    try {
        for (var encDecTests_1 = __values(encDecTests), encDecTests_1_1 = encDecTests_1.next(); !encDecTests_1_1.done; encDecTests_1_1 = encDecTests_1.next()) {
            var test_1 = encDecTests_1_1.value;
            var dst = new Uint8Array(hex.encodedLen(test_1.dec.length));
            var n = hex.encode(dst, test_1.dec);
            assert.equal(dst.length, n, test_1);
            assert.equal(test_1.enc, new TextDecoder().decode(dst), test_1);
            var enc = hex.encodeToString(test_1.dec);
            assert.equal(test_1.enc, enc, test_1);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (encDecTests_1_1 && !encDecTests_1_1.done && (_a = encDecTests_1.return)) _a.call(encDecTests_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
m.test("Decode", function (assert) {
    var e_2, _a;
    try {
        for (var encDecTests_2 = __values(encDecTests), encDecTests_2_1 = encDecTests_2.next(); !encDecTests_2_1.done; encDecTests_2_1 = encDecTests_2.next()) {
            var test_2 = encDecTests_2_1.value;
            var dst_1 = new Uint8Array(hex.decodedLen(test_2.enc));
            var n_1 = hex.decode(dst_1, test_2.enc);
            assert.equal(test_2.dec.length, n_1);
            assert.equal(test_2.dec, dst_1);
            dst_1 = hex.decode(test_2.enc);
            assert.equal(test_2.dec.length, dst_1.length);
            assert.equal(test_2.dec, dst_1);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (encDecTests_2_1 && !encDecTests_2_1.done && (_a = encDecTests_2.return)) _a.call(encDecTests_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var test = {
        enc: "F8F9FAFBFCFDFEFF",
        dec: new Uint8Array([0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]),
    };
    var dst = new Uint8Array(hex.decodedLen(test.enc));
    var n = hex.decode(dst, test.enc);
    assert.equal(test.dec.length, n);
    assert.equal(test.dec, dst);
    dst = hex.decode(test.enc);
    assert.equal(test.dec.length, dst.length);
    assert.equal(test.dec, dst);
});
var errTests = [
    { in: "", out: new Uint8Array() },
    { in: "0", out: new Uint8Array() },
    { in: "zd4aa", out: new Uint8Array() },
    { in: "d4aaz", out: new Uint8Array([0xd4, 0xaa]) },
    { in: "30313", out: new Uint8Array(["01".charCodeAt(0), "01".charCodeAt(1)]) },
    { in: "0g", out: new Uint8Array() },
    { in: "00gg", out: new Uint8Array([0x00]) },
    { in: new Uint8Array(["0".charCodeAt(0), 0x01]), out: new Uint8Array() },
    { in: "ffeed", out: new Uint8Array([0xff, 0xee]) },
];
m.test("DecodeErr", function (assert) {
    var e_3, _a;
    try {
        for (var errTests_1 = __values(errTests), errTests_1_1 = errTests_1.next(); !errTests_1_1.done; errTests_1_1 = errTests_1.next()) {
            var test_3 = errTests_1_1.value;
            var dst = new Uint8Array(hex.decodedLen(test_3.in));
            var n = hex.decode(dst, test_3.in);
            assert.equal(test_3.out, dst.subarray(0, n), test_3, n);
            dst = hex.decode(test_3.in);
            assert.equal(test_3.out, dst);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (errTests_1_1 && !errTests_1_1.done && (_a = errTests_1.return)) _a.call(errTests_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
