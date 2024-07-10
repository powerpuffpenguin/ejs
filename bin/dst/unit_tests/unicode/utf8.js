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
var utf8 = __importStar(require("ejs/unicode/utf8"));
var strconv = __importStar(require("ejs/strconv"));
var m = unit_1.test.module("ejs/unicode/utf8");
m.test('Constants', function (assert) {
    assert.equal(utf8.MaxRune, 1114111);
    assert.equal(utf8.RuneError, 65533);
});
function bytes(str) {
    var count = str.length / 4;
    var strs = new Array(count);
    var offset = 0;
    for (var i = 0; i < count; i++) {
        strs[i] = str.substring(offset + 2, offset + 4);
        offset += 4;
    }
    return new Uint8Array(strs.map(function (p) { return parseInt(p, 16); }));
}
function make(r, str) {
    return {
        r: r,
        str: str,
        buf: bytes(str),
    };
}
var utf8map = [
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
    make(0xd7ff, "0xed0x9f0xbf"),
    make(0xe000, "0xee0x800x80"),
    make(0xfffe, "0xef0xbf0xbe"),
    make(0xffff, "0xef0xbf0xbf"),
    make(0x10000, "0xf00x900x800x80"),
    make(0x10001, "0xf00x900x800x81"),
    make(0x40000, "0xf10x800x800x80"),
    make(0x10fffe, "0xf40x8f0xbf0xbe"),
    make(0x10ffff, "0xf40x8f0xbf0xbf"),
    make(0xFFFD, "0xef0xbf0xbd"),
];
var surrogateMap = [
    make(0xd800, "0xed0xa00x80"),
    make(0xdfff, "0xed0xbf0xbf"), // surrogate max decodes to (RuneError, 1)
];
var testStrings = [
    strconv.toBuffer(""),
    strconv.toBuffer("abcd"),
    strconv.toBuffer("☺☻☹"),
    strconv.toBuffer("日a本b語ç日ð本Ê語þ日¥本¼語i日©"),
    strconv.toBuffer("日a本b語ç日ð本Ê語þ日¥本¼語i日©日a本b語ç日ð本Ê語þ日¥本¼語i日©日a本b語ç日ð本Ê語þ日¥本¼語i日©"),
    new Uint8Array([0x80, 0x80, 0x80, 0x80]),
];
m.test('Full', function (assert) {
    var e_1, _a, e_2, _b;
    try {
        for (var utf8map_1 = __values(utf8map), utf8map_1_1 = utf8map_1.next(); !utf8map_1_1.done; utf8map_1_1 = utf8map_1.next()) {
            var m_1 = utf8map_1_1.value;
            assert.true(utf8.isFull(m_1.buf), m_1);
            var b1 = m_1.buf.subarray(0, m_1.buf.length - 1);
            assert.false(utf8.isFull(b1), m_1, m_1.str, b1);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (utf8map_1_1 && !utf8map_1_1.done && (_a = utf8map_1.return)) _a.call(utf8map_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
    try {
        for (var _c = __values([new Uint8Array([0xc0]), new Uint8Array([0xc1])]), _d = _c.next(); !_d.done; _d = _c.next()) {
            var s = _d.value;
            assert.true(utf8.isFull(s));
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (_d && !_d.done && (_b = _c.return)) _b.call(_c);
        }
        finally { if (e_2) throw e_2.error; }
    }
});
m.test('Encode', function (assert) {
    var e_3, _a;
    try {
        for (var utf8map_2 = __values(utf8map), utf8map_2_1 = utf8map_2.next(); !utf8map_2_1.done; utf8map_2_1 = utf8map_2.next()) {
            var m_2 = utf8map_2_1.value;
            var buf = new Uint8Array(10);
            var n = utf8.encode(buf, m_2.r);
            var b1 = buf.subarray(0, n);
            assert.equal(m_2.buf, b1, m_2);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (utf8map_2_1 && !utf8map_2_1.done && (_a = utf8map_2.return)) _a.call(utf8map_2);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
m.test('Append', function (assert) {
    var e_4, _a;
    var builder;
    try {
        for (var utf8map_3 = __values(utf8map), utf8map_3_1 = utf8map_3.next(); !utf8map_3_1.done; utf8map_3_1 = utf8map_3.next()) {
            var m_3 = utf8map_3_1.value;
            builder = new utf8.UTF8Builder();
            builder.append(m_3.r);
            assert.equal(m_3.buf, builder.toBuffer());
            var init = new TextEncoder().encode("init");
            builder = new utf8.UTF8Builder(init, init.length);
            builder.append(m_3.r);
            var want = new Uint8Array(init.length + m_3.buf.length);
            ejs.copy(want, init);
            ejs.copy(want.subarray(init.length), m_3.buf);
            assert.equal(want, builder.toBuffer(), m_3);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (utf8map_3_1 && !utf8map_3_1.done && (_a = utf8map_3.return)) _a.call(utf8map_3);
        }
        finally { if (e_4) throw e_4.error; }
    }
});
m.test('Decode', function (assert) {
    var e_5, _a;
    try {
        for (var utf8map_4 = __values(utf8map), utf8map_4_1 = utf8map_4.next(); !utf8map_4_1.done; utf8map_4_1 = utf8map_4.next()) {
            var m_4 = utf8map_4_1.value;
            {
                var _b = __read(utf8.decode(m_4.buf), 2), r = _b[0], size = _b[1];
                assert.equal(m_4.r, r, "rune", m_4);
                assert.equal(m_4.buf.length, size, "length", m_4);
            }
            {
                var s = new Uint8Array(__spreadArray(__spreadArray([], __read(m_4.buf), false), [0], false));
                var _c = __read(utf8.decode(s), 2), r = _c[0], size = _c[1];
                assert.equal(m_4.r, r, "0 rune", m_4);
                assert.equal(m_4.buf.length, size, "0 length", m_4);
            }
            {
                // make sure missing bytes fail
                var wantsize = 1;
                if (wantsize >= m_4.buf.length) {
                    wantsize = 0;
                }
                var _d = __read(utf8.decode(m_4.buf.subarray(0, m_4.buf.length - 1)), 2), r = _d[0], size = _d[1];
                assert.equal(utf8.RuneError, r, "wantsize rune", m_4);
                assert.equal(wantsize, size, "wantsize length", m_4);
            }
            {
                // make sure bad sequences fail
                var b = new Uint8Array(__spreadArray([], __read(m_4.buf), false));
                if (b.length == 1) {
                    b[0] = 0x80;
                }
                else {
                    b[b.length - 1] = 0x7F;
                }
                var _e = __read(utf8.decode(b), 2), r = _e[0], size = _e[1];
                assert.equal(r, utf8.RuneError, "wantsize rune", m_4);
                assert.equal(1, size, "wantsize length", m_4);
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (utf8map_4_1 && !utf8map_4_1.done && (_a = utf8map_4.return)) _a.call(utf8map_4);
        }
        finally { if (e_5) throw e_5.error; }
    }
});
m.test('DecodeSurrogate', function (assert) {
    var e_6, _a;
    try {
        for (var surrogateMap_1 = __values(surrogateMap), surrogateMap_1_1 = surrogateMap_1.next(); !surrogateMap_1_1.done; surrogateMap_1_1 = surrogateMap_1.next()) {
            var m_5 = surrogateMap_1_1.value;
            var _b = __read(utf8.decode(m_5.buf), 2), r = _b[0], size = _b[1];
            assert.equal(r, utf8.RuneError, "wantsize rune", m_5);
            assert.equal(1, size, "wantsize length", m_5);
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (surrogateMap_1_1 && !surrogateMap_1_1.done && (_a = surrogateMap_1.return)) _a.call(surrogateMap_1);
        }
        finally { if (e_6) throw e_6.error; }
    }
});
function testSequence(assert, s, m) {
    var index = new Array(s.length);
    var b = s;
    var si = 0;
    var j = 0;
    var i = -1;
    utf8.forEach(s, function (r, i) {
        assert.equal(i, si, 'mismatched', m, b, i);
        index[j] = { index: i, r: r };
        j++;
        var _a = __read(utf8.decode(b.subarray(i)), 2), r1 = _a[0], size1 = _a[1];
        assert.equal(r, r1, 'decode 1', m, b, i);
        si += size1;
    });
    j--;
    for (si = s.length; si > 0;) {
        var _a = __read(utf8.decodeLast(b.subarray(0, si)), 2), r1 = _a[0], size1 = _a[1];
        assert.equal(index[j].r, r1, 'DecodeLastRune', m, s, si, r1, index[j].r);
        si -= size1;
        assert.equal(index[j].index, si, 'DecodeLastRune index mismatch', m, s, si, index[j].index);
        j--;
    }
    assert.equal(0, si, "DecodeLastRune finished at ".concat(si, ", not 0"), m, s);
}
m.test('Sequencing', function (assert) {
    var e_7, _a, e_8, _b, e_9, _c, e_10, _d, e_11, _e;
    try {
        for (var testStrings_1 = __values(testStrings), testStrings_1_1 = testStrings_1.next(); !testStrings_1_1.done; testStrings_1_1 = testStrings_1.next()) {
            var ts = testStrings_1_1.value;
            try {
                for (var utf8map_5 = (e_8 = void 0, __values(utf8map)), utf8map_5_1 = utf8map_5.next(); !utf8map_5_1.done; utf8map_5_1 = utf8map_5.next()) {
                    var m_6 = utf8map_5_1.value;
                    try {
                        for (var _f = (e_9 = void 0, __values([
                            [ts, m_6.buf],
                            [m_6.buf, ts],
                            [ts, m_6.buf, ts],
                        ])), _g = _f.next(); !_g.done; _g = _f.next()) {
                            var items = _g.value;
                            var len = 0;
                            try {
                                for (var items_1 = (e_10 = void 0, __values(items)), items_1_1 = items_1.next(); !items_1_1.done; items_1_1 = items_1.next()) {
                                    var item = items_1_1.value;
                                    len += item.length;
                                }
                            }
                            catch (e_10_1) { e_10 = { error: e_10_1 }; }
                            finally {
                                try {
                                    if (items_1_1 && !items_1_1.done && (_d = items_1.return)) _d.call(items_1);
                                }
                                finally { if (e_10) throw e_10.error; }
                            }
                            var s = new Uint8Array(len);
                            len = 0;
                            try {
                                for (var items_2 = (e_11 = void 0, __values(items)), items_2_1 = items_2.next(); !items_2_1.done; items_2_1 = items_2.next()) {
                                    var item = items_2_1.value;
                                    len += ejs.copy(s.subarray(len), item);
                                }
                            }
                            catch (e_11_1) { e_11 = { error: e_11_1 }; }
                            finally {
                                try {
                                    if (items_2_1 && !items_2_1.done && (_e = items_2.return)) _e.call(items_2);
                                }
                                finally { if (e_11) throw e_11.error; }
                            }
                            testSequence(assert, s, m_6);
                        }
                    }
                    catch (e_9_1) { e_9 = { error: e_9_1 }; }
                    finally {
                        try {
                            if (_g && !_g.done && (_c = _f.return)) _c.call(_f);
                        }
                        finally { if (e_9) throw e_9.error; }
                    }
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (utf8map_5_1 && !utf8map_5_1.done && (_b = utf8map_5.return)) _b.call(utf8map_5);
                }
                finally { if (e_8) throw e_8.error; }
            }
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (testStrings_1_1 && !testStrings_1_1.done && (_a = testStrings_1.return)) _a.call(testStrings_1);
        }
        finally { if (e_7) throw e_7.error; }
    }
});
m.test('RuntimeConversion', function (assert) {
    var e_12, _a;
    var _loop_1 = function (ts) {
        var count = utf8.count(ts);
        var s = new TextDecoder().decode(ts);
        assert.equal(s.length, count, ts, "'".concat(s, "'"));
        var i = 0;
        utf8.forEach(ts, function (r) {
            assert.equal(r, s.codePointAt(i));
            i++;
        });
    };
    try {
        for (var testStrings_2 = __values(testStrings), testStrings_2_1 = testStrings_2.next(); !testStrings_2_1.done; testStrings_2_1 = testStrings_2.next()) {
            var ts = testStrings_2_1.value;
            _loop_1(ts);
        }
    }
    catch (e_12_1) { e_12 = { error: e_12_1 }; }
    finally {
        try {
            if (testStrings_2_1 && !testStrings_2_1.done && (_a = testStrings_2.return)) _a.call(testStrings_2);
        }
        finally { if (e_12) throw e_12.error; }
    }
});
var invalidSequenceTests = [
    bytes("0xed0xa00x800x80"),
    bytes("0xed0xbf0xbf0x80"),
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
];
function runtimeDecodeRune(p) {
    var ret = -1;
    utf8.forEach(p, function (r) {
        ret = r;
        return true;
    });
    return ret;
}
m.test('DecodeInvalidSequence', function (assert) {
    var e_13, _a;
    try {
        for (var invalidSequenceTests_1 = __values(invalidSequenceTests), invalidSequenceTests_1_1 = invalidSequenceTests_1.next(); !invalidSequenceTests_1_1.done; invalidSequenceTests_1_1 = invalidSequenceTests_1.next()) {
            var s = invalidSequenceTests_1_1.value;
            var _b = __read(utf8.decode(s), 2), r1 = _b[0], s1 = _b[1];
            assert.equal(utf8.RuneError, r1, s);
            assert.equal(1, s1, s);
            var r3 = runtimeDecodeRune(s);
            assert.equal(r1, r3, s);
        }
    }
    catch (e_13_1) { e_13 = { error: e_13_1 }; }
    finally {
        try {
            if (invalidSequenceTests_1_1 && !invalidSequenceTests_1_1.done && (_a = invalidSequenceTests_1.return)) _a.call(invalidSequenceTests_1);
        }
        finally { if (e_13) throw e_13.error; }
    }
});
m.test('Negative', function (assert) {
    var errorbuf = new Uint8Array(utf8.UTFMax);
    errorbuf = errorbuf.subarray(0, utf8.encode(errorbuf, utf8.RuneError));
    var buf = new Uint8Array(utf8.UTFMax);
    buf = buf.subarray(0, utf8.encode(buf, -1));
    assert.equal(buf, errorbuf);
});
var runecounttests = [
    { in: strconv.toBuffer("abcd"), out: 4 },
    { in: strconv.toBuffer("☺☻☹"), out: 3 },
    { in: strconv.toBuffer("1,2,3,4"), out: 7 },
    { in: bytes("0xe20x00"), out: 2 },
    { in: bytes("0xe20x80"), out: 2 },
    { in: bytes("0x610xe20x80"), out: 3 },
];
m.test('Count', function (assert) {
    var e_14, _a;
    try {
        for (var runecounttests_1 = __values(runecounttests), runecounttests_1_1 = runecounttests_1.next(); !runecounttests_1_1.done; runecounttests_1_1 = runecounttests_1.next()) {
            var tt = runecounttests_1_1.value;
            var out = utf8.count(tt.in);
            assert.equal(tt.out, out, tt);
        }
    }
    catch (e_14_1) { e_14 = { error: e_14_1 }; }
    finally {
        try {
            if (runecounttests_1_1 && !runecounttests_1_1.done && (_a = runecounttests_1.return)) _a.call(runecounttests_1);
        }
        finally { if (e_14) throw e_14.error; }
    }
});
var runelentests = [
    { r: 0, size: 1 },
    { r: 'e'.codePointAt(0), size: 1 },
    { r: 'é'.codePointAt(0), size: 2 },
    { r: '☺'.codePointAt(0), size: 3 },
    { r: utf8.RuneError, size: 3 },
    { r: utf8.MaxRune, size: 4 },
    { r: 0xD800, size: -1 },
    { r: 0xDFFF, size: -1 },
    { r: utf8.MaxRune + 1, size: -1 },
    { r: -1, size: -1 },
];
m.test('Len', function (assert) {
    var e_15, _a;
    try {
        for (var runelentests_1 = __values(runelentests), runelentests_1_1 = runelentests_1.next(); !runelentests_1_1.done; runelentests_1_1 = runelentests_1.next()) {
            var tt = runelentests_1_1.value;
            var out = utf8.len(tt.r);
            assert.equal(tt.size, out, tt);
        }
    }
    catch (e_15_1) { e_15 = { error: e_15_1 }; }
    finally {
        try {
            if (runelentests_1_1 && !runelentests_1_1.done && (_a = runelentests_1.return)) _a.call(runelentests_1);
        }
        finally { if (e_15) throw e_15.error; }
    }
});
var validTests = [
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
    { in: bytes("0xF40x8F0xBF0xBF"), out: true },
    { in: bytes("0xF40x900x800x80"), out: false },
    { in: bytes("0xF70xBF0xBF0xBF"), out: false },
    { in: bytes("0xFB0xBF0xBF0xBF0xBF"), out: false },
    { in: bytes("0xc00x80"), out: false },
    { in: bytes("0xed0xa00x80"), out: false },
    { in: bytes("0xed0xbf0xbf"), out: false }, // U+DFFF low surrogate (sic)
];
m.test('Valid', function (assert) {
    var e_16, _a;
    try {
        for (var validTests_1 = __values(validTests), validTests_1_1 = validTests_1.next(); !validTests_1_1.done; validTests_1_1 = validTests_1.next()) {
            var tt = validTests_1_1.value;
            assert.equal(tt.out, utf8.isValid(tt.in), tt);
        }
    }
    catch (e_16_1) { e_16 = { error: e_16_1 }; }
    finally {
        try {
            if (validTests_1_1 && !validTests_1_1.done && (_a = validTests_1.return)) _a.call(validTests_1);
        }
        finally { if (e_16) throw e_16.error; }
    }
});
var validrunetests = [
    { r: 0, ok: true },
    { r: 'e'.codePointAt(0), ok: true },
    { r: 'é'.codePointAt(0), ok: true },
    { r: '☺'.codePointAt(0), ok: true },
    { r: utf8.RuneError, ok: true },
    { r: utf8.MaxRune, ok: true },
    { r: 0xD7FF, ok: true },
    { r: 0xD800, ok: false },
    { r: 0xDFFF, ok: false },
    { r: 0xE000, ok: true },
    { r: utf8.MaxRune + 1, ok: false },
    { r: -1, ok: false },
];
m.test('ValidRune', function (assert) {
    var e_17, _a;
    try {
        for (var validrunetests_1 = __values(validrunetests), validrunetests_1_1 = validrunetests_1.next(); !validrunetests_1_1.done; validrunetests_1_1 = validrunetests_1.next()) {
            var tt = validrunetests_1_1.value;
            assert.equal(tt.ok, utf8.isRune(tt.r), tt);
        }
    }
    catch (e_17_1) { e_17 = { error: e_17_1 }; }
    finally {
        try {
            if (validrunetests_1_1 && !validrunetests_1_1.done && (_a = validrunetests_1.return)) _a.call(validrunetests_1);
        }
        finally { if (e_17) throw e_17.error; }
    }
});
