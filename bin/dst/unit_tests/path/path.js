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
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
var unit_1 = require("../../unit/unit");
var path = __importStar(require("ejs/path"));
var m = unit_1.test.module("ejs/path");
var cleantests = [
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
];
m.test("Clean", function (assert) {
    var e_1, _a;
    try {
        for (var cleantests_1 = __values(cleantests), cleantests_1_1 = cleantests_1.next(); !cleantests_1_1.done; cleantests_1_1 = cleantests_1.next()) {
            var test_1 = cleantests_1_1.value;
            assert.equal(test_1.result, path.clean(test_1.path), test_1);
            assert.equal(test_1.result, path.clean(test_1.result), test_1);
            var result = new TextEncoder().encode(test_1.result);
            var s = new TextEncoder().encode(test_1.path);
            assert.equal(result, path.clean(s), test_1);
            assert.equal(result, path.clean(result), test_1);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (cleantests_1_1 && !cleantests_1_1.done && (_a = cleantests_1.return)) _a.call(cleantests_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
var splittests = [
    { path: "a/b", dir: "a/", file: "b" },
    { path: "a/b/", dir: "a/b/", file: "" },
    { path: "a/", dir: "a/", file: "" },
    { path: "a", dir: "", file: "a" },
    { path: "/", dir: "/", file: "" },
];
m.test("Split", function (assert) {
    var e_2, _a;
    try {
        for (var splittests_1 = __values(splittests), splittests_1_1 = splittests_1.next(); !splittests_1_1.done; splittests_1_1 = splittests_1.next()) {
            var test_2 = splittests_1_1.value;
            var vals = path.split(test_2.path);
            assert.equal(test_2.dir, vals[0], 'dir', test_2);
            assert.equal(test_2.file, vals[1], 'file', test_2);
            var _b = __read(path.split(new TextEncoder().encode(test_2.path)), 2), dir = _b[0], file = _b[1];
            assert.equal(new TextEncoder().encode(test_2.dir), dir, 'dir', test_2);
            assert.equal(new TextEncoder().encode(test_2.file), file, 'file', test_2);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (splittests_1_1 && !splittests_1_1.done && (_a = splittests_1.return)) _a.call(splittests_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
});
var jointests = [
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
];
m.test("Join", function (assert) {
    var e_3, _a;
    try {
        for (var jointests_1 = __values(jointests), jointests_1_1 = jointests_1.next(); !jointests_1_1.done; jointests_1_1 = jointests_1.next()) {
            var test_3 = jointests_1_1.value;
            assert.equal(test_3.path, path.join.apply(path, __spreadArray([], __read(test_3.elem), false)), test_3);
            assert.equal(new TextEncoder().encode(test_3.path), path.joinBuffer.apply(path, __spreadArray([], __read(test_3.elem), false)), test_3);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (jointests_1_1 && !jointests_1_1.done && (_a = jointests_1.return)) _a.call(jointests_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
var exttests = [
    { path: "path.go", ext: ".go" },
    { path: "path.pb.go", ext: ".go" },
    { path: "a.dir/b", ext: "" },
    { path: "a.dir/b.go", ext: ".go" },
    { path: "a.dir/", ext: "" },
];
m.test('Ext', function (assert) {
    var e_4, _a;
    try {
        for (var exttests_1 = __values(exttests), exttests_1_1 = exttests_1.next(); !exttests_1_1.done; exttests_1_1 = exttests_1.next()) {
            var test_4 = exttests_1_1.value;
            assert.equal(test_4.ext, path.ext(test_4.path), test_4);
            assert.equal(new TextEncoder().encode(test_4.ext), path.ext(new TextEncoder().encode(test_4.path)), test_4);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (exttests_1_1 && !exttests_1_1.done && (_a = exttests_1.return)) _a.call(exttests_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
});
var basetests = [
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
];
m.test('Base', function (assert) {
    var e_5, _a;
    try {
        for (var basetests_1 = __values(basetests), basetests_1_1 = basetests_1.next(); !basetests_1_1.done; basetests_1_1 = basetests_1.next()) {
            var test_5 = basetests_1_1.value;
            assert.equal(test_5.result, path.base(test_5.path), test_5);
            assert.equal(new TextEncoder().encode(test_5.result), path.base(new TextEncoder().encode(test_5.path)), test_5);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (basetests_1_1 && !basetests_1_1.done && (_a = basetests_1.return)) _a.call(basetests_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
});
var dirtests = [
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
];
m.test('Dir', function (assert) {
    var e_6, _a;
    try {
        for (var dirtests_1 = __values(dirtests), dirtests_1_1 = dirtests_1.next(); !dirtests_1_1.done; dirtests_1_1 = dirtests_1.next()) {
            var test_6 = dirtests_1_1.value;
            assert.equal(test_6.result, path.dir(test_6.path), test_6);
            assert.equal(new TextEncoder().encode(test_6.result), path.dir(new TextEncoder().encode(test_6.path)), test_6);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (dirtests_1_1 && !dirtests_1_1.done && (_a = dirtests_1.return)) _a.call(dirtests_1);
        }
        finally { if (e_6) throw e_6.error; }
    }
});
var isAbsTests = [
    { path: "", isAbs: false },
    { path: "/", isAbs: true },
    { path: "/usr/bin/gcc", isAbs: true },
    { path: "..", isAbs: false },
    { path: "/a/../bb", isAbs: true },
    { path: ".", isAbs: false },
    { path: "./", isAbs: false },
    { path: "lala", isAbs: false },
];
m.test('IsAbs', function (assert) {
    var e_7, _a;
    try {
        for (var isAbsTests_1 = __values(isAbsTests), isAbsTests_1_1 = isAbsTests_1.next(); !isAbsTests_1_1.done; isAbsTests_1_1 = isAbsTests_1.next()) {
            var test_7 = isAbsTests_1_1.value;
            assert.equal(test_7.isAbs, path.isAbs(test_7.path), test_7);
            assert.equal(test_7.isAbs, path.isAbs(new TextEncoder().encode(test_7.path)), test_7);
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (isAbsTests_1_1 && !isAbsTests_1_1.done && (_a = isAbsTests_1.return)) _a.call(isAbsTests_1);
        }
        finally { if (e_7) throw e_7.error; }
    }
});
