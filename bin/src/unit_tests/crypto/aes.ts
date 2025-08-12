
import { Assert, test } from "../../unit/unit";
import { AES, CTRMode } from "ejs/crypto";
import { MD5, SHA256, SHA1, CRC32 } from "ejs/hash";
import * as hex from "ejs/encoding/hex";

const m = test.module("ejs/crypto/AES")
function generateKey(bits: number, seed: string): Uint8Array {
    switch (bits) {
        case 16:
            return MD5.sum(seed)
        case 24:
            {
                const b = new Uint8Array(24)
                SHA1.sumTo(b, seed)
                CRC32.sumTo(b.subarray(20), seed)
                return b
            }
        case 32:
            return SHA256.sum(seed)
        default:
            throw new Error(`not supported generate ${bits}bits key`);
    }
}
const keys = [
    generateKey(16, '16 bits will use aes 128'),
    generateKey(24, ' 24 bits will use aes 192'),
    generateKey(32, '32 bits will use aes 256'),
]
const iv = generateKey(16, 'aes iv length must be 16')
m.test('ECB', (assert) => {
    const expects = [
        'fe269db0ec6cd1f5b2a5812cba842e0af2d1487ce913e3894ae75cc502e37670',
        'f9374a6fde00db2cb0ca495a6ec2de3ac80089cb5193391cc72077023b4fdcf9',
        '9fc5e39e0ef98876b355e7d9526bc2c4563c799e298f68d8d4a760ecaec0ea2f',
    ]
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const expect = expects[i]
        const source = new Uint8Array(32)
        for (let i = 0; i < source.length; i++) {
            source[i] = i + 1
        }

        // auto buffer
        let ciphertext = AES.encryptECB(key, source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        let plaintext = AES.decryptECB(key, ciphertext)
        assert.equal(source, plaintext)

        const enc = AES.ecb(key)
        const dec = enc
        ciphertext = enc.encrypt(source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = dec.decrypt(ciphertext)
        assert.equal(source, plaintext)

        // to
        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, AES.encryptECBTo(key, ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, AES.decryptECBTo(key, plaintext, ciphertext))
        assert.equal(source, plaintext)

        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext))
        assert.equal(source, plaintext)
    }
})
m.test('CBC', (assert) => {
    const expects = [
        'd7e0c45f4f02903348034ef5f0315dde66e50c8f72f8844e1d64bbe889f90941',
        '1a4779168c4c9cd1c56ef85e08fbf7572c1335e883aa3344c186c33fd6ce906b',
        'd73f6d8c8eb4e7c3a411da8f9979004097208fdafe3e02a23541c3bddd5594ba',
    ]
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const expect = expects[i]
        const source = new Uint8Array(32)
        for (let i = 0; i < source.length; i++) {
            source[i] = i + 1
        }

        // auto buffer
        let ciphertext = AES.encryptCBC(key, iv, source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        let plaintext = AES.decryptCBC(key, iv, ciphertext)
        assert.equal(source, plaintext)

        let enc = AES.cbc(key, iv)
        let dec = AES.cbc(key, iv)
        ciphertext = enc.encrypt(source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = dec.decrypt(ciphertext)
        assert.equal(source, plaintext)

        // to
        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, AES.encryptCBCTo(key, iv, ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, AES.decryptCBCTo(key, iv, plaintext, ciphertext))
        assert.equal(source, plaintext)

        enc = AES.cbc(key, iv)

        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        dec = AES.cbc(key, iv)
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext))
        assert.equal(source, plaintext)

        // sub
        enc = AES.cbc(key, iv)
        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(16, enc.encryptTo(ciphertext, source.subarray(0, 16)))
        assert.notEqual(expect, hex.encodeToString(ciphertext))
        assert.equal(expect.substring(0, 32), hex.encodeToString(ciphertext.subarray(0, 16)))
        assert.equal(source.byteLength - 16, enc.encryptTo(ciphertext.subarray(16), source.subarray(16)))
        assert.equal(expect, hex.encodeToString(ciphertext))
        dec = AES.cbc(key, iv)
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(16, dec.decryptTo(plaintext, ciphertext.subarray(0, 16)))
        assert.notEqual(source, plaintext)
        assert.equal(source.subarray(0, 16), plaintext.subarray(0, 16))
        assert.equal(source.byteLength - 16, dec.decryptTo(plaintext.subarray(16), ciphertext.subarray(16)))
        assert.equal(source, plaintext)
    }
})
m.test('CFB', (assert) => {
    const expects = [
        '325cc23d751c990e93efbfc9128475f65f42c1c1850b80b9c5472ab2fb79a58a754c',
        '169e0bf7c13275fd3c8a844870446f0cc82dcf88658e446c3360d1e9a5faccd8496c',
        'a1298977efe469802dd1a67fbfe3bb35ca26cff26b8b6a3c6889417fd0aba98886e1',
    ]
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const expect = expects[i]
        const source = new Uint8Array(32 + 2)
        for (let i = 0; i < source.length; i++) {
            source[i] = i + 1
        }

        // auto buffer
        let ciphertext = AES.encryptCFB(key, iv, source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        let plaintext = AES.decryptCFB(key, iv, ciphertext)
        assert.equal(source, plaintext)

        let enc = AES.cfb(key, iv)
        let dec = AES.cfb(key, iv)
        ciphertext = enc.encrypt(source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = dec.decrypt(ciphertext)
        assert.equal(source, plaintext)

        // to
        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, AES.encryptCFBTo(key, iv, ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, AES.decryptCFBTo(key, iv, plaintext, ciphertext))
        assert.equal(source, plaintext)

        enc = AES.cfb(key, iv)
        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        dec = AES.cfb(key, iv)
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext))
        assert.equal(source, plaintext)

        // sub
        for (const sub of [14, 16, 17]) {
            enc = AES.cfb(key, iv)
            ciphertext = new Uint8Array(source.byteLength)
            assert.equal(sub, enc.encryptTo(ciphertext, source.subarray(0, sub)))
            assert.notEqual(expect, hex.encodeToString(ciphertext))
            assert.equal(expect.substring(0, sub * 2), hex.encodeToString(ciphertext.subarray(0, sub)))
            assert.equal(source.byteLength - sub, enc.encryptTo(ciphertext.subarray(sub), source.subarray(sub)))
            assert.equal(expect, hex.encodeToString(ciphertext))
            dec = AES.cfb(key, iv)
            plaintext = new Uint8Array(ciphertext.byteLength)
            assert.equal(sub, dec.decryptTo(plaintext, ciphertext.subarray(0, sub)))
            assert.notEqual(source, plaintext)
            assert.equal(source.subarray(0, sub), plaintext.subarray(0, sub))
            assert.equal(source.byteLength - sub, dec.decryptTo(plaintext.subarray(sub), ciphertext.subarray(sub)))
            assert.equal(source, plaintext)
        }

    }
})
m.test('OFB', (assert) => {
    const expects = [
        '325cc23d751c990e93efbfc9128475f6462fe5ca3190e148bc798d2cc1bc93210c17',
        '169e0bf7c13275fd3c8a844870446f0c412e746d1130c52478a81f152e69e5f73aaa',
        'a1298977efe469802dd1a67fbfe3bb351cfa991719c5b75663f6a0a168358b47b8b1',
    ]
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const expect = expects[i]
        const source = new Uint8Array(32 + 2)
        for (let i = 0; i < source.length; i++) {
            source[i] = i + 1
        }

        // auto buffer
        let ciphertext = AES.encryptOFB(key, iv, source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        let plaintext = AES.decryptOFB(key, iv, ciphertext)
        assert.equal(source, plaintext)

        let enc = AES.ofb(key, iv)
        let dec = AES.ofb(key, iv)
        ciphertext = enc.encrypt(source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = dec.decrypt(ciphertext)
        assert.equal(source, plaintext)

        // to
        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, AES.encryptOFBTo(key, iv, ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, AES.decryptOFBTo(key, iv, plaintext, ciphertext))
        assert.equal(source, plaintext)

        enc = AES.ofb(key, iv)
        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        dec = AES.ofb(key, iv)
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext))
        assert.equal(source, plaintext)

        // sub
        for (const sub of [14, 16, 17]) {
            enc = AES.ofb(key, iv)
            ciphertext = new Uint8Array(source.byteLength)
            assert.equal(sub, enc.encryptTo(ciphertext, source.subarray(0, sub)))
            assert.notEqual(expect, hex.encodeToString(ciphertext))
            assert.equal(expect.substring(0, sub * 2), hex.encodeToString(ciphertext.subarray(0, sub)))
            assert.equal(source.byteLength - sub, enc.encryptTo(ciphertext.subarray(sub), source.subarray(sub)))
            assert.equal(expect, hex.encodeToString(ciphertext))
            dec = AES.ofb(key, iv)
            plaintext = new Uint8Array(ciphertext.byteLength)
            assert.equal(sub, dec.decryptTo(plaintext, ciphertext.subarray(0, sub)))
            assert.notEqual(source, plaintext)
            assert.equal(source.subarray(0, sub), plaintext.subarray(0, sub))
            assert.equal(source.byteLength - sub, dec.decryptTo(plaintext.subarray(sub), ciphertext.subarray(sub)))
            assert.equal(source, plaintext)
        }

    }
})
m.test('CTR', (assert) => {
    const expects = [
        '325cc23d751c990e93efbfc9128475f6d7b4a27adcdb23d76c9c1ff656f188ac124c',
        '169e0bf7c13275fd3c8a844870446f0c1dbb1cb9efb35dc6bfbdaa5e975af1a05f8a',
        'a1298977efe469802dd1a67fbfe3bb35e6f1976875871379ed636afa2e9d1165db2a',
    ]
    const mode = CTRMode.BIG_ENDIAN
    for (let i = 0; i < keys.length; i++) {
        const key = keys[i]
        const expect = expects[i]
        const source = new Uint8Array(32 + 2)
        for (let i = 0; i < source.length; i++) {
            source[i] = i + 1
        }

        // auto buffer
        let ciphertext = AES.encryptCTR(key, iv, mode, source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        let plaintext = AES.decryptCTR(key, iv, mode, ciphertext)
        assert.equal(source, plaintext)

        let enc = AES.ctr(key, iv, mode)
        let dec = AES.ctr(key, iv, mode)
        ciphertext = enc.encrypt(source)
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = dec.decrypt(ciphertext)
        assert.equal(source, plaintext)

        // to
        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, AES.encryptCTRTo(key, iv, mode, ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, AES.decryptCTRTo(key, iv, mode, plaintext, ciphertext))
        assert.equal(source, plaintext)

        enc = AES.ctr(key, iv, mode)
        ciphertext = new Uint8Array(source.byteLength)
        assert.equal(source.byteLength, enc.encryptTo(ciphertext, source))
        assert.equal(expect, hex.encodeToString(ciphertext))
        dec = AES.ctr(key, iv, mode)
        plaintext = new Uint8Array(ciphertext.byteLength)
        assert.equal(ciphertext.byteLength, dec.decryptTo(plaintext, ciphertext))
        assert.equal(source, plaintext)

        // sub
        for (const sub of [14, 16, 17]) {
            enc = AES.ctr(key, iv, mode)
            ciphertext = new Uint8Array(source.byteLength)
            assert.equal(sub, enc.encryptTo(ciphertext, source.subarray(0, sub)))
            assert.notEqual(expect, hex.encodeToString(ciphertext))
            assert.equal(expect.substring(0, sub * 2), hex.encodeToString(ciphertext.subarray(0, sub)))
            assert.equal(source.byteLength - sub, enc.encryptTo(ciphertext.subarray(sub), source.subarray(sub)))
            assert.equal(expect, hex.encodeToString(ciphertext))
            dec = AES.ctr(key, iv, mode)
            plaintext = new Uint8Array(ciphertext.byteLength)
            assert.equal(sub, dec.decryptTo(plaintext, ciphertext.subarray(0, sub)))
            assert.notEqual(source, plaintext)
            assert.equal(source.subarray(0, sub), plaintext.subarray(0, sub))
            assert.equal(source.byteLength - sub, dec.decryptTo(plaintext.subarray(sub), ciphertext.subarray(sub)))
            assert.equal(source, plaintext)
        }

    }
})