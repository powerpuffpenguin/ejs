import * as binary from "ejs/encoding/binary";
import * as hex from "ejs/encoding/hex";

import { Assert, test } from "../../unit/unit";


const m = test.module("ejs/encoding/binary")

class Test8 {
    private readonly expect: string
    private readonly expect2: string
    constructor(readonly assert: Assert) {
        const b = new ArrayBuffer(5)
        const view = new DataView(b)
        view.setInt8(0, - 1)
        view.setInt8(1, - 2)
        view.setInt8(2, 127)
        view.setInt8(3, 0)
        const h0 = hex.encodeToString(b)
        view.setUint8(0, 1)
        view.setUint8(1, 128)
        view.setUint8(2, 129)
        view.setUint8(3, 0)
        const h1 = hex.encodeToString(b)
        this.expect = h0 + h1
        this.expect2 = h1 + h0
    }
    test(name: string, view: SetView) {
        const assert = this.assert
        view.setInt(0, - 1)
        view.setInt(1, - 2)
        view.setInt(2, 127)
        view.setInt(3, 0)

        view.setUint(5, 1)
        view.setUint(6, 128)
        view.setUint(7, 129)
        view.setUint(8, 0)

        assert.equal(-1, view.getInt(0), name)
        assert.equal(-2, view.getInt(1), name)
        assert.equal(127, view.getInt(2), name)
        assert.equal(0, view.getInt(3), name)

        assert.equal(1, view.getUint(5), name)
        assert.equal(128, view.getUint(6), name)
        assert.equal(129, view.getUint(7), name)
        assert.equal(0, view.getUint(8), name)

        assert.equal(this.expect, hex.encodeToString(view.buffer), name)

        view.setInt(5, '-1')
        view.setInt(6, '-2')
        view.setInt(7, '127')
        view.setInt(8, '0')

        view.setUint(0, '1')
        view.setUint(1, '128')
        view.setUint(2, '129')
        view.setUint(3, '0')

        assert.equal(-1, view.getInt(5), name)
        assert.equal(-2, view.getInt(6), name)
        assert.equal(127, view.getInt(7), name)
        assert.equal(0, view.getInt(8), name)

        assert.equal(1, view.getUint(0), name)
        assert.equal(128, view.getUint(1), name)
        assert.equal(129, view.getUint(2), name)
        assert.equal(0, view.getUint(3), name)

        assert.equal(this.expect2, hex.encodeToString(view.buffer), name)
    }
}
interface SetViewOptions {
    buffer: ejs.BufferData
    setInt(byteOffset: number, value: number | string): void
    setUint(byteOffset: number, value: number | string): void
    getInt(byteOffset: number): number | string
    getUint(byteOffset: number): number | string
}
class SetView {
    constructor(readonly opts: SetViewOptions) {
    }
    get buffer() {
        return this.opts.buffer
    }
    setInt(byteOffset: number, value: number | string) {
        this.opts.setInt(byteOffset, value)
    }
    setUint(byteOffset: number, value: number | string) {
        this.opts.setUint(byteOffset, value)
    }
    getInt(byteOffset: number): string | number {
        return this.opts.getInt(byteOffset)
    }
    getUint(byteOffset: number): string | number {
        return this.opts.getUint(byteOffset)
    }
}
m.test("Test8", (assert) => {
    const t = new Test8(assert)
    t.test('BigEndian', new SetView({
        buffer: new ArrayBuffer(10),
        setInt(byteOffset, value) {
            binary.BigEndian.setInt8(this.buffer, byteOffset, value)
        },
        setUint(byteOffset, value) {
            binary.BigEndian.setUint8(this.buffer, byteOffset, value)
        },
        getInt(byteOffset) {
            return binary.BigEndian.getInt8(this.buffer, byteOffset)
        },
        getUint(byteOffset) {
            return binary.BigEndian.getUint8(this.buffer, byteOffset)
        },
    }))
    t.test('LittleEndian', new SetView({
        buffer: new Uint8Array(10),
        setInt(byteOffset, value) {
            binary.LittleEndian.setInt8(this.buffer, byteOffset, value)
        },
        setUint(byteOffset, value) {
            binary.LittleEndian.setUint8(this.buffer, byteOffset, value)
        },
        getInt(byteOffset) {
            return binary.LittleEndian.getInt8(this.buffer, byteOffset)
        },
        getUint(byteOffset) {
            return binary.LittleEndian.getUint8(this.buffer, byteOffset)
        },
    }))
    const b = new ArrayBuffer(10)
    const v = new binary.DataView(b)
    t.test('DataView', new SetView({
        buffer: b,
        setInt(byteOffset, value) {
            v.setInt8(byteOffset, value)
        },
        setUint(byteOffset, value) {
            v.setUint8(byteOffset, value)
        },
        getInt(byteOffset) {
            return v.getInt8(byteOffset)
        },
        getUint(byteOffset) {
            return v.getUint8(byteOffset)
        },
    }))
})
interface SetViewNOptions {
    buffer: ejs.BufferData
    setInt(byteOffset: number, value: number | string, littleEndian?: boolean): void
    setUint(byteOffset: number, value: number | string, littleEndian?: boolean): void
    getInt(byteOffset: number, littleEndian?: boolean): number | string
    getUint(byteOffset: number, littleEndian?: boolean): number | string
}
class SetViewN {
    constructor(readonly opts: SetViewNOptions) {
    }
    get buffer() {
        return this.opts.buffer
    }
    setInt(byteOffset: number, value: number | string, littleEndian?: boolean) {
        this.opts.setInt(byteOffset, value, littleEndian)
    }
    setUint(byteOffset: number, value: number | string, littleEndian?: boolean) {
        this.opts.setUint(byteOffset, value, littleEndian)
    }
    getInt(byteOffset: number, littleEndian?: boolean): string | number {
        return this.opts.getInt(byteOffset, littleEndian)
    }
    getUint(byteOffset: number, littleEndian?: boolean): string | number {
        return this.opts.getUint(byteOffset, littleEndian)
    }
}
class Test16 {
    private readonly big: string
    private readonly big2: string
    private readonly little: string
    private readonly little2: string
    constructor(readonly assert: Assert) {
        const n = 2
        const b = new ArrayBuffer(5 * n)
        const view = new DataView(b)
        view.setInt16(0 * n, -1)
        view.setInt16(1 * n, -32768)
        view.setInt16(2 * n, 32767)
        view.setInt16(3 * n, 0)
        let h0 = hex.encodeToString(b)
        view.setUint16(0 * n, 1)
        view.setUint16(1 * n, 65534)
        view.setUint16(2 * n, 65535)
        view.setUint16(3 * n, 0)
        let h1 = hex.encodeToString(b)
        this.big = h0 + h1
        this.big2 = h1 + h0

        view.setInt16(0 * n, -1, true)
        view.setInt16(1 * n, -32768, true)
        view.setInt16(2 * n, 32767, true)
        view.setInt16(3 * n, 0, true)
        h0 = hex.encodeToString(b)
        view.setUint16(0 * n, 1, true)
        view.setUint16(1 * n, 65534, true)
        view.setUint16(2 * n, 65535, true)
        view.setUint16(3 * n, 0, true)
        h1 = hex.encodeToString(b)
        this.little = h0 + h1
        this.little2 = h1 + h0
    }
    test(name: string, view: SetViewN) {
        const n = 2
        const assert = this.assert
        let expect: string
        let expect2: string
        let tag: string
        for (const little of [false]) {
            if (little) {
                tag = `${name} little`
                expect = this.little
                expect2 = this.little2
            } else {
                tag = `${name} big`
                expect = this.big
                expect2 = this.big2
            }
            view.setInt(0 * n, -1, little)
            view.setInt(1 * n, -32768, little)
            view.setInt(2 * n, 32767, little)
            view.setInt(3 * n, 0, little)

            view.setUint(5 * n, 1, little)
            view.setUint(6 * n, 65534, little)
            view.setUint(7 * n, 65535, little)
            view.setUint(8 * n, 0, little)

            assert.equal(-1, view.getInt(0 * n, little), `${tag} int`)
            assert.equal(-32768, view.getInt(1 * n, little), `${tag} int`)
            assert.equal(32767, view.getInt(2 * n, little), `${tag} int`)
            assert.equal(0, view.getInt(3 * n, little), `${tag} int`)

            assert.equal(1, view.getUint(5 * n, little), `${tag} uint`)
            assert.equal(65534, view.getUint(6 * n, little), `${tag} uint`)
            assert.equal(65535, view.getUint(7 * n, little), `${tag} uint`)
            assert.equal(0, view.getUint(8 * n, little), `${tag} uint`)

            assert.equal(expect, hex.encodeToString(view.buffer), tag)

            view.setInt(5 * n, '-1', little)
            view.setInt(6 * n, '-32768', little)
            view.setInt(7 * n, '32767', little)
            view.setInt(8 * n, '0', little)

            view.setUint(0 * n, '1', little)
            view.setUint(1 * n, '65534', little)
            view.setUint(2 * n, '65535', little)
            view.setUint(3 * n, '0', little)

            assert.equal(-1, view.getInt(5 * n, little), `${tag}2 int`)
            assert.equal(-32768, view.getInt(6 * n, little), `${tag}2 int`)
            assert.equal(32767, view.getInt(7 * n, little), `${tag}2 int`)
            assert.equal(0, view.getInt(8 * n, little), `${tag}2 int`)

            assert.equal(1, view.getUint(0 * n, little), `${tag}2 uint`)
            assert.equal(65534, view.getUint(1 * n, little), `${tag}2 uint`)
            assert.equal(65535, view.getUint(2 * n, little), `${tag}2 uint`)
            assert.equal(0, view.getUint(3 * n, little), `${tag}2 uint`)

            assert.equal(expect2, hex.encodeToString(view.buffer), `${tag}2`)
        }
    }
}
m.test("Test16", (assert) => {
    const t = new Test16(assert)
    const n = 2
    t.test('BigEndian-LittleEndian', new SetViewN({
        buffer: new Uint8Array(10 * n),
        setInt(byteOffset, value, littleEndian) {
            if (littleEndian) {
                binary.LittleEndian.setInt16(this.buffer, byteOffset, value)
            } else {
                binary.BigEndian.setInt16(this.buffer, byteOffset, value)
            }
        },
        setUint(byteOffset, value, littleEndian) {
            if (littleEndian) {
                binary.LittleEndian.setUint16(this.buffer, byteOffset, value)
            } else {
                binary.BigEndian.setUint16(this.buffer, byteOffset, value)
            }
        },
        getInt(byteOffset, littleEndian) {
            if (littleEndian) {
                return binary.LittleEndian.getInt16(this.buffer, byteOffset)
            }
            return binary.BigEndian.getInt16(this.buffer, byteOffset)
        },
        getUint(byteOffset, littleEndian) {
            if (littleEndian) {
                return binary.LittleEndian.getUint16(this.buffer, byteOffset)
            }
            return binary.BigEndian.getUint16(this.buffer, byteOffset)
        },
    }))
    const b = new ArrayBuffer(10 * n)
    const v = new binary.DataView(b)
    t.test('DataView', new SetViewN({
        buffer: b,
        setInt(byteOffset, value, littleEndian) {
            v.setInt16(byteOffset, value, littleEndian)
        },
        setUint(byteOffset, value, littleEndian) {
            v.setUint16(byteOffset, value, littleEndian)
        },
        getInt(byteOffset, littleEndian) {
            return v.getInt16(byteOffset, littleEndian)
        },
        getUint(byteOffset, littleEndian) {
            return v.getUint16(byteOffset, littleEndian)
        },
    }))
})
class Test32 {
    private readonly big: string
    private readonly big2: string
    private readonly little: string
    private readonly little2: string
    constructor(readonly assert: Assert) {
        const n = 4
        const b = new ArrayBuffer(5 * n)
        const view = new DataView(b)
        view.setInt32(0 * n, -1)
        view.setInt32(1 * n, -2147483648)
        view.setInt32(2 * n, 2147483647)
        view.setInt32(3 * n, 0)
        let h0 = hex.encodeToString(b)
        view.setUint32(0 * n, 1)
        view.setUint32(1 * n, 4294967294)
        view.setUint32(2 * n, 4294967295)
        view.setUint32(3 * n, 0)
        let h1 = hex.encodeToString(b)
        this.big = h0 + h1
        this.big2 = h1 + h0

        view.setInt32(0 * n, -1, true)
        view.setInt32(1 * n, -2147483648, true)
        view.setInt32(2 * n, 2147483647, true)
        view.setInt32(3 * n, 0, true)
        h0 = hex.encodeToString(b)
        view.setUint32(0 * n, 1, true)
        view.setUint32(1 * n, 4294967294, true)
        view.setUint32(2 * n, 4294967295, true)
        view.setUint32(3 * n, 0, true)
        h1 = hex.encodeToString(b)
        this.little = h0 + h1
        this.little2 = h1 + h0
    }
    test(name: string, view: SetViewN) {
        const n = 4
        const assert = this.assert
        let expect: string
        let expect2: string
        let tag: string
        for (const little of [false]) {
            if (little) {
                tag = `${name} little`
                expect = this.little
                expect2 = this.little2
            } else {
                tag = `${name} big`
                expect = this.big
                expect2 = this.big2
            }
            view.setInt(0 * n, -1, little)
            view.setInt(1 * n, -2147483648, little)
            view.setInt(2 * n, 2147483647, little)
            view.setInt(3 * n, 0, little)

            view.setUint(5 * n, 1, little)
            view.setUint(6 * n, 4294967294, little)
            view.setUint(7 * n, 4294967295, little)
            view.setUint(8 * n, 0, little)

            assert.equal(-1, view.getInt(0 * n, little), `${tag} int`)
            assert.equal(-2147483648, view.getInt(1 * n, little), `${tag} int`)
            assert.equal(2147483647, view.getInt(2 * n, little), `${tag} int`)
            assert.equal(0, view.getInt(3 * n, little), `${tag} int`)

            assert.equal(1, view.getUint(5 * n, little), `${tag} uint`)
            assert.equal(4294967294, view.getUint(6 * n, little), `${tag} uint`)
            assert.equal(4294967295, view.getUint(7 * n, little), `${tag} uint`)
            assert.equal(0, view.getUint(8 * n, little), `${tag} uint`)

            assert.equal(expect, hex.encodeToString(view.buffer), tag)

            view.setInt(5 * n, '-1', little)
            view.setInt(6 * n, '-2147483648', little)
            view.setInt(7 * n, '2147483647', little)
            view.setInt(8 * n, '0', little)

            view.setUint(0 * n, '1', little)
            view.setUint(1 * n, '4294967294', little)
            view.setUint(2 * n, '4294967295', little)
            view.setUint(3 * n, '0', little)

            assert.equal(-1, view.getInt(5 * n, little), `${tag}2 int`)
            assert.equal(-2147483648, view.getInt(6 * n, little), `${tag}2 int`)
            assert.equal(2147483647, view.getInt(7 * n, little), `${tag}2 int`)
            assert.equal(0, view.getInt(8 * n, little), `${tag}2 int`)

            assert.equal(1, view.getUint(0 * n, little), `${tag}2 uint`)
            assert.equal(4294967294, view.getUint(1 * n, little), `${tag}2 uint`)
            assert.equal(4294967295, view.getUint(2 * n, little), `${tag}2 uint`)
            assert.equal(0, view.getUint(3 * n, little), `${tag}2 uint`)

            assert.equal(expect2, hex.encodeToString(view.buffer), `${tag}2`)
        }
    }
}
m.test("Test32", (assert) => {
    const t = new Test32(assert)
    const n = 4
    t.test('BigEndian-LittleEndian', new SetViewN({
        buffer: new Uint8Array(10 * n),
        setInt(byteOffset, value, littleEndian) {
            if (littleEndian) {
                binary.LittleEndian.setInt32(this.buffer, byteOffset, value)
            } else {
                binary.BigEndian.setInt32(this.buffer, byteOffset, value)
            }
        },
        setUint(byteOffset, value, littleEndian) {
            if (littleEndian) {
                binary.LittleEndian.setUint32(this.buffer, byteOffset, value)
            } else {
                binary.BigEndian.setUint32(this.buffer, byteOffset, value)
            }
        },
        getInt(byteOffset, littleEndian) {
            if (littleEndian) {
                return binary.LittleEndian.getInt32(this.buffer, byteOffset)
            }
            return binary.BigEndian.getInt32(this.buffer, byteOffset)
        },
        getUint(byteOffset, littleEndian) {
            if (littleEndian) {
                return binary.LittleEndian.getUint32(this.buffer, byteOffset)
            }
            return binary.BigEndian.getUint32(this.buffer, byteOffset)
        },
    }))
    const b = new ArrayBuffer(10 * n)
    const v = new binary.DataView(b)
    t.test('DataView', new SetViewN({
        buffer: b,
        setInt(byteOffset, value, littleEndian) {
            v.setInt32(byteOffset, value, littleEndian)
        },
        setUint(byteOffset, value, littleEndian) {
            v.setUint32(byteOffset, value, littleEndian)
        },
        getInt(byteOffset, littleEndian) {
            return v.getInt32(byteOffset, littleEndian)
        },
        getUint(byteOffset, littleEndian) {
            return v.getUint32(byteOffset, littleEndian)
        },
    }))
})
class Test64 {
    private readonly big = 'ffffffffffffffffffe0000000000001ffe0000000000002000000000000000000000000000000000000000000000001001ffffffffffffe001fffffffffffff00000000000000000000000000000000'
    private readonly big2 = '0000000000000001001ffffffffffffe001fffffffffffff00000000000000000000000000000000ffffffffffffffffffe0000000000001ffe000000000000200000000000000000000000000000000'
    private readonly little = 'ffffffffffffffff010000000000e0ff020000000000e0ff000000000000000000000000000000000100000000000000feffffffffff1f00ffffffffffff1f0000000000000000000000000000000000'
    private readonly little2 = '0100000000000000feffffffffff1f00ffffffffffff1f0000000000000000000000000000000000ffffffffffffffff010000000000e0ff020000000000e0ff00000000000000000000000000000000'
    constructor(readonly assert: Assert) { }
    test(name: string, view: SetViewN) {
        const n = 8
        const assert = this.assert
        let expect: string
        let expect2: string
        let tag: string
        for (const little of [false]) {
            if (little) {
                tag = `${name} little`
                expect = this.little
                expect2 = this.little2
            } else {
                tag = `${name} big`
                expect = this.big
                expect2 = this.big2
            }
            view.setInt(0 * n, -1, little)
            view.setInt(1 * n, -9007199254740991, little)
            view.setInt(2 * n, -9007199254740990, little)
            view.setInt(3 * n, 0, little)

            view.setUint(5 * n, 1, little)
            view.setUint(6 * n, 9007199254740990, little)
            view.setUint(7 * n, 9007199254740991, little)
            view.setUint(8 * n, 0, little)

            assert.equal(-1, view.getInt(0 * n, little), `${tag} int`)
            assert.equal(-9007199254740991, view.getInt(1 * n, little), `${tag} int`)
            assert.equal(-9007199254740990, view.getInt(2 * n, little), `${tag} int`)
            assert.equal(0, view.getInt(3 * n, little), `${tag} int`)

            assert.equal(1, view.getUint(5 * n, little), `${tag} uint`)
            assert.equal(9007199254740990, view.getUint(6 * n, little), `${tag} uint`)
            assert.equal(9007199254740991, view.getUint(7 * n, little), `${tag} uint`)
            assert.equal(0, view.getUint(8 * n, little), `${tag} uint`)

            assert.equal(expect, hex.encodeToString(view.buffer), tag)

            view.setInt(5 * n, '-1', little)
            view.setInt(6 * n, '-9007199254740991', little)
            view.setInt(7 * n, '-9007199254740990', little)
            view.setInt(8 * n, '0', little)

            view.setUint(0 * n, '1', little)
            view.setUint(1 * n, '9007199254740990', little)
            view.setUint(2 * n, '9007199254740991', little)
            view.setUint(3 * n, '0', little)

            assert.equal(-1, view.getInt(5 * n, little), `${tag}2 int`)
            assert.equal(-9007199254740991, view.getInt(6 * n, little), `${tag}2 int`)
            assert.equal(-9007199254740990, view.getInt(7 * n, little), `${tag}2 int`)
            assert.equal(0, view.getInt(8 * n, little), `${tag}2 int`)

            assert.equal(1, view.getUint(0 * n, little), `${tag}2 uint`)
            assert.equal(9007199254740990, view.getUint(1 * n, little), `${tag}2 uint`)
            assert.equal(9007199254740991, view.getUint(2 * n, little), `${tag}2 uint`)
            assert.equal(0, view.getUint(3 * n, little), `${tag}2 uint`)

            assert.equal(expect2, hex.encodeToString(view.buffer), `${tag}2`)
        }
    }
}
m.test("Test64", (assert) => {
    const t = new Test64(assert)
    const n = 8
    t.test('BigEndian-LittleEndian', new SetViewN({
        buffer: new Uint8Array(10 * n),
        setInt(byteOffset, value, littleEndian) {
            if (littleEndian) {
                binary.LittleEndian.setInt64(this.buffer, byteOffset, value)
            } else {
                binary.BigEndian.setInt64(this.buffer, byteOffset, value)
            }
        },
        setUint(byteOffset, value, littleEndian) {
            if (littleEndian) {
                binary.LittleEndian.setUint64(this.buffer, byteOffset, value)
            } else {
                binary.BigEndian.setUint64(this.buffer, byteOffset, value)
            }
        },
        getInt(byteOffset, littleEndian) {
            if (littleEndian) {
                return binary.LittleEndian.getInt64(this.buffer, byteOffset)
            }
            return binary.BigEndian.getInt64(this.buffer, byteOffset)
        },
        getUint(byteOffset, littleEndian) {
            if (littleEndian) {
                return binary.LittleEndian.getUint64(this.buffer, byteOffset)
            }
            return binary.BigEndian.getUint64(this.buffer, byteOffset)
        },
    }))
    const b = new ArrayBuffer(10 * n)
    const v = new binary.DataView(b)
    t.test('DataView', new SetViewN({
        buffer: b,
        setInt(byteOffset, value, littleEndian) {
            v.setInt64(byteOffset, value, littleEndian)
        },
        setUint(byteOffset, value, littleEndian) {
            v.setUint64(byteOffset, value, littleEndian)
        },
        getInt(byteOffset, littleEndian) {
            return v.getInt64(byteOffset, littleEndian)
        },
        getUint(byteOffset, littleEndian) {
            return v.getUint64(byteOffset, littleEndian)
        },
    }))
})