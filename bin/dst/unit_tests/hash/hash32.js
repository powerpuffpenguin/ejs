"use strict";
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
var hash_1 = require("ejs/hash");
var hex_1 = require("ejs/encoding/hex");
var m = unit_1.test.module("ejs/hash");
function makeAdler32(out, val, repeat, str) {
    if (typeof val === "number") {
        var s = new TextEncoder().encode(str);
        var dst = new Uint8Array(repeat + s.length);
        var i = 0;
        for (; i < repeat; i++) {
            dst[i] = val;
        }
        for (var j = 0; j < s.length; j++) {
            dst[i++] = s[j];
        }
        return {
            out: out,
            in: dst,
        };
    }
    else {
        return {
            out: out,
            in: val.repeat(repeat),
        };
    }
}
m.test("Adler32", function (assert) {
    var e_1, _a;
    var tests = [
        { out: 1, in: "" },
        { out: 6422626, in: "a" },
        { out: 19267780, in: "ab" },
        { out: 38600999, in: "abc" },
        { out: 64487819, in: "abcd" },
        { out: 96993776, in: "abcde" },
        { out: 136184406, in: "abcdef" },
        { out: 182125245, in: "abcdefg" },
        { out: 234881829, in: "abcdefgh" },
        { out: 294519694, in: "abcdefghi" },
        { out: 361104376, in: "abcdefghij" },
        { out: 1057558274, in: "Discard medicine more than two years old." },
        { out: 1188566135, in: "He who has a shady past knows that nice guys finish last." },
        { out: 1089343201, in: "I wouldn't marry him with a ten foot pole." },
        { out: 375788309, in: "Free! Free!/A trip/to Mars/for 900/empty jars/Burma Shave" },
        { out: 1529746560, in: "The days of the digital watch are numbered.  -Tom Stoppard" },
        { out: 2352744938, in: "Nepal premier won't resign." },
        { out: 1168906493, in: "For every action there is an equal and opposite government program." },
        { out: 1405490274, in: "His money is twice tainted: 'taint yours and 'taint mine." },
        { out: 2119245411, in: "There is no reason for any individual to have a computer in their home. -Ken Olsen, 1977" },
        { out: 3833600618, in: "It's a tiny change to the code and not completely disgusting. - Bob Manchek" },
        { out: 1639253983, in: "size:  a.out:  bad magic" },
        { out: 3093500273, in: "The major problem is with sendmail.  -Mark Horton" },
        { out: 2338199812, in: "Give me a rock, paper and scissors and I will move the world.  CCFestoon" },
        { out: 2093355051, in: "If the enemy is within range, then so are you." },
        { out: 1879251175, in: "It's well we cannot hear the screams/That we create in others' dreams." },
        { out: 509613895, in: "You remind me of a TV show, but that's all right: I watch it anyway." },
        { out: 3042642697, in: "C is as portable as Stonehedge!!" },
        { out: 957423056, in: "Even if I could be Shakespeare, I think I should still choose to be Faraday. - A. Huxley" },
        { out: 2447192143, in: "The fugacity of a constituent in a mixture of gases at a given temperature is proportional to its mole fraction.  Lewis-Randall Rule" },
        { out: 777851670, in: "How can you write a big system without C++?  -Paul Glick" },
        { out: 3491765750, in: "'Invariant assertions' is the most elegant programming technique!  -Tom Szymanski" },
        makeAdler32(0x211297c8, 0xff, 5548, "8"),
        makeAdler32(0xbaa198c8, 0xff, 5549, "9"),
        makeAdler32(0x553499be, 0xff, 5550, "0"),
        makeAdler32(0xf0c19abe, 0xff, 5551, "1"),
        makeAdler32(0x8d5c9bbe, 0xff, 5552, "2"),
        makeAdler32(0x2af69cbe, 0xff, 5553, "3"),
        makeAdler32(0xc9809dbe, 0xff, 5554, "4"),
        makeAdler32(0x69189ebe, 0xff, 5555, "5"),
        makeAdler32(0x86af0001, 0x00, 1e5, ""),
        makeAdler32(0x79660b4d, "a", 1e5, ""),
        makeAdler32(0x110588ee, "ABCDEFGHIJKLMNOPQRSTUVWXYZ", 1e4, ""),
    ];
    var H = hash_1.Adler32;
    assert.equal(4, H.blocksize, 'blocksize');
    assert.equal(4, H.hashsize, 'hashsize');
    var dst = new Uint8Array(H.hashsize);
    var hash = new hash_1.Adler32();
    var name = "Adler32";
    try {
        for (var tests_1 = __values(tests), tests_1_1 = tests_1.next(); !tests_1_1.done; tests_1_1 = tests_1.next()) {
            var t = tests_1_1.value;
            assert.equal(t.out, H.sum32(t.in), "sum32 ".concat(t.in));
            var out = (0, hex_1.encodeToString)(H.sum(t.in));
            assert.equal(dst.length, H.sumTo(dst, t.in), "sumTo ".concat(t.in));
            assert.equal(out, (0, hex_1.encodeToString)(dst), "sumTo ".concat(t.in));
            assert.equal(t.out, hash.sum32(t.in), "$".concat(name, " sum32 ").concat(t.in));
            out = (0, hex_1.encodeToString)(hash.sum(t.in));
            assert.equal(dst.length, hash.sumTo(dst, t.in), "".concat(name, " sumTo ").concat(t.in));
            assert.equal(out, (0, hex_1.encodeToString)(dst), "".concat(name, " sumTo ").concat(t.in));
            assert.equal(out, (0, hex_1.encodeToString)(hash.done(t.in)), "".concat(name, " done ").concat(t.in));
            hash.reset();
            assert.equal(dst.length, hash.doneTo(dst, t.in), "".concat(name, " doneTo ").concat(t.in));
            assert.equal(out, (0, hex_1.encodeToString)(dst), "".concat(name, " doneTo ").concat(t.in));
            hash.reset();
            var b = typeof t.in === "string" ? new TextEncoder().encode(t.in) : t.in;
            if (b.length > 0) {
                hash.write(b.subarray(0, 1));
                var data = b.subarray(1);
                assert.equal(out, (0, hex_1.encodeToString)(hash.sum(data)), "".concat(name, " write.sum ").concat(t.in));
                assert.equal(dst.length, hash.sumTo(dst, data), "".concat(name, " write.sumTo ").concat(t.in));
                assert.equal(out, (0, hex_1.encodeToString)(dst), "".concat(name, " write.sumTo ").concat(t.in));
                var h = hash.clone();
                assert.equal(out, (0, hex_1.encodeToString)(h.done(data)), "".concat(name, " write.done ").concat(t.in));
                assert.equal(dst.length, hash.doneTo(dst, data), "".concat(name, " write.doneTo ").concat(t.in));
                assert.equal(out, (0, hex_1.encodeToString)(dst), "".concat(name, " write.doneTo ").concat(t.in));
                hash.reset();
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (tests_1_1 && !tests_1_1.done && (_a = tests_1.return)) _a.call(tests_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
