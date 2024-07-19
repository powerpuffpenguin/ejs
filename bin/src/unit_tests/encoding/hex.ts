
import { Assert, test } from "../../unit/unit";
import * as hex from "ejs/encoding/hex";

const m = test.module("ejs/encoding/hex")

interface encDecTest {
    enc: string
    dec: Uint8Array
}

const encDecTests: Array<encDecTest> = [
    { enc: "", dec: new Uint8Array() },
    { enc: "0001020304050607", dec: new Uint8Array([0, 1, 2, 3, 4, 5, 6, 7]) },
    { enc: "08090a0b0c0d0e0f", dec: new Uint8Array([8, 9, 10, 11, 12, 13, 14, 15]) },
    { enc: "f0f1f2f3f4f5f6f7", dec: new Uint8Array([0xf0, 0xf1, 0xf2, 0xf3, 0xf4, 0xf5, 0xf6, 0xf7]) },
    { enc: "f8f9fafbfcfdfeff", dec: new Uint8Array([0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]) },
    { enc: "67", dec: new Uint8Array(['g'.charCodeAt(0)]) },
    { enc: "e3a1", dec: new Uint8Array([0xe3, 0xa1]) },
]
m.test("Encode", (assert) => {
    for (const test of encDecTests) {
        const dst = new Uint8Array(hex.encodedLen(test.dec.length))
        const n = hex.encode(dst, test.dec)

        assert.equal(dst.length, n, test)

        assert.equal(test.enc, new TextDecoder().decode(dst), test)

        const enc = hex.encodeToString(test.dec)
        assert.equal(test.enc, enc, test)
    }
})
m.test("Decode", (assert) => {
    for (const test of encDecTests) {
        let dst = new Uint8Array(hex.decodedLen(test.enc))
        const n = hex.decode(dst, test.enc)
        assert.equal(test.dec.length, n)
        assert.equal(test.dec, dst)

        dst = hex.decode(test.enc)
        assert.equal(test.dec.length, dst.length)
        assert.equal(test.dec, dst)
    }
    const test: encDecTest = {
        enc: "F8F9FAFBFCFDFEFF",
        dec: new Uint8Array([0xf8, 0xf9, 0xfa, 0xfb, 0xfc, 0xfd, 0xfe, 0xff]),
    }
    let dst = new Uint8Array(hex.decodedLen(test.enc))
    const n = hex.decode(dst, test.enc)
    assert.equal(test.dec.length, n)
    assert.equal(test.dec, dst)

    dst = hex.decode(test.enc)
    assert.equal(test.dec.length, dst.length)
    assert.equal(test.dec, dst)
})

var errTests: Array<{
    in: string | Uint8Array,
    out: Uint8Array
}> = [
        { in: "", out: new Uint8Array() },
        { in: "0", out: new Uint8Array() },
        { in: "zd4aa", out: new Uint8Array() },
        { in: "d4aaz", out: new Uint8Array([0xd4, 0xaa]) },
        { in: "30313", out: new Uint8Array(["01".charCodeAt(0), "01".charCodeAt(1)]) },
        { in: "0g", out: new Uint8Array() },
        { in: "00gg", out: new Uint8Array([0x00]) },
        { in: new Uint8Array(["0".charCodeAt(0), 0x01]), out: new Uint8Array() },
        { in: "ffeed", out: new Uint8Array([0xff, 0xee]) },
    ]
m.test("DecodeErr", (assert) => {
    for (const test of errTests) {
        let dst = new Uint8Array(hex.decodedLen(test.in))
        const n = hex.decode(dst, test.in)
        assert.equal(test.out, dst.subarray(0, n), test, n)

        dst = hex.decode(test.in)
        assert.equal(test.out, dst)
    }
})