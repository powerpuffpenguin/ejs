import { test } from "../../unit/unit";
import * as path from "ejs/path";
const m = test.module("ejs/path")

interface PathTest {
    path: string
    result: string
}

const cleantests: Array<PathTest> = [
    // Already clean
    { path: "", result: "." },
    { path: "abc", result: "abc" },
    { path: "abc/def", result: "abc/def" },
    { path: "a/b/c", result: "a/b/c" },
    { path: ".", result: "." },
    { path: "..", result: ".." },
    { path: "../..", result: "../.." },
    { path: "../../abc", result: "../../abc" },
    { path: "/abc", result: "/abc" },
    { path: "/", result: "/" },

    // Remove trailing slash
    { path: "abc/", result: "abc" },
    { path: "abc/def/", result: "abc/def" },
    { path: "a/b/c/", result: "a/b/c" },
    { path: "./", result: "." },
    { path: "../", result: ".." },
    { path: "../../", result: "../.." },
    { path: "/abc/", result: "/abc" },

    // Remove doubled slash
    { path: "abc//def//ghi", result: "abc/def/ghi" },
    { path: "//abc", result: "/abc" },
    { path: "///abc", result: "/abc" },
    { path: "//abc//", result: "/abc" },
    { path: "abc//", result: "abc" },

    // Remove . elements
    { path: "abc/./def", result: "abc/def" },
    { path: "/./abc/def", result: "/abc/def" },
    { path: "abc/.", result: "abc" },

    // Remove .. elements
    { path: "abc/def/ghi/../jkl", result: "abc/def/jkl" },
    { path: "abc/def/../ghi/../jkl", result: "abc/jkl" },
    { path: "abc/def/..", result: "abc" },
    { path: "abc/def/../..", result: "." },
    { path: "/abc/def/../..", result: "/" },
    { path: "abc/def/../../..", result: ".." },
    { path: "/abc/def/../../..", result: "/" },
    { path: "abc/def/../../../ghi/jkl/../../../mno", result: "../../mno" },

    // Combinations
    { path: "abc/./../def", result: "def" },
    { path: "abc//./../def", result: "def" },
    { path: "abc/../../././../def", result: "../../def" },
]
m.test("Clean", (assert) => {
    for (const test of cleantests) {
        assert.equal(test.result, path.clean(test.path), test)
        assert.equal(test.result, path.clean(test.result), test)

        const result = new TextEncoder().encode(test.result)
        const s = new TextEncoder().encode(test.path)

        assert.equal(result, path.clean(s), test)
        assert.equal(result, path.clean(result), test)
    }
})

interface SplitTest {
    path: string
    dir: string
    file: string
}

const splittests: Array<SplitTest> = [
    { path: "a/b", dir: "a/", file: "b" },
    { path: "a/b/", dir: "a/b/", file: "" },
    { path: "a/", dir: "a/", file: "" },
    { path: "a", dir: "", file: "a" },
    { path: "/", dir: "/", file: "" },
]
m.test("Split", (assert) => {
    for (const test of splittests) {
        const vals = path.split(test.path)
        assert.equal(test.dir, vals[0], 'dir', test)
        assert.equal(test.file, vals[1], 'file', test)

        const [dir, file] = path.split(new TextEncoder().encode(test.path))
        assert.equal(new TextEncoder().encode(test.dir), dir, 'dir', test)
        assert.equal(new TextEncoder().encode(test.file), file, 'file', test)
    }
})

interface JoinTest {
    elem: Array<string>
    path: string
}
const jointests: Array<JoinTest> = [
    // zero parameters
    { elem: [], path: "" },

    // one parameter
    { elem: [""], path: "" },
    { elem: ["a"], path: "a" },

    // two parameters
    { elem: ["a", "b"], path: "a/b" },
    { elem: ["a", ""], path: "a" },
    { elem: ["", "b"], path: "b" },
    { elem: ["/", "a"], path: "/a" },
    { elem: ["/", ""], path: "/" },
    { elem: ["a/", "b"], path: "a/b" },
    { elem: ["a/", ""], path: "a" },
    { elem: ["", ""], path: "" },
]
m.test("Join", (assert) => {
    for (const test of jointests) {
        assert.equal(test.path, path.join(...test.elem), test)

        assert.equal(new TextEncoder().encode(test.path), path.joinBuffer(...test.elem), test)
    }
})

interface ExtTest {
    path: string
    ext: string
}
const exttests: Array<ExtTest> = [
    { path: "path.go", ext: ".go" },
    { path: "path.pb.go", ext: ".go" },
    { path: "a.dir/b", ext: "" },
    { path: "a.dir/b.go", ext: ".go" },
    { path: "a.dir/", ext: "" },
]
m.test('Ext', (assert) => {
    for (const test of exttests) {
        assert.equal(test.ext, path.ext(test.path), test)

        assert.equal(new TextEncoder().encode(test.ext), path.ext(new TextEncoder().encode(test.path)), test)
    }
})

const basetests: Array<PathTest> = [
    // Already clean
    { path: "", result: "." },
    { path: ".", result: "." },
    { path: "/.", result: "." },
    { path: "/", result: "/" },
    { path: "////", result: "/" },
    { path: "x/", result: "x" },
    { path: "abc", result: "abc" },
    { path: "abc/def", result: "def" },
    { path: "a/b/.x", result: ".x" },
    { path: "a/b/c.", result: "c." },
    { path: "a/b/c.x", result: "c.x" },
]
m.test('Base', (assert) => {
    for (const test of basetests) {
        assert.equal(test.result, path.base(test.path), test)

        assert.equal(new TextEncoder().encode(test.result), path.base(new TextEncoder().encode(test.path)), test)
    }
})

const dirtests: Array<PathTest> = [
    { path: "", result: "." },
    { path: ".", result: "." },
    { path: "/.", result: "/" },
    { path: "/", result: "/" },
    { path: "////", result: "/" },
    { path: "/foo", result: "/" },
    { path: "x/", result: "x" },
    { path: "abc", result: "." },
    { path: "abc/def", result: "abc" },
    { path: "abc////def", result: "abc" },
    { path: "a/b/.x", result: "a/b" },
    { path: "a/b/c.", result: "a/b" },
    { path: "a/b/c.x", result: "a/b" },
]
m.test('Dir', (assert) => {
    for (const test of dirtests) {
        assert.equal(test.result, path.dir(test.path), test)

        assert.equal(new TextEncoder().encode(test.result), path.dir(new TextEncoder().encode(test.path)), test)
    }
})

interface IsAbsTest {
    path: string
    isAbs: boolean
}
const isAbsTests: Array<IsAbsTest> = [
    { path: "", isAbs: false },
    { path: "/", isAbs: true },
    { path: "/usr/bin/gcc", isAbs: true },
    { path: "..", isAbs: false },
    { path: "/a/../bb", isAbs: true },
    { path: ".", isAbs: false },
    { path: "./", isAbs: false },
    { path: "lala", isAbs: false },
]
m.test('IsAbs', (assert) => {
    for (const test of isAbsTests) {
        assert.equal(test.isAbs, path.isAbs(test.path), test)

        assert.equal(test.isAbs, path.isAbs(new TextEncoder().encode(test.path)), test)
    }
})