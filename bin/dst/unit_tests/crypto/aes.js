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
var crypto_1 = require("ejs/crypto");
var hash_1 = require("ejs/hash");
var hex = __importStar(require("ejs/encoding/hex"));
var m = unit_1.test.module("ejs/crypto/AES");
function generateKey(bits, seed) {
    switch (bits) {
        case 16:
            return hash_1.MD5.sum(seed);
        case 24:
            {
                var b = new Uint8Array(24);
                hash_1.SHA1.sumTo(b, seed);
                hash_1.CRC32.sumTo(b.subarray(20), seed);
                return b;
            }
        case 32:
            return hash_1.SHA256.sum(seed);
        default:
            throw new Error("not supported generate ".concat(bits, "bits key"));
    }
}
var keys = [
    generateKey(16, '16 bits will use aes 128'),
    generateKey(24, ' 24 bits will use aes 192'),
    generateKey(32, '32 bits will use aes 256'),
];
var iv = generateKey(16, 'aes iv length must be 16');
m.test('ECB', function (assert) {
    var expects = [
        'fe269db0ec6cd1f5b2a5812cba842e0af2d1487ce913e3894ae75cc502e37670',
        'f9374a6fde00db2cb0ca495a6ec2de3ac80089cb5193391cc72077023b4fdcf9',
        '9fc5e39e0ef98876b355e7d9526bc2c4563c799e298f68d8d4a760ecaec0ea2f',
    ];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var expect = expects[i];
        var source = new Uint8Array(32);
        for (var i_1 = 0; i_1 < source.length; i_1++) {
            source[i_1] = i_1 + 1;
        }
        // auto buffer
        var ciphertext = crypto_1.AES.encryptECB(key, source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        var plaintext = crypto_1.AES.decryptECB(key, ciphertext);
        assert.equal(source, plaintext);
        var enc = crypto_1.AES.ecb(key);
        var dec = enc;
        ciphertext = enc.encrypt(source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = dec.decrypt(ciphertext);
        assert.equal(source, plaintext);
        // to
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, crypto_1.AES.encryptECBTo(key, ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, crypto_1.AES.decryptECBTo(key, plaintext, ciphertext));
        assert.equal(source, plaintext);
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext));
        assert.equal(source, plaintext);
    }
});
m.test('CBC', function (assert) {
    var expects = [
        'd7e0c45f4f02903348034ef5f0315dde66e50c8f72f8844e1d64bbe889f90941',
        '1a4779168c4c9cd1c56ef85e08fbf7572c1335e883aa3344c186c33fd6ce906b',
        'd73f6d8c8eb4e7c3a411da8f9979004097208fdafe3e02a23541c3bddd5594ba',
    ];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var expect = expects[i];
        var source = new Uint8Array(32);
        for (var i_2 = 0; i_2 < source.length; i_2++) {
            source[i_2] = i_2 + 1;
        }
        // auto buffer
        var ciphertext = crypto_1.AES.encryptCBC(key, iv, source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        var plaintext = crypto_1.AES.decryptCBC(key, iv, ciphertext);
        assert.equal(source, plaintext);
        var enc = crypto_1.AES.cbc(key, iv);
        var dec = crypto_1.AES.cbc(key, iv);
        ciphertext = enc.encrypt(source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = dec.decrypt(ciphertext);
        assert.equal(source, plaintext);
        // to
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, crypto_1.AES.encryptCBCTo(key, iv, ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, crypto_1.AES.decryptCBCTo(key, iv, plaintext, ciphertext));
        assert.equal(source, plaintext);
        enc = crypto_1.AES.cbc(key, iv);
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        dec = crypto_1.AES.cbc(key, iv);
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext));
        assert.equal(source, plaintext);
        // sub
        enc = crypto_1.AES.cbc(key, iv);
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(16, enc.encryptTo(ciphertext, source.subarray(0, 16)));
        assert.notEqual(expect, hex.encodeToString(ciphertext));
        assert.equal(expect.substring(0, 32), hex.encodeToString(ciphertext.subarray(0, 16)));
        assert.equal(source.byteLength - 16, enc.encryptTo(ciphertext.subarray(16), source.subarray(16)));
        assert.equal(expect, hex.encodeToString(ciphertext));
        dec = crypto_1.AES.cbc(key, iv);
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(16, dec.decryptTo(plaintext, ciphertext.subarray(0, 16)));
        assert.notEqual(source, plaintext);
        assert.equal(source.subarray(0, 16), plaintext.subarray(0, 16));
        assert.equal(source.byteLength - 16, dec.decryptTo(plaintext.subarray(16), ciphertext.subarray(16)));
        assert.equal(source, plaintext);
    }
});
m.test('CFB', function (assert) {
    var e_1, _a;
    var expects = [
        '325cc23d751c990e93efbfc9128475f65f42c1c1850b80b9c5472ab2fb79a58a754c',
        '169e0bf7c13275fd3c8a844870446f0cc82dcf88658e446c3360d1e9a5faccd8496c',
        'a1298977efe469802dd1a67fbfe3bb35ca26cff26b8b6a3c6889417fd0aba98886e1',
    ];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var expect = expects[i];
        var source = new Uint8Array(32 + 2);
        for (var i_3 = 0; i_3 < source.length; i_3++) {
            source[i_3] = i_3 + 1;
        }
        // auto buffer
        var ciphertext = crypto_1.AES.encryptCFB(key, iv, source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        var plaintext = crypto_1.AES.decryptCFB(key, iv, ciphertext);
        assert.equal(source, plaintext);
        var enc = crypto_1.AES.cfb(key, iv);
        var dec = crypto_1.AES.cfb(key, iv);
        ciphertext = enc.encrypt(source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = dec.decrypt(ciphertext);
        assert.equal(source, plaintext);
        // to
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, crypto_1.AES.encryptCFBTo(key, iv, ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, crypto_1.AES.decryptCFBTo(key, iv, plaintext, ciphertext));
        assert.equal(source, plaintext);
        enc = crypto_1.AES.cfb(key, iv);
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        dec = crypto_1.AES.cfb(key, iv);
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext));
        assert.equal(source, plaintext);
        try {
            // sub
            for (var _b = (e_1 = void 0, __values([14, 16, 17])), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sub = _c.value;
                enc = crypto_1.AES.cfb(key, iv);
                ciphertext = new Uint8Array(source.byteLength);
                assert.equal(sub, enc.encryptTo(ciphertext, source.subarray(0, sub)));
                assert.notEqual(expect, hex.encodeToString(ciphertext));
                assert.equal(expect.substring(0, sub * 2), hex.encodeToString(ciphertext.subarray(0, sub)));
                assert.equal(source.byteLength - sub, enc.encryptTo(ciphertext.subarray(sub), source.subarray(sub)));
                assert.equal(expect, hex.encodeToString(ciphertext));
                dec = crypto_1.AES.cfb(key, iv);
                plaintext = new Uint8Array(ciphertext.byteLength);
                assert.equal(sub, dec.decryptTo(plaintext, ciphertext.subarray(0, sub)));
                assert.notEqual(source, plaintext);
                assert.equal(source.subarray(0, sub), plaintext.subarray(0, sub));
                assert.equal(source.byteLength - sub, dec.decryptTo(plaintext.subarray(sub), ciphertext.subarray(sub)));
                assert.equal(source, plaintext);
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_1) throw e_1.error; }
        }
    }
});
m.test('OFB', function (assert) {
    var e_2, _a;
    var expects = [
        '325cc23d751c990e93efbfc9128475f6462fe5ca3190e148bc798d2cc1bc93210c17',
        '169e0bf7c13275fd3c8a844870446f0c412e746d1130c52478a81f152e69e5f73aaa',
        'a1298977efe469802dd1a67fbfe3bb351cfa991719c5b75663f6a0a168358b47b8b1',
    ];
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var expect = expects[i];
        var source = new Uint8Array(32 + 2);
        for (var i_4 = 0; i_4 < source.length; i_4++) {
            source[i_4] = i_4 + 1;
        }
        // auto buffer
        var ciphertext = crypto_1.AES.encryptOFB(key, iv, source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        var plaintext = crypto_1.AES.decryptOFB(key, iv, ciphertext);
        assert.equal(source, plaintext);
        var enc = crypto_1.AES.ofb(key, iv);
        var dec = crypto_1.AES.ofb(key, iv);
        ciphertext = enc.encrypt(source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = dec.decrypt(ciphertext);
        assert.equal(source, plaintext);
        // to
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, crypto_1.AES.encryptOFBTo(key, iv, ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, crypto_1.AES.decryptOFBTo(key, iv, plaintext, ciphertext));
        assert.equal(source, plaintext);
        enc = crypto_1.AES.ofb(key, iv);
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        dec = crypto_1.AES.ofb(key, iv);
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext));
        assert.equal(source, plaintext);
        try {
            // sub
            for (var _b = (e_2 = void 0, __values([14, 16, 17])), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sub = _c.value;
                enc = crypto_1.AES.ofb(key, iv);
                ciphertext = new Uint8Array(source.byteLength);
                assert.equal(sub, enc.encryptTo(ciphertext, source.subarray(0, sub)));
                assert.notEqual(expect, hex.encodeToString(ciphertext));
                assert.equal(expect.substring(0, sub * 2), hex.encodeToString(ciphertext.subarray(0, sub)));
                assert.equal(source.byteLength - sub, enc.encryptTo(ciphertext.subarray(sub), source.subarray(sub)));
                assert.equal(expect, hex.encodeToString(ciphertext));
                dec = crypto_1.AES.ofb(key, iv);
                plaintext = new Uint8Array(ciphertext.byteLength);
                assert.equal(sub, dec.decryptTo(plaintext, ciphertext.subarray(0, sub)));
                assert.notEqual(source, plaintext);
                assert.equal(source.subarray(0, sub), plaintext.subarray(0, sub));
                assert.equal(source.byteLength - sub, dec.decryptTo(plaintext.subarray(sub), ciphertext.subarray(sub)));
                assert.equal(source, plaintext);
            }
        }
        catch (e_2_1) { e_2 = { error: e_2_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_2) throw e_2.error; }
        }
    }
});
m.test('CTR', function (assert) {
    var e_3, _a;
    var expects = [
        '325cc23d751c990e93efbfc9128475f6d7b4a27adcdb23d76c9c1ff656f188ac124c',
        '169e0bf7c13275fd3c8a844870446f0c1dbb1cb9efb35dc6bfbdaa5e975af1a05f8a',
        'a1298977efe469802dd1a67fbfe3bb35e6f1976875871379ed636afa2e9d1165db2a',
    ];
    var mode = crypto_1.CTRMode.BIG_ENDIAN;
    for (var i = 0; i < keys.length; i++) {
        var key = keys[i];
        var expect = expects[i];
        var source = new Uint8Array(32 + 2);
        for (var i_5 = 0; i_5 < source.length; i_5++) {
            source[i_5] = i_5 + 1;
        }
        // auto buffer
        var ciphertext = crypto_1.AES.encryptCTR(key, iv, mode, source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        var plaintext = crypto_1.AES.decryptCTR(key, iv, mode, ciphertext);
        assert.equal(source, plaintext);
        var enc = crypto_1.AES.ctr(key, iv, mode);
        var dec = crypto_1.AES.ctr(key, iv, mode);
        ciphertext = enc.encrypt(source);
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = dec.decrypt(ciphertext);
        assert.equal(source, plaintext);
        // to
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, crypto_1.AES.encryptCTRTo(key, iv, mode, ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, crypto_1.AES.decryptCTRTo(key, iv, mode, plaintext, ciphertext));
        assert.equal(source, plaintext);
        enc = crypto_1.AES.ctr(key, iv, mode);
        ciphertext = new Uint8Array(source.byteLength);
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source));
        assert.equal(expect, hex.encodeToString(ciphertext));
        dec = crypto_1.AES.ctr(key, iv, mode);
        plaintext = new Uint8Array(ciphertext.byteLength);
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext));
        assert.equal(source, plaintext);
        try {
            // sub
            for (var _b = (e_3 = void 0, __values([14, 16, 17])), _c = _b.next(); !_c.done; _c = _b.next()) {
                var sub = _c.value;
                enc = crypto_1.AES.ctr(key, iv, mode);
                ciphertext = new Uint8Array(source.byteLength);
                assert.equal(sub, enc.encryptTo(ciphertext, source.subarray(0, sub)));
                assert.notEqual(expect, hex.encodeToString(ciphertext));
                assert.equal(expect.substring(0, sub * 2), hex.encodeToString(ciphertext.subarray(0, sub)));
                assert.equal(source.byteLength - sub, enc.encryptTo(ciphertext.subarray(sub), source.subarray(sub)));
                assert.equal(expect, hex.encodeToString(ciphertext));
                dec = crypto_1.AES.ctr(key, iv, mode);
                plaintext = new Uint8Array(ciphertext.byteLength);
                assert.equal(sub, dec.decryptTo(plaintext, ciphertext.subarray(0, sub)));
                assert.notEqual(source, plaintext);
                assert.equal(source.subarray(0, sub), plaintext.subarray(0, sub));
                assert.equal(source.byteLength - sub, dec.decryptTo(plaintext.subarray(sub), ciphertext.subarray(sub)));
                assert.equal(source, plaintext);
            }
        }
        catch (e_3_1) { e_3 = { error: e_3_1 }; }
        finally {
            try {
                if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
            }
            finally { if (e_3) throw e_3.error; }
        }
    }
});
