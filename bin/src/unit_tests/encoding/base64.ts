
import { Assert, test } from "../../unit/unit";
import * as base64 from "ejs/encoding/base64";

const m = test.module("ejs/encoding/base64")


function make(decoded: Uint8Array | string, encoded: string) {
    return {
        decoded: decoded,
        encoded: encoded,
    }
}
const pairs = [
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
]
// Do nothing to a reference base64 string (leave in standard format)
function stdRef(ref: string): string {
    return ref
}

// Convert a reference string to URL-encoding
function urlRef(ref: string): string {
    ref = ref.replaceAll("+", "-")
    ref = ref.replaceAll("/", "_")
    return ref
}
// Convert a reference string to raw, unpadded format
function rawRef(ref: string): string {
    while (ref.endsWith("=")) {
        ref = ref.substring(0, ref.length - 1)
    }
    return ref
}
// Both URL and unpadding conversions
function rawURLRef(ref: string): string {
    return rawRef(urlRef(ref))
}
// A nonstandard encoding with a funny padding character, for testing
const funnyEncoding = new base64.Base64(base64.encodeStd, '@')
function funnyRef(ref: string): string {
    return ref.replaceAll("=", "@")
}
interface encodingTest {
    enc: base64.Base64           // Encoding to test
    conv: (s: string) => string // Reference string converter
}
const encodingTests: Array<encodingTest> = [
    { enc: base64.Base64.std, conv: stdRef },
    { enc: base64.Base64.url, conv: urlRef },
    { enc: base64.Base64.rawstd, conv: rawRef },
    { enc: base64.Base64.rawurl, conv: rawURLRef },
    { enc: funnyEncoding, conv: funnyRef },
]
const bigtest = make(
    "Twas brillig, and the slithy toves",
    "VHdhcyBicmlsbGlnLCBhbmQgdGhlIHNsaXRoeSB0b3Zlcw==",
)
function testEqual(assert: Assert, msg: string, got: string | Uint8Array, conv: string | Uint8Array) {
    if (!ejs.equal(got, conv)) {
        assert.fail(msg)
    }
}
m.test("TestEncode", (assert) => {
    for (const p of pairs) {
        for (const tt of encodingTests) {
            const got = tt.enc.encodeToString(p.decoded)
            const conv = tt.conv(p.encoded)
            testEqual(assert, `Encode(${p.decoded}) = ${got}, want ${conv}`, got, conv)

            let dbuf = new Uint8Array(tt.enc.encodedLen(p.decoded.length))
            tt.enc.encode(dbuf, p.decoded)
            testEqual(assert, `Encode(${p.decoded}) = ${dbuf}, want ${conv}`, dbuf, conv)

            dbuf = tt.enc.encode(p.decoded)
            tt.enc.encode(dbuf, p.decoded)
            testEqual(assert, `Encode(${p.decoded}) = ${dbuf}, want ${conv}`, dbuf, conv)
        }
    }
})
m.test("TestDecode", (assert) => {
    for (const p of pairs) {
        for (const tt of encodingTests) {
            const encoded = tt.conv(p.encoded)
            let dbuf = tt.enc.decode(encoded)
            assert.equal(tt.enc.encodedLen(dbuf.length), encoded.length)

            testEqual(assert, `Decode(${encoded}) = ${dbuf}, want ${p.decoded}`, dbuf, p.decoded)

            dbuf = new Uint8Array(tt.enc.decodedLen(encoded.length))
            const n = tt.enc.decode(dbuf, encoded)
            dbuf = dbuf.subarray(0, n)
            assert.equal(tt.enc.encodedLen(dbuf.length), encoded.length)

            testEqual(assert, `Decode(${encoded}) = ${dbuf}, want ${p.decoded}`, dbuf, p.decoded)
        }
    }
})
m.test("TestEncodedLen", (assert) => {
    const f = (enc: base64.Encoding, n: number, want: number) => {
        return {
            enc: enc,
            n: n,
            want: want,
        }
    }
    const RawStdEncoding = base64.Base64.rawstd
    const StdEncoding = base64.Base64.std
    const tests = [
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
    ]
    for (const tt of tests) {
        const got = tt.enc.encodedLen(tt.n)
        assert.equal(tt.want, got, `EncodedLen(${tt.n})`)
    }
})

m.test("TestDecodedLen", (assert) => {
    const f = (enc: base64.Encoding, n: number, want: number) => {
        return {
            enc: enc,
            n: n,
            want: want,
        }
    }
    const RawStdEncoding = base64.Base64.rawstd
    const StdEncoding = base64.Base64.std
    const tests = [
        f(RawStdEncoding, 0, 0),
        f(RawStdEncoding, 2, 1),
        f(RawStdEncoding, 3, 2),
        f(RawStdEncoding, 4, 3),
        f(RawStdEncoding, 10, 7),
        f(StdEncoding, 0, 0),
        f(StdEncoding, 4, 3),
        f(StdEncoding, 8, 6),
    ]
    for (const tt of tests) {
        const got = tt.enc.decodedLen(tt.n)
        assert.equal(tt.want, got, `DecodedLen(${tt.n})`)
    }
})
m.test("TestBig", (assert) => {
    const n = 3 * 1000 + 1
    const raw = new Uint8Array(n)
    const encoder = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ+-"
    const alpha = new TextEncoder().encode(encoder)
    for (let i = 0; i < n; i++) {
        raw[i] = alpha[i % alpha.length]
    }
    const enc = new base64.Base64(encoder, "=")
    const buf = enc.decode(enc.encode(raw))

    assert.equal(raw, buf)
})
