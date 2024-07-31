import { test } from "../../unit/unit";
import * as path from "ejs/path";
const m = test.module("ejs/path")

interface MatchTest {
    pattern: string
    s: string
    match: boolean
    err?: path.BadPatternError
}
const nil = undefined
const ErrBadPattern = new path.BadPatternError()
function make(pattern: string,
    s: string,
    match: boolean,
    err?: path.BadPatternError) {
    return {
        pattern: pattern,
        s: s,
        match: match,
        err: err,
    }
}
const matchTests: Array<MatchTest> = [
    make("abc", "abc", true, nil),
    make("*", "abc", true, nil),
    make("*c", "abc", true, nil),
    make("a*", "a", true, nil),
    make("a*", "abc", true, nil),
    make("a*", "ab/c", false, nil),
    make("a*/b", "abc/b", true, nil),
    make("a*/b", "a/c/b", false, nil),
    make("a*b*c*d*e*/f", "axbxcxdxe/f", true, nil),
    make("a*b*c*d*e*/f", "axbxcxdxexxx/f", true, nil),
    make("a*b*c*d*e*/f", "axbxcxdxe/xxx/f", false, nil),
    make("a*b*c*d*e*/f", "axbxcxdxexxx/fff", false, nil),
    make("a*b?c*x", "abxbbxdbxebxczzx", true, nil),
    make("a*b?c*x", "abxbbxdbxebxczzy", false, nil),
    make("ab[c]", "abc", true, nil),
    make("ab[b-d]", "abc", true, nil),
    make("ab[e-g]", "abc", false, nil),
    make("ab[^c]", "abc", false, nil),
    make("ab[^b-d]", "abc", false, nil),
    make("ab[^e-g]", "abc", true, nil),
    make("a\\*b", "a*b", true, nil),
    make("a\\*b", "ab", false, nil),
    make("a?b", "a☺b", true, nil),
    make("a[^a]b", "a☺b", true, nil),
    make("a???b", "a☺b", false, nil),
    make("a[^a][^a][^a]b", "a☺b", false, nil),
    make("[a-ζ]*", "α", true, nil),
    make("*[a-ζ]", "A", false, nil),
    make("a?b", "a/b", false, nil),
    make("a*b", "a/b", false, nil),
    make("[\\]a]", "]", true, nil),
    make("[\\-]", "-", true, nil),
    make("[x\\-]", "x", true, nil),
    make("[x\\-]", "-", true, nil),
    make("[x\\-]", "z", false, nil),
    make("[\\-x]", "x", true, nil),
    make("[\\-x]", "-", true, nil),
    make("[\\-x]", "a", false, nil),
    make("[]a]", "]", false, ErrBadPattern),
    make("[-]", "-", false, ErrBadPattern),
    make("[x-]", "x", false, ErrBadPattern),
    make("[x-]", "-", false, ErrBadPattern),
    make("[x-]", "z", false, ErrBadPattern),
    make("[-x]", "x", false, ErrBadPattern),
    make("[-x]", "-", false, ErrBadPattern),
    make("[-x]", "a", false, ErrBadPattern),
    make("\\", "a", false, ErrBadPattern),
    make("[a-b-c]", "a", false, ErrBadPattern),
    make("[", "a", false, ErrBadPattern),
    make("[^", "a", false, ErrBadPattern),
    make("[^bc", "a", false, ErrBadPattern),
    make("a[", "a", false, ErrBadPattern),
    make("a[", "ab", false, ErrBadPattern),
    make("a[", "x", false, ErrBadPattern),
    make("a/b[", "x", false, ErrBadPattern),
    make("*x", "xxx", true, nil),
]
m.test('Match', (assert) => {
    for (const test of matchTests) {
        if (test.err) {
            try {
                path.match(test.pattern, test.s)
            } catch (e) {
                assert.true(e instanceof path.BadPatternError)
                continue
            }
            assert.true(false, "not throw", test)
        } else {
            assert.equal(test.match, path.match(test.pattern, test.s), test)

            assert.equal(test.match, path.match(new TextEncoder().encode(test.pattern), new TextEncoder().encode(test.s)), test)
        }
    }
})