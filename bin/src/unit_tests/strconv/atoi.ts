import { test } from "../../unit/unit";
import * as strconv from "ejs/strconv";
const m = test.module("ejs/strconv")
const nil = undefined
const ErrSyntax = strconv.ErrSyntax
const ErrRange = strconv.ErrRange
interface parseUint64Test {
    in: string
    out: number | string
    err?: Error
}

const parseUint64Tests: Array<parseUint64Test> = [
    { in: "", out: 0, err: ErrSyntax },
    { in: "0", out: 0, err: nil },
    { in: "1", out: 1, err: nil },
    { in: "12345", out: 12345, err: nil },
    { in: "012345", out: 12345, err: nil },
    { in: "12345x", out: 0, err: ErrSyntax },
    { in: "98765432100", out: 98765432100, err: nil },
    { in: "18446744073709551615", out: "18446744073709551615", err: nil },
    { in: "18446744073709551616", out: 0, err: ErrRange },
    { in: "18446744073709551620", out: 0, err: ErrRange },
    { in: "1_2_3_4_5", out: 0, err: ErrSyntax }, // base=10 so no underscores allowed
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "1__2345", out: 0, err: ErrSyntax },
    { in: "12345_", out: 0, err: ErrSyntax },
    { in: "-0", out: 0, err: ErrSyntax },
    { in: "-1", out: 0, err: ErrSyntax },
    { in: "+1", out: 0, err: ErrSyntax },
]
interface parseUint64BaseTest {
    in: string
    base: number
    out: number | string
    err?: Error
}

const parseUint64BaseTests: Array<parseUint64BaseTest> = [
    { in: "", base: 0, out: 0, err: ErrSyntax },
    { in: "0", base: 0, out: 0, err: nil },
    { in: "0x", base: 0, out: 0, err: ErrSyntax },
    { in: "0X", base: 0, out: 0, err: ErrSyntax },
    { in: "1", base: 0, out: 1, err: nil },
    { in: "12345", base: 0, out: 12345, err: nil },
    { in: "012345", base: 0, out: 0o12345, err: nil },
    { in: "0x12345", base: 0, out: 0x12345, err: nil },
    { in: "0X12345", base: 0, out: 0x12345, err: nil },
    { in: "12345x", base: 0, out: 0, err: ErrSyntax },
    { in: "0xabcdefg123", base: 0, out: 0, err: ErrSyntax },
    { in: "123456789abc", base: 0, out: 0, err: ErrSyntax },
    { in: "98765432100", base: 0, out: 98765432100, err: nil },
    { in: "18446744073709551615", base: 0, out: "18446744073709551615", err: nil },
    { in: "18446744073709551616", base: 0, out: 0, err: ErrRange },
    { in: "18446744073709551620", base: 0, out: 0, err: ErrRange },
    { in: "0xFFFFFFFFFFFFFFFF", base: 0, out: "18446744073709551615", err: nil },
    { in: "0x10000000000000000", base: 0, out: 0, err: ErrRange },
    { in: "01777777777777777777777", base: 0, out: "18446744073709551615", err: nil },
    { in: "01777777777777777777778", base: 0, out: 0, err: ErrSyntax },
    { in: "02000000000000000000000", base: 0, out: 0, err: ErrRange },
    { in: "0200000000000000000000", base: 0, out: "2305843009213693952", err: nil },
    { in: "0b", base: 0, out: 0, err: ErrSyntax },
    { in: "0B", base: 0, out: 0, err: ErrSyntax },
    { in: "0b101", base: 0, out: 5, err: nil },
    { in: "0B101", base: 0, out: 5, err: nil },
    { in: "0o", base: 0, out: 0, err: ErrSyntax },
    { in: "0O", base: 0, out: 0, err: ErrSyntax },
    { in: "0o377", base: 0, out: 255, err: nil },
    { in: "0O377", base: 0, out: 255, err: nil },

    // underscores allowed with base == 0 only
    { in: "1_2_3_4_5", base: 0, out: 12345, err: nil }, // base 0 => 10
    { in: "_12345", base: 0, out: 0, err: ErrSyntax },
    { in: "1__2345", base: 0, out: 0, err: ErrSyntax },
    { in: "12345_", base: 0, out: 0, err: ErrSyntax },

    { in: "1_2_3_4_5", base: 10, out: 0, err: ErrSyntax }, // base 10
    { in: "_12345", base: 10, out: 0, err: ErrSyntax },
    { in: "1__2345", base: 10, out: 0, err: ErrSyntax },
    { in: "12345_", base: 10, out: 0, err: ErrSyntax },

    { in: "0x_1_2_3_4_5", base: 0, out: 0x12345, err: nil }, // base 0 => 16
    { in: "_0x12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x1__2345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x1234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "0x12345_", base: 0, out: 0, err: ErrSyntax },

    { in: "1_2_3_4_5", base: 16, out: 0, err: ErrSyntax }, // base 16
    { in: "_12345", base: 16, out: 0, err: ErrSyntax },
    { in: "1__2345", base: 16, out: 0, err: ErrSyntax },
    { in: "1234__5", base: 16, out: 0, err: ErrSyntax },
    { in: "12345_", base: 16, out: 0, err: ErrSyntax },

    { in: "0_1_2_3_4_5", base: 0, out: 0o12345, err: nil }, // base 0 => 8 (0377)
    { in: "_012345", base: 0, out: 0, err: ErrSyntax },
    { in: "0__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "01234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "012345_", base: 0, out: 0, err: ErrSyntax },

    { in: "0o_1_2_3_4_5", base: 0, out: 0o12345, err: nil }, // base 0 => 8 (0o377)
    { in: "_0o12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0o__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0o1234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "0o12345_", base: 0, out: 0, err: ErrSyntax },

    { in: "0_1_2_3_4_5", base: 8, out: 0, err: ErrSyntax }, // base 8
    { in: "_012345", base: 8, out: 0, err: ErrSyntax },
    { in: "0__12345", base: 8, out: 0, err: ErrSyntax },
    { in: "01234__5", base: 8, out: 0, err: ErrSyntax },
    { in: "012345_", base: 8, out: 0, err: ErrSyntax },

    { in: "0b_1_0_1", base: 0, out: 5, err: nil }, // base 0 => 2 (0b101)
    { in: "_0b101", base: 0, out: 0, err: ErrSyntax },
    { in: "0b__101", base: 0, out: 0, err: ErrSyntax },
    { in: "0b1__01", base: 0, out: 0, err: ErrSyntax },
    { in: "0b10__1", base: 0, out: 0, err: ErrSyntax },
    { in: "0b101_", base: 0, out: 0, err: ErrSyntax },

    { in: "1_0_1", base: 2, out: 0, err: ErrSyntax }, // base 2
    { in: "_101", base: 2, out: 0, err: ErrSyntax },
    { in: "1_01", base: 2, out: 0, err: ErrSyntax },
    { in: "10_1", base: 2, out: 0, err: ErrSyntax },
    { in: "101_", base: 2, out: 0, err: ErrSyntax },
]
interface parseInt64Test {
    in: string
    out: number | string
    err?: Error
}

const parseInt64Tests: Array<parseInt64Test> = [
    { in: "", out: 0, err: ErrSyntax },
    { in: "0", out: 0, err: nil },
    { in: "-0", out: 0, err: nil },
    { in: "+0", out: 0, err: nil },
    { in: "1", out: 1, err: nil },
    { in: "-1", out: -1, err: nil },
    { in: "+1", out: 1, err: nil },
    { in: "12345", out: 12345, err: nil },
    { in: "-12345", out: -12345, err: nil },
    { in: "012345", out: 12345, err: nil },
    { in: "-012345", out: -12345, err: nil },
    { in: "98765432100", out: 98765432100, err: nil },
    { in: "-98765432100", out: -98765432100, err: nil },
    { in: "9223372036854775807", out: "9223372036854775807", err: nil },
    { in: "-9223372036854775807", out: "-9223372036854775807", err: nil },
    { in: "9223372036854775808", out: 0, err: ErrRange },
    { in: "-9223372036854775808", out: "-9223372036854775808", err: nil },
    { in: "9223372036854775809", out: 0, err: ErrRange },
    { in: "-9223372036854775809", out: 0, err: ErrRange },
    { in: "-1_2_3_4_5", out: 0, err: ErrSyntax }, // base=10 so no underscores allowed
    { in: "-_12345", out: 0, err: ErrSyntax },
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "1__2345", out: 0, err: ErrSyntax },
    { in: "12345_", out: 0, err: ErrSyntax },
    { in: "123%45", out: 0, err: ErrSyntax },
]
interface parseInt64BaseTest {
    in: string
    base: number
    out: number | string
    err?: Error
}

const parseInt64BaseTests: Array<parseInt64BaseTest> = [
    { in: "", base: 0, out: 0, err: ErrSyntax },
    { in: "0", base: 0, out: 0, err: nil },
    { in: "-0", base: 0, out: 0, err: nil },
    { in: "1", base: 0, out: 1, err: nil },
    { in: "-1", base: 0, out: -1, err: nil },
    { in: "12345", base: 0, out: 12345, err: nil },
    { in: "-12345", base: 0, out: -12345, err: nil },
    { in: "012345", base: 0, out: 0o12345, err: nil },
    { in: "-012345", base: 0, out: -0o12345, err: nil },
    { in: "0x12345", base: 0, out: 0x12345, err: nil },
    { in: "-0X12345", base: 0, out: -0x12345, err: nil },
    { in: "12345x", base: 0, out: 0, err: ErrSyntax },
    { in: "-12345x", base: 0, out: 0, err: ErrSyntax },
    { in: "98765432100", base: 0, out: 98765432100, err: nil },
    { in: "-98765432100", base: 0, out: -98765432100, err: nil },
    { in: "9223372036854775807", base: 0, out: "9223372036854775807", err: nil },
    { in: "-9223372036854775807", base: 0, out: "-9223372036854775807", err: nil },
    { in: "9223372036854775808", base: 0, out: 0, err: ErrRange },
    { in: "-9223372036854775808", base: 0, out: "-9223372036854775808", err: nil },
    { in: "9223372036854775809", base: 0, out: 0, err: ErrRange },
    { in: "-9223372036854775809", base: 0, out: 0, err: ErrRange },

    // other bases
    { in: "g", base: 17, out: 16, err: nil },
    { in: "10", base: 25, out: 25, err: nil },
    { in: "holycow", base: 35, out: (((((17 * 35 + 24) * 35 + 21) * 35 + 34) * 35 + 12) * 35 + 24) * 35 + 32, err: nil },
    { in: "holycow", base: 36, out: (((((17 * 36 + 24) * 36 + 21) * 36 + 34) * 36 + 12) * 36 + 24) * 36 + 32, err: nil },

    // base 2
    { in: "0", base: 2, out: 0, err: nil },
    { in: "-1", base: 2, out: -1, err: nil },
    { in: "1010", base: 2, out: 10, err: nil },
    { in: "1000000000000000", base: 2, out: 1 << 15, err: nil },
    { in: "111111111111111111111111111111111111111111111111111111111111111", base: 2, out: "9223372036854775807", err: nil },
    { in: "1000000000000000000000000000000000000000000000000000000000000000", base: 2, out: 0, err: ErrRange },
    { in: "-1000000000000000000000000000000000000000000000000000000000000000", base: 2, out: "-9223372036854775808", err: nil },
    { in: "-1000000000000000000000000000000000000000000000000000000000000001", base: 2, out: 0, err: ErrRange },

    // base 8
    { in: "-10", base: 8, out: -8, err: nil },
    { in: "57635436545", base: 8, out: 0o57635436545, err: nil },
    { in: "100000000", base: 8, out: 1 << 24, err: nil },

    // base 16
    { in: "10", base: 16, out: 16, err: nil },
    { in: "-123456789abcdef", base: 16, out: "-81985529216486895", err: nil },
    { in: "7fffffffffffffff", base: 16, out: "9223372036854775807", err: nil },

    // underscores
    { in: "-0x_1_2_3_4_5", base: 0, out: -0x12345, err: nil },
    { in: "0x_1_2_3_4_5", base: 0, out: 0x12345, err: nil },
    { in: "-_0x12345", base: 0, out: 0, err: ErrSyntax },
    { in: "_-0x12345", base: 0, out: 0, err: ErrSyntax },
    { in: "_0x12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x1__2345", base: 0, out: 0, err: ErrSyntax },
    { in: "0x1234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "0x12345_", base: 0, out: 0, err: ErrSyntax },

    { in: "-0_1_2_3_4_5", base: 0, out: -0o12345, err: nil }, // octal
    { in: "0_1_2_3_4_5", base: 0, out: 0o12345, err: nil },   // octal
    { in: "-_012345", base: 0, out: 0, err: ErrSyntax },
    { in: "_-012345", base: 0, out: 0, err: ErrSyntax },
    { in: "_012345", base: 0, out: 0, err: ErrSyntax },
    { in: "0__12345", base: 0, out: 0, err: ErrSyntax },
    { in: "01234__5", base: 0, out: 0, err: ErrSyntax },
    { in: "012345_", base: 0, out: 0, err: ErrSyntax },

    { in: "+0xf", base: 0, out: 0xf, err: nil },
    { in: "-0xf", base: 0, out: -0xf, err: nil },
    { in: "0x+f", base: 0, out: 0, err: ErrSyntax },
    { in: "0x-f", base: 0, out: 0, err: ErrSyntax },
]

interface parseUint32Test {
    in: string
    out: number
    err?: Error
}

const parseUint32Tests: Array<parseUint32Test> = [
    { in: "", out: 0, err: ErrSyntax },
    { in: "0", out: 0, err: nil },
    { in: "1", out: 1, err: nil },
    { in: "12345", out: 12345, err: nil },
    { in: "012345", out: 12345, err: nil },
    { in: "12345x", out: 0, err: ErrSyntax },
    { in: "987654321", out: 987654321, err: nil },
    { in: "4294967295", out: 4294967295, err: nil },
    { in: "4294967296", out: 0, err: ErrRange },
    { in: "1_2_3_4_5", out: 0, err: ErrSyntax }, // base=10 so no underscores allowed
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "1__2345", out: 0, err: ErrSyntax },
    { in: "12345_", out: 0, err: ErrSyntax },
]

interface parseInt32Test {
    in: string
    out: number
    err?: Error
}

const parseInt32Tests: Array<parseInt32Test> = [
    { in: "", out: 0, err: ErrSyntax },
    { in: "0", out: 0, err: nil },
    { in: "-0", out: 0, err: nil },
    { in: "1", out: 1, err: nil },
    { in: "-1", out: -1, err: nil },
    { in: "12345", out: 12345, err: nil },
    { in: "-12345", out: -12345, err: nil },
    { in: "012345", out: 12345, err: nil },
    { in: "-012345", out: -12345, err: nil },
    { in: "12345x", out: 0, err: ErrSyntax },
    { in: "-12345x", out: 0, err: ErrSyntax },
    { in: "987654321", out: 987654321, err: nil },
    { in: "-987654321", out: -987654321, err: nil },
    { in: "2147483647", out: 2147483647, err: nil },
    { in: "-2147483647", out: -2147483647, err: nil },
    { in: "2147483648", out: 0, err: ErrRange },
    { in: "-2147483648", out: -2147483648, err: nil },
    { in: "2147483649", out: 0, err: ErrRange },
    { in: "-2147483649", out: 0, err: ErrRange },
    { in: "-1_2_3_4_5", out: 0, err: ErrSyntax }, // base=10 so no underscores allowed
    { in: "-_12345", out: 0, err: ErrSyntax },
    { in: "_12345", out: 0, err: ErrSyntax },
    { in: "1__2345", out: 0, err: ErrSyntax },
    { in: "12345_", out: 0, err: ErrSyntax },
    { in: "123%45out:", out: 0, err: ErrSyntax },
]

m.test("ParseUint32", (assert) => {
    for (const test of parseUint32Tests) {
        if (test.err) {
            try {
                strconv.parseUint(test.in, 10, 32)
            } catch (e) {
                if (e instanceof strconv.NumError) {
                    assert.equal(test.err.message, e.unwrap().message, test);
                    continue
                }
                continue
            }
            assert.true(false, test, "not throw", test)
        } else {
            assert.equal(`${test.out}`, `${strconv.parseUint(test.in, 10, 32)}`, test)
        }
    }
})

m.test("ParseUint64", (assert) => {
    for (const test of parseUint64Tests) {
        if (test.err) {
            try {
                strconv.parseUint(test.in, 10, 64, true)
            } catch (e) {
                if (e instanceof strconv.NumError) {
                    assert.equal(test.err.message, e.unwrap().message, test);
                    continue
                }
                continue
            }
            assert.true(false, test, "not throw", test)
        } else {
            assert.equal(`${test.out}`, `${strconv.parseUint(test.in, 10, 64, true)}`, test)
        }
    }
})

m.test("ParseUint64Base", (assert) => {
    for (const test of parseUint64BaseTests) {
        if (test.err) {
            try {
                strconv.parseUint(test.in, test.base, 64, true)
            } catch (e) {
                if (e instanceof strconv.NumError) {
                    assert.equal(test.err.message, e.unwrap().message, test);
                    continue
                }
                continue
            }
            assert.true(false, test, "not throw", test)
        } else {
            assert.equal(`${test.out}`, `${strconv.parseUint(test.in, test.base, 64, true)}`, test)
        }
    }
})
m.test("ParseInt32", (assert) => {
    for (const test of parseInt32Tests) {
        if (test.err) {
            try {
                strconv.parseInt(test.in, 10, 32, true)
            } catch (e) {
                if (e instanceof strconv.NumError) {
                    assert.equal(test.err.message, e.unwrap().message, test);
                    continue
                }
                continue
            }
            assert.true(false, test, "not throw", test)
        } else {
            assert.equal(`${test.out}`, `${strconv.parseInt(test.in, 10, 32, true)}`, test)
        }
    }
})
m.test("ParseInt64", (assert) => {
    for (const test of parseInt64Tests) {
        if (test.err) {
            try {
                strconv.parseInt(test.in, 10, 64, true)
            } catch (e) {
                if (e instanceof strconv.NumError) {
                    assert.equal(test.err.message, e.unwrap().message, test);
                    continue
                }
                continue
            }
            assert.true(false, test, "not throw", test)
        } else {
            assert.equal(`${test.out}`, `${strconv.parseInt(test.in, 10, 64, true)}`, test)
        }
    }
})
m.test("ParseInt64Base", (assert) => {
    for (const test of parseInt64BaseTests) {
        if (test.err) {
            try {
                strconv.parseInt(test.in, test.base, 64, true)
            } catch (e) {
                if (e instanceof strconv.NumError) {
                    assert.equal(test.err.message, e.unwrap().message, test);
                    continue
                }
                continue
            }
            assert.true(false, test, "not throw", test)
        } else {
            assert.equal(`${test.out}`, `${strconv.parseInt(test.in, test.base, 64, true)}`, test)
        }
    }
})
m.test("Atoi", (assert) => {
    for (const test of parseInt64Tests) {
        if (test.err) {
            try {
                strconv.atoi(test.in, true)
            } catch (e) {
                if (e instanceof strconv.NumError) {
                    assert.equal(test.err.message, e.unwrap().message, test);
                    continue
                }
                continue
            }
            assert.true(false, test, "not throw", test)
        } else {
            assert.equal(`${test.out}`, `${strconv.atoi(test.in, true)}`, test)
        }
    }
})
