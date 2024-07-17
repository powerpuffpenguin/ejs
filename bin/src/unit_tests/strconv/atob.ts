import { test } from "../../unit/unit";
import * as strconv from "ejs/strconv";
const m = test.module("ejs/strconv")
const nil = undefined
interface atobTest {
    in: string
    out: boolean
    err?: Error
}
const ErrSyntax = strconv.ErrSyntax
const atobtests: Array<atobTest> = [
    { in: "", out: false, err: ErrSyntax },
    { in: "asdf", out: false, err: ErrSyntax },
    { in: "0", out: false, err: nil },
    { in: "f", out: false, err: nil },
    { in: "F", out: false, err: nil },
    { in: "FALSE", out: false, err: nil },
    { in: "false", out: false, err: nil },
    { in: "False", out: false, err: nil },
    { in: "1", out: true, err: nil },
    { in: "t", out: true, err: nil },
    { in: "T", out: true, err: nil },
    { in: "TRUE", out: true, err: nil },
    { in: "true", out: true, err: nil },
    { in: "True", out: true, err: nil },
]
m.test('ParseBool', (assert) => {
    for (const test of atobtests) {
        if (test.err) {
            try {
                strconv.parseBool(test.in)
            } catch (e) {
                if (e instanceof strconv.NumError) {
                    assert.equal(test.err.message, e.unwrap().message, test);
                    continue
                }
                assert.true(false, test, "throw", e)
                continue
            }
            assert.true(false, test, "not throw")
        } else {
            assert.equal(test.out, strconv.parseBool(test.in), test)
        }
    }
})
const boolString: Array<[boolean, string]> = [
    [true, "true"],
    [false, "false"],
]
m.test('FormatBool', (assert) => {
    for (const [b, s] of boolString) {
        assert.equal(s, strconv.formatBool(b), b, s)
    }
})
interface appendBoolTest {
    b: boolean
    in: string
    out: string
}
const appendBoolTests: Array<appendBoolTest> = [
    { b: true, in: "foo ", out: "foo true" },
    { b: false, in: "foo ", out: "foo false" },
]
m.test('AppendBool', (assert) => {
    for (const test of appendBoolTests) {
        const buf = new TextEncoder().encode(test.in)
        const bulder = new strconv.StringBuilder(buf, buf.length)
        const s = bulder.appendBool(test.b).toString()
        assert.equal(test.out, s, test)
    }
})