import { test } from "../../unit/unit";
import * as strconv from "ejs/strconv";
const m = test.module("ejs/strconv")

interface itob64Test {
    _s: string
    in: string
    base: number
    out: string
}

const itob64tests: Array<itob64Test> = [
    { "_s": "0", "in": "0000000000000000", "base": 10, "out": "0" },
    { "_s": "1", "in": "0000000000000001", "base": 10, "out": "1" },
    { "_s": "-1", "in": "ffffffffffffffff", "base": 10, "out": "-1" },
    { "_s": "12345678", "in": "0000000000bc614e", "base": 10, "out": "12345678" },
    { "_s": "-987654321", "in": "ffffffffc521974f", "base": 10, "out": "-987654321" },
    { "_s": "2147483647", "in": "000000007fffffff", "base": 10, "out": "2147483647" },
    { "_s": "-2147483647", "in": "ffffffff80000001", "base": 10, "out": "-2147483647" },
    { "_s": "2147483648", "in": "0000000080000000", "base": 10, "out": "2147483648" },
    { "_s": "-2147483648", "in": "ffffffff80000000", "base": 10, "out": "-2147483648" },
    { "_s": "2147483649", "in": "0000000080000001", "base": 10, "out": "2147483649" },
    { "_s": "-2147483649", "in": "ffffffff7fffffff", "base": 10, "out": "-2147483649" },
    { "_s": "4294967295", "in": "00000000ffffffff", "base": 10, "out": "4294967295" },
    { "_s": "-4294967295", "in": "ffffffff00000001", "base": 10, "out": "-4294967295" },
    { "_s": "4294967296", "in": "0000000100000000", "base": 10, "out": "4294967296" },
    { "_s": "-4294967296", "in": "ffffffff00000000", "base": 10, "out": "-4294967296" },
    { "_s": "4294967297", "in": "0000000100000001", "base": 10, "out": "4294967297" },
    { "_s": "-4294967297", "in": "fffffffeffffffff", "base": 10, "out": "-4294967297" },
    { "_s": "1125899906842624", "in": "0004000000000000", "base": 10, "out": "1125899906842624" },
    { "_s": "9223372036854775807", "in": "7fffffffffffffff", "base": 10, "out": "9223372036854775807" },
    { "_s": "-9223372036854775807", "in": "8000000000000001", "base": 10, "out": "-9223372036854775807" },
    { "_s": "-9223372036854775808", "in": "8000000000000000", "base": 10, "out": "-9223372036854775808" },
    { "_s": "0", "in": "0000000000000000", "base": 2, "out": "0" },
    { "_s": "10", "in": "000000000000000a", "base": 2, "out": "1010" },
    { "_s": "-1", "in": "ffffffffffffffff", "base": 2, "out": "-1" },
    { "_s": "32768", "in": "0000000000008000", "base": 2, "out": "1000000000000000" },
    { "_s": "-8", "in": "fffffffffffffff8", "base": 8, "out": "-10" },
    { "_s": "6416645477", "in": "000000017e763d65", "base": 8, "out": "57635436545" },
    { "_s": "16777216", "in": "0000000001000000", "base": 8, "out": "100000000" },
    { "_s": "16", "in": "0000000000000010", "base": 16, "out": "10" },
    { "_s": "-81985529216486895", "in": "fedcba9876543211", "base": 16, "out": "-123456789abcdef" },
    { "_s": "9223372036854775807", "in": "7fffffffffffffff", "base": 16, "out": "7fffffffffffffff" },
    { "_s": "9223372036854775807", "in": "7fffffffffffffff", "base": 2, "out": "111111111111111111111111111111111111111111111111111111111111111" },
    { "_s": "-9223372036854775808", "in": "8000000000000000", "base": 2, "out": "-1000000000000000000000000000000000000000000000000000000000000000" },
    { "_s": "16", "in": "0000000000000010", "base": 17, "out": "g" },
    { "_s": "25", "in": "0000000000000019", "base": 25, "out": "10" },
    { "_s": "32544027072", "in": "0000000793c671c0", "base": 35, "out": "holycow" },
    { "_s": "38493362624", "in": "00000008f66219c0", "base": 36, "out": "holycow" },
]
m.test("Itoa", (assert) => {
    let s: string;
    const formatInt: (i: string, base?: number) => string = (strconv as any)._formatInt
    const formatUint: (i: string, base?: number) => string = (strconv as any)._formatUint
    const itoa: (i: string) => string = (strconv as any)._itoa
    for (const test of itob64tests) {
        s = formatInt(test.in, test.base)
        assert.equal(test.out, s, test)

        const buf = new TextEncoder().encode("abc")
        const builder: any = new strconv.StringBuilder(buf, buf.length)
        builder._appendInt(test.in, test.base)
        assert.equal("abc" + test.out, builder.toString(), test)
        builder.reset()
        builder._appendInt(test.in, test.base)
        assert.equal(test.out, builder.toString(), test)



        if (test._s[0] != "-") {
            s = formatUint(test.in, test.base)
            assert.equal(test.out, s, test)

            const buf = new TextEncoder().encode("abc")
            const builder: any = new strconv.StringBuilder(buf, buf.length)
            builder._appendInt(test.in, test.base)
            assert.equal("abc" + test.out, builder.toString(), test)
            builder.reset()
            builder._appendInt(test.in, test.base)
            assert.equal(test.out, builder.toString(), test)
        }

        if (test.base == 10) {
            s = itoa(test.in)
            assert.equal(test.out, s, test)
        }
    }
    try {
        strconv.formatUint(12345678, 1)
    } catch (e) {
        return
    }
    assert.true(false, "expected panic due to illegal base")
})

interface uitob64Test {
    _s: string
    in: string
    base: number
    out: string
}
const uitob64tests: Array<uitob64Test> = [
    { "_s": "9223372036854775807", "in": "7fffffffffffffff", "base": 10, "out": "9223372036854775807" },
    { "_s": "9223372036854775808", "in": "8000000000000000", "base": 10, "out": "9223372036854775808" },
    { "_s": "9223372036854775809", "in": "8000000000000001", "base": 10, "out": "9223372036854775809" },
    { "_s": "18446744073709551614", "in": "fffffffffffffffe", "base": 10, "out": "18446744073709551614" },
    { "_s": "18446744073709551615", "in": "ffffffffffffffff", "base": 10, "out": "18446744073709551615" },
    { "_s": "18446744073709551615", "in": "ffffffffffffffff", "base": 2, "out": "1111111111111111111111111111111111111111111111111111111111111111" },
]
m.test("Uitoa", (assert) => {
    let s: string;
    const formatUint: (i: string, base?: number) => string = (strconv as any)._formatUint
    for (const test of uitob64tests) {
        s = formatUint(test.in, test.base)
        assert.equal(test.out, s, test)

        const buf = new TextEncoder().encode("abc")
        const builder: any = new strconv.StringBuilder(buf, buf.length)
        builder._appendUint(test.in, test.base)
        assert.equal("abc" + test.out, builder.toString(), test)
        builder.reset()
        builder._appendUint(test.in, test.base)
        assert.equal(test.out, builder.toString(), test)
    }
})
const varlenUints = [
    { "_s": "1", "in": "0000000000000001", "out": "1" },
    { "_s": "12", "in": "000000000000000c", "out": "12" },
    { "_s": "123", "in": "000000000000007b", "out": "123" },
    { "_s": "1234", "in": "00000000000004d2", "out": "1234" },
    { "_s": "12345", "in": "0000000000003039", "out": "12345" },
    { "_s": "123456", "in": "000000000001e240", "out": "123456" },
    { "_s": "1234567", "in": "000000000012d687", "out": "1234567" },
    { "_s": "12345678", "in": "0000000000bc614e", "out": "12345678" },
    { "_s": "123456789", "in": "00000000075bcd15", "out": "123456789" },
    { "_s": "1234567890", "in": "00000000499602d2", "out": "1234567890" },
    { "_s": "12345678901", "in": "00000002dfdc1c35", "out": "12345678901" },
    { "_s": "123456789012", "in": "0000001cbe991a14", "out": "123456789012" },
    { "_s": "1234567890123", "in": "0000011f71fb04cb", "out": "1234567890123" },
    { "_s": "12345678901234", "in": "00000b3a73ce2ff2", "out": "12345678901234" },
    { "_s": "123456789012345", "in": "00007048860ddf79", "out": "123456789012345" },
    { "_s": "1234567890123456", "in": "000462d53c8abac0", "out": "1234567890123456" },
    { "_s": "12345678901234567", "in": "002bdc545d6b4b87", "out": "12345678901234567" },
    { "_s": "123456789012345678", "in": "01b69b4ba630f34e", "out": "123456789012345678" },
    { "_s": "1234567890123456789", "in": "112210f47de98115", "out": "1234567890123456789" },
    { "_s": "12345678901234567890", "in": "ab54a98ceb1f0ad2", "out": "12345678901234567890" },
]
m.test("FormatUintVarlen", (assert) => {
    let s: string;
    const formatUint: (i: string, base?: number) => string = (strconv as any)._formatUint
    for (const test of varlenUints) {
        s = formatUint(test.in, 10)
        assert.equal(test.out, s, test)

        const buf = new TextEncoder().encode("abc")
        const builder: any = new strconv.StringBuilder(buf, buf.length)
        builder._appendUint(test.in, 10)
        assert.equal("abc" + test.out, builder.toString(), test)
        builder.reset()
        builder._appendUint(test.in, 10)
        assert.equal(test.out, builder.toString(), test)
    }
})
