
import { Assert, test } from "../../unit/unit";
import * as utf8 from "ejs/unicode/utf8";
import * as strconv from "ejs/strconv";

const m = test.module("ejs/unicode/utf8")

m.test('Constants', (assert) => {
    assert.equal(utf8.MaxRune, 1114111)
    assert.equal(utf8.RuneError, 65533)
})
interface Utf8Map {
    r: utf8.Rune
    str: string
    buf: Uint8Array
}
function bytes(str: string): Uint8Array {
    const count = str.length / 4
    const strs = new Array(count)
    let offset = 0;
    for (let i = 0; i < count; i++) {
        strs[i] = str.substring(offset + 2, offset + 4)
        offset += 4
    }
    return new Uint8Array(strs.map((p) => parseInt(p, 16)))
}
function make(r: utf8.Rune, str: string): Utf8Map {
    return {
        r: r,
        str: str,
        buf: bytes(str),
    }
}
const utf8map: Array<Utf8Map> = [
    make(0x0000, "0x00"),
    make(0x0001, "0x01"),
    make(0x007e, "0x7e"),
    make(0x007f, "0x7f"),
    make(0x0080, "0xc20x80"),
    make(0x0081, "0xc20x81"),
    make(0x00bf, "0xc20xbf"),
    make(0x00c0, "0xc30x80"),
    make(0x00c1, "0xc30x81"),
    make(0x00c8, "0xc30x88"),
    make(0x00d0, "0xc30x90"),
    make(0x00e0, "0xc30xa0"),
    make(0x00f0, "0xc30xb0"),
    make(0x00f8, "0xc30xb8"),
    make(0x00ff, "0xc30xbf"),
    make(0x0100, "0xc40x80"),
    make(0x07ff, "0xdf0xbf"),
    make(0x0400, "0xd00x80"),
    make(0x0800, "0xe00xa00x80"),
    make(0x0801, "0xe00xa00x81"),
    make(0x1000, "0xe10x800x80"),
    make(0xd000, "0xed0x800x80"),
    make(0xd7ff, "0xed0x9f0xbf"), // last code point before surrogate half.
    make(0xe000, "0xee0x800x80"), // first code point after surrogate half.
    make(0xfffe, "0xef0xbf0xbe"),
    make(0xffff, "0xef0xbf0xbf"),
    make(0x10000, "0xf00x900x800x80"),
    make(0x10001, "0xf00x900x800x81"),
    make(0x40000, "0xf10x800x800x80"),
    make(0x10fffe, "0xf40x8f0xbf0xbe"),
    make(0x10ffff, "0xf40x8f0xbf0xbf"),
    make(0xFFFD, "0xef0xbf0xbd"),
]
var surrogateMap: Array<Utf8Map> = [
    make(0xd800, "0xed0xa00x80"), // surrogate min decodes to (RuneError, 1)
    make(0xdfff, "0xed0xbf0xbf"), // surrogate max decodes to (RuneError, 1)
]
const testStrings: Array<Uint8Array> = [
    strconv.toBuffer(""),
    strconv.toBuffer("abcd"),
    strconv.toBuffer("☺☻☹"),
    strconv.toBuffer("日a本b語ç日ð本Ê語þ日¥本¼語i日©"),
    strconv.toBuffer("日a本b語ç日ð本Ê語þ日¥本¼語i日©日a本b語ç日ð本Ê語þ日¥本¼語i日©日a本b語ç日ð本Ê語þ日¥本¼語i日©"),
    new Uint8Array([0x80, 0x80, 0x80, 0x80]),
]


m.test('Full', (assert) => {
    for (const m of utf8map) {
        assert.true(utf8.isFull(m.buf), m)
        const b1 = m.buf.subarray(0, m.buf.length - 1)
        assert.false(utf8.isFull(b1), m, m.str, b1)
    }
    for (const s of [new Uint8Array([0xc0]), new Uint8Array([0xc1])]) {
        assert.true(utf8.isFull(s))
    }
})

m.test('Encode', (assert) => {
    for (const m of utf8map) {
        const buf = new Uint8Array(10)
        const n = utf8.encode(buf, m.r)
        const b1 = buf.subarray(0, n)
        assert.equal(m.buf, b1, m)
    }
})
m.test('Append', (assert) => {
    let builder: utf8.UTF8Builder
    for (const m of utf8map) {
        builder = new utf8.UTF8Builder()
        builder.append(m.r)
        assert.equal(m.buf, builder.toBuffer())

        const init = new TextEncoder().encode("init")
        builder = new utf8.UTF8Builder(init, init.length)
        builder.append(m.r)

        const want = new Uint8Array(init.length + m.buf.length)
        ejs.copy(want, init)
        ejs.copy(want.subarray(init.length), m.buf)
        assert.equal(want, builder.toBuffer(), m)
    }
})
m.test('Decode', (assert) => {
    for (const m of utf8map) {
        {
            const [r, size] = utf8.decode(m.buf)
            assert.equal(m.r, r, "rune", m)
            assert.equal(m.buf.length, size, "length", m)
        }
        {
            const s = new Uint8Array([...m.buf, 0])
            const [r, size] = utf8.decode(s)
            assert.equal(m.r, r, "0 rune", m)
            assert.equal(m.buf.length, size, "0 length", m)
        }
        {
            // make sure missing bytes fail
            let wantsize = 1
            if (wantsize >= m.buf.length) {
                wantsize = 0
            }
            const [r, size] = utf8.decode(m.buf.subarray(0, m.buf.length - 1))
            assert.equal(utf8.RuneError, r, "wantsize rune", m)
            assert.equal(wantsize, size, "wantsize length", m)
        }
        {
            // make sure bad sequences fail
            const b = new Uint8Array([...m.buf])
            if (b.length == 1) {
                b[0] = 0x80
            } else {
                b[b.length - 1] = 0x7F
            }
            const [r, size] = utf8.decode(b)
            assert.equal(r, utf8.RuneError, "wantsize rune", m)
            assert.equal(1, size, "wantsize length", m)
        }
    }
})
m.test('DecodeSurrogate', (assert) => {
    for (const m of surrogateMap) {
        const [r, size] = utf8.decode(m.buf)
        assert.equal(r, utf8.RuneError, "wantsize rune", m)
        assert.equal(1, size, "wantsize length", m)
    }
})
function testSequence(assert: Assert, s: Uint8Array, m: Utf8Map) {
    interface info {
        index: number
        r: utf8.Rune
    }
    let index = new Array<info>(s.length)
    let b = s
    let si = 0
    let j = 0
    let i = -1

    utf8.forEach(s, (r, i) => {
        assert.equal(i, si, 'mismatched', m, b, i)
        index[j] = { index: i, r: r }
        j++
        const [r1, size1] = utf8.decode(b.subarray(i))
        assert.equal(r, r1, 'decode 1', m, b, i)

        si += size1
    })
    j--
    for (si = s.length; si > 0;) {
        const [r1, size1] = utf8.decodeLast(b.subarray(0, si))
        assert.equal(index[j].r, r1, 'DecodeLastRune', m, s, si, r1, index[j].r)

        si -= size1
        assert.equal(index[j].index, si, 'DecodeLastRune index mismatch', m, s, si, index[j].index)
        j--
    }
    assert.equal(0, si, `DecodeLastRune finished at ${si}, not 0`, m, s)
}
m.test('Sequencing', (assert) => {
    for (const ts of testStrings) {
        for (const m of utf8map) {
            for (const items of [
                [ts, m.buf],
                [m.buf, ts],
                [ts, m.buf, ts],
            ]) {
                let len = 0
                for (const item of items) {
                    len += item.length
                }
                const s = new Uint8Array(len)
                len = 0
                for (const item of items) {
                    len += ejs.copy(s.subarray(len), item)
                }
                testSequence(assert, s, m)
            }
        }
    }
})
m.test('RuntimeConversion', (assert) => {

    for (const ts of testStrings) {
        const count = utf8.count(ts)
        const s = new TextDecoder().decode(ts)
        assert.equal(s.length, count, ts, `'${s}'`)
        let i = 0
        utf8.forEach(ts, (r) => {
            assert.equal(r, s.codePointAt(i))

            i++
        })
    }
})
const invalidSequenceTests: Array<Uint8Array> = [
    bytes("0xed0xa00x800x80"), // surrogate min
    bytes("0xed0xbf0xbf0x80"), // surrogate max

    // xx
    bytes("0x910x800x800x80"),

    // s1
    bytes("0xC20x7F0x800x80"),
    bytes("0xC20xC00x800x80"),
    bytes("0xDF0x7F0x800x80"),
    bytes("0xDF0xC00x800x80"),

    // s2
    bytes("0xE00x9F0xBF0x80"),
    bytes("0xE00xA00x7F0x80"),
    bytes("0xE00xBF0xC00x80"),
    bytes("0xE00xC00x800x80"),

    // s3
    bytes("0xE10x7F0xBF0x80"),
    bytes("0xE10x800x7F0x80"),
    bytes("0xE10xBF0xC00x80"),
    bytes("0xE10xC00x800x80"),

    //s4
    bytes("0xED0x7F0xBF0x80"),
    bytes("0xED0x800x7F0x80"),
    bytes("0xED0x9F0xC00x80"),
    bytes("0xED0xA00x800x80"),

    // s5
    bytes("0xF00x8F0xBF0xBF"),
    bytes("0xF00x900x7F0xBF"),
    bytes("0xF00x900x800x7F"),
    bytes("0xF00xBF0xBF0xC0"),
    bytes("0xF00xBF0xC00x80"),
    bytes("0xF00xC00x800x80"),

    // s6
    bytes("0xF10x7F0xBF0xBF"),
    bytes("0xF10x800x7F0xBF"),
    bytes("0xF10x800x800x7F"),
    bytes("0xF10xBF0xBF0xC0"),
    bytes("0xF10xBF0xC00x80"),
    bytes("0xF10xC00x800x80"),

    // s7
    bytes("0xF40x7F0xBF0xBF"),
    bytes("0xF40x800x7F0xBF"),
    bytes("0xF40x800x800x7F"),
    bytes("0xF40x8F0xBF0xC0"),
    bytes("0xF40x8F0xC00x80"),
    bytes("0xF40x900x800x80"),
]
function runtimeDecodeRune(p: Uint8Array): utf8.Rune {
    let ret = -1
    utf8.forEach(p, (r) => {
        ret = r
        return true
    })
    return ret
}
m.test('DecodeInvalidSequence', (assert) => {
    for (const s of invalidSequenceTests) {
        const [r1, s1] = utf8.decode(s)
        assert.equal(utf8.RuneError, r1, s)
        assert.equal(1, s1, s)

        const r3 = runtimeDecodeRune(s)
        assert.equal(r1, r3, s)
    }
})
m.test('Negative', (assert) => {
    let errorbuf = new Uint8Array(utf8.UTFMax)
    errorbuf = errorbuf.subarray(0, utf8.encode(errorbuf, utf8.RuneError))
    let buf = new Uint8Array(utf8.UTFMax)
    buf = buf.subarray(0, utf8.encode(buf, -1))
    assert.equal(buf, errorbuf)
})

interface RuneCountTest {
    in: Uint8Array
    out: number
}
const runecounttests: Array<RuneCountTest> = [
    { in: strconv.toBuffer("abcd"), out: 4 },
    { in: strconv.toBuffer("☺☻☹"), out: 3 },
    { in: strconv.toBuffer("1,2,3,4"), out: 7 },
    { in: bytes("0xe20x00"), out: 2 },
    { in: bytes("0xe20x80"), out: 2 },
    { in: bytes("0x610xe20x80"), out: 3 },
]
m.test('Count', (assert) => {
    for (const tt of runecounttests) {
        const out = utf8.count(tt.in)
        assert.equal(tt.out, out, tt)
    }
})
interface RuneLenTest {
    r: utf8.Rune
    size: number
}
const runelentests: Array<RuneLenTest> = [
    { r: 0, size: 1 },
    { r: 'e'.codePointAt(0)!, size: 1 },
    { r: 'é'.codePointAt(0)!, size: 2 },
    { r: '☺'.codePointAt(0)!, size: 3 },
    { r: utf8.RuneError, size: 3 },
    { r: utf8.MaxRune, size: 4 },
    { r: 0xD800, size: -1 },
    { r: 0xDFFF, size: -1 },
    { r: utf8.MaxRune + 1, size: - 1 },
    { r: -1, size: -1 },
]
m.test('Len', (assert) => {
    for (const tt of runelentests) {
        const out = utf8.len(tt.r)
        assert.equal(tt.size, out, tt)
    }
})
interface ValidTest {
    in: Uint8Array
    out: boolean
}
const validTests: Array<ValidTest> = [
    { in: strconv.toBuffer(""), out: true },
    { in: strconv.toBuffer("a"), out: true },
    { in: strconv.toBuffer("abc"), out: true },
    { in: strconv.toBuffer("Ж"), out: true },
    { in: strconv.toBuffer("ЖЖ"), out: true },
    { in: strconv.toBuffer("брэд-ЛГТМ"), out: true },
    { in: strconv.toBuffer("☺☻☹"), out: true },
    { in: new Uint8Array([0x61, 0x61, 0xe2]), out: false },
    { in: new Uint8Array([66, 250]), out: false },
    { in: new Uint8Array([66, 250, 67]), out: false },
    { in: new Uint8Array([97, 239, 191, 189, 98]), out: true },
    { in: bytes("0xF40x8F0xBF0xBF"), out: true },      // U+10FFFF
    { in: bytes("0xF40x900x800x80"), out: false },     // U+10FFFF+1; out of range
    { in: bytes("0xF70xBF0xBF0xBF"), out: false },     // 0x1FFFFF; out of range
    { in: bytes("0xFB0xBF0xBF0xBF0xBF"), out: false }, // 0x3FFFFFF; out of range
    { in: bytes("0xc00x80"), out: false },             // U+0000 encoded in two bytes: incorrect
    { in: bytes("0xed0xa00x80"), out: false },         // U+D800 high surrogate (sic)
    { in: bytes("0xed0xbf0xbf"), out: false },         // U+DFFF low surrogate (sic)
]
m.test('Valid', (assert) => {
    for (const tt of validTests) {
        assert.equal(tt.out, utf8.isValid(tt.in), tt)
    }
})