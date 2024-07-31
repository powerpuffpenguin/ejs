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
var path = __importStar(require("ejs/path"));
var m = unit_1.test.module("ejs/path");
var nil = undefined;
var ErrBadPattern = new path.BadPatternError();
function make(pattern, s, match, err) {
    return {
        pattern: pattern,
        s: s,
        match: match,
        err: err,
    };
}
var matchTests = [
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
];
m.test('Match', function (assert) {
    var e_1, _a;
    try {
        for (var matchTests_1 = __values(matchTests), matchTests_1_1 = matchTests_1.next(); !matchTests_1_1.done; matchTests_1_1 = matchTests_1.next()) {
            var test_1 = matchTests_1_1.value;
            if (test_1.err) {
                try {
                    path.match(test_1.pattern, test_1.s);
                }
                catch (e) {
                    assert.true(e instanceof path.BadPatternError);
                    continue;
                }
                assert.true(false, "not throw", test_1);
            }
            else {
                assert.equal(test_1.match, path.match(test_1.pattern, test_1.s), test_1);
                assert.equal(test_1.match, path.match(new TextEncoder().encode(test_1.pattern), new TextEncoder().encode(test_1.s)), test_1);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (matchTests_1_1 && !matchTests_1_1.done && (_a = matchTests_1.return)) _a.call(matchTests_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
