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
var base64 = __importStar(require("ejs/encoding/base64"));
var m = unit_1.test.module("ejs/encoding/base64");
function make(decoded, encoded) {
    return {
        decoded: decoded,
        encoded: encoded,
    };
}
var pairs = [
    // RFC 3548 examples
    // make(new Uint8Array([0x14, 0xfb, 0x9c, 0x03, 0xd9, 0x7e]), "FPucA9l+"),
    // make(new Uint8Array([0x14, 0xfb, 0x9c, 0x03, 0xd9]), "FPucA9k="),
    // make(new Uint8Array([0x14, 0xfb, 0x9c, 0x03]), "FPucAw=="),
    // RFC 4648 examples
    make("", ""),
    make("f", "Zg=="),
    make("fo", "Zm8="),
    make("foo", "Zm9v"),
    make("foob", "Zm9vYg=="),
    make("fooba", "Zm9vYmE="),
    make("foobar", "Zm9vYmFy"),
    // Wikipedia examples
    make("sure.", "c3VyZS4="),
    make("sure", "c3VyZQ=="),
    make("sur", "c3Vy"),
    make("su", "c3U="),
    make("leasure.", "bGVhc3VyZS4="),
    make("easure.", "ZWFzdXJlLg=="),
    make("asure.", "YXN1cmUu"),
    make("sure.", "c3VyZS4="),
];
// Do nothing to a reference base64 string (leave in standard format)
function stdRef(ref) {
    return ref;
}
// Convert a reference string to URL-encoding
function urlRef(ref) {
    ref = ref.replaceAll("+", "-");
    ref = ref.replaceAll("/", "_");
    return ref;
}
// Convert a reference string to raw, unpadded format
function rawRef(ref) {
    while (ref.endsWith("=")) {
        ref = ref.substring(0, ref.length - 1);
    }
    return ref;
}
// Both URL and unpadding conversions
function rawURLRef(ref) {
    return rawRef(urlRef(ref));
}
// A nonstandard encoding with a funny padding character, for testing
var funnyEncoding = new base64.Base64(base64.encodeStd, '@');
function funnyRef(ref) {
    return ref.replaceAll("=", "@");
}
var encodingTests = [
    { enc: base64.Base64.std, conv: stdRef },
    { enc: base64.Base64.url, conv: urlRef },
    { enc: base64.Base64.rawstd, conv: rawRef },
    { enc: base64.Base64.rawurl, conv: rawURLRef },
    { enc: funnyEncoding, conv: funnyRef },
];
var bigtest = make("Twas brillig, and the slithy toves", "VHdhcyBicmlsbGlnLCBhbmQgdGhlIHNsaXRoeSB0b3Zlcw==");
function testEqual(assert, msg, got, conv) {
    if (!ejs.equal(got, conv)) {
        assert.fail(msg);
    }
}
m.test("TestEncode", function (assert) {
    var e_1, _a, e_2, _b;
    try {
        for (var pairs_1 = __values(pairs), pairs_1_1 = pairs_1.next(); !pairs_1_1.done; pairs_1_1 = pairs_1.next()) {
            var p = pairs_1_1.value;
            try {
                for (var encodingTests_1 = (e_2 = void 0, __values(encodingTests)), encodingTests_1_1 = encodingTests_1.next(); !encodingTests_1_1.done; encodingTests_1_1 = encodingTests_1.next()) {
                    var tt = encodingTests_1_1.value;
                    var got = tt.enc.encodeToString(p.decoded);
                    var conv = tt.conv(p.encoded);
                    testEqual(assert, "Encode(".concat(p.decoded, ") = ").concat(got, ", want ").concat(conv), got, conv);
                    var dbuf = new Uint8Array(tt.enc.encodedLen(p.decoded.length));
                    tt.enc.encode(dbuf, p.decoded);
                    testEqual(assert, "Encode(".concat(p.decoded, ") = ").concat(dbuf, ", want ").concat(conv), dbuf, conv);
                    dbuf = tt.enc.encode(p.decoded);
                    tt.enc.encode(dbuf, p.decoded);
                    testEqual(assert, "Encode(".concat(p.decoded, ") = ").concat(dbuf, ", want ").concat(conv), dbuf, conv);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (encodingTests_1_1 && !encodingTests_1_1.done && (_b = encodingTests_1.return)) _b.call(encodingTests_1);
                }
                finally { if (e_2) throw e_2.error; }
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (pairs_1_1 && !pairs_1_1.done && (_a = pairs_1.return)) _a.call(pairs_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
m.test("TestDecode", function (assert) {
    var e_3, _a, e_4, _b;
    try {
        for (var pairs_2 = __values(pairs), pairs_2_1 = pairs_2.next(); !pairs_2_1.done; pairs_2_1 = pairs_2.next()) {
            var p = pairs_2_1.value;
            try {
                for (var encodingTests_2 = (e_4 = void 0, __values(encodingTests)), encodingTests_2_1 = encodingTests_2.next(); !encodingTests_2_1.done; encodingTests_2_1 = encodingTests_2.next()) {
                    var tt = encodingTests_2_1.value;
                    var encoded = tt.conv(p.encoded);
                    var dbuf = tt.enc.decode(encoded);
                    assert.equal(tt.enc.encodedLen(dbuf.length), encoded.length);
                    testEqual(assert, "Decode(".concat(encoded, ") = ").concat(dbuf, ", want ").concat(p.decoded), dbuf, p.decoded);
                    dbuf = new Uint8Array(tt.enc.decodedLen(encoded.length));
                    var n = tt.enc.decode(dbuf, encoded);
                    dbuf = dbuf.subarray(0, n);
                    assert.equal(tt.enc.encodedLen(dbuf.length), encoded.length);
                    testEqual(assert, "Decode(".concat(encoded, ") = ").concat(dbuf, ", want ").concat(p.decoded), dbuf, p.decoded);
                }
            }
            catch (e_4_1) { e_4 = { error: e_4_1 }; }
            finally {
                try {
                    if (encodingTests_2_1 && !encodingTests_2_1.done && (_b = encodingTests_2.return)) _b.call(encodingTests_2);
                }
                finally { if (e_4) throw e_4.error; }
            }
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (pairs_2_1 && !pairs_2_1.done && (_a = pairs_2.return)) _a.call(pairs_2);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
m.test("TestEncodedLen", function (assert) {
    var e_5, _a;
    var f = function (enc, n, want) {
        return {
            enc: enc,
            n: n,
            want: want,
        };
    };
    var RawStdEncoding = base64.Base64.rawstd;
    var StdEncoding = base64.Base64.std;
    var tests = [
        f(RawStdEncoding, 0, 0),
        f(RawStdEncoding, 1, 2),
        f(RawStdEncoding, 2, 3),
        f(RawStdEncoding, 3, 4),
        f(RawStdEncoding, 7, 10),
        f(StdEncoding, 0, 0),
        f(StdEncoding, 1, 4),
        f(StdEncoding, 2, 4),
        f(StdEncoding, 3, 4),
        f(StdEncoding, 4, 8),
        f(StdEncoding, 7, 12),
    ];
    try {
        for (var tests_1 = __values(tests), tests_1_1 = tests_1.next(); !tests_1_1.done; tests_1_1 = tests_1.next()) {
            var tt = tests_1_1.value;
            var got = tt.enc.encodedLen(tt.n);
            assert.equal(tt.want, got, "EncodedLen(".concat(tt.n, ")"));
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (tests_1_1 && !tests_1_1.done && (_a = tests_1.return)) _a.call(tests_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
});
m.test("TestDecodedLen", function (assert) {
    var e_6, _a;
    var f = function (enc, n, want) {
        return {
            enc: enc,
            n: n,
            want: want,
        };
    };
    var RawStdEncoding = base64.Base64.rawstd;
    var StdEncoding = base64.Base64.std;
    var tests = [
        f(RawStdEncoding, 0, 0),
        f(RawStdEncoding, 2, 1),
        f(RawStdEncoding, 3, 2),
        f(RawStdEncoding, 4, 3),
        f(RawStdEncoding, 10, 7),
        f(StdEncoding, 0, 0),
        f(StdEncoding, 4, 3),
        f(StdEncoding, 8, 6),
    ];
    try {
        for (var tests_2 = __values(tests), tests_2_1 = tests_2.next(); !tests_2_1.done; tests_2_1 = tests_2.next()) {
            var tt = tests_2_1.value;
            var got = tt.enc.decodedLen(tt.n);
            assert.equal(tt.want, got, "DecodedLen(".concat(tt.n, ")"));
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (tests_2_1 && !tests_2_1.done && (_a = tests_2.return)) _a.call(tests_2);
        }
        finally { if (e_6) throw e_6.error; }
    }
});
m.test("TestBig", function (assert) {
    var n = 3 * 1000 + 1;
    var raw = new Uint8Array(n);
    var encoder = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-";
    var alpha = new TextEncoder().encode(encoder);
    for (var i = 0; i < n; i++) {
        raw[i] = alpha[i % alpha.length];
    }
    var enc = new base64.Base64(encoder, "=");
    var buf = enc.decode(enc.encode(raw));
    assert.equal(raw, buf);
});
