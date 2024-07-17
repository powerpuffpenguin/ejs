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
Object.defineProperty(exports, "__esModule", { value: true });
var unit_1 = require("../../unit/unit");
var strconv = __importStar(require("ejs/strconv"));
var m = unit_1.test.module("ejs/strconv");
var nil = undefined;
var ErrSyntax = strconv.ErrSyntax;
var atobtests = [
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
];
m.test('ParseBool', function (assert) {
    var e_1, _a;
    try {
        for (var atobtests_1 = __values(atobtests), atobtests_1_1 = atobtests_1.next(); !atobtests_1_1.done; atobtests_1_1 = atobtests_1.next()) {
            var test_1 = atobtests_1_1.value;
            if (test_1.err) {
                try {
                    strconv.parseBool(test_1.in);
                    assert.true(false, test_1, "not throw");
                }
                catch (e) {
                    if (e instanceof strconv.NumError) {
                        assert.equal(test_1.err.message, e.unwrap().message, test_1);
                        continue;
                    }
                    assert.true(false, test_1, "throw", e);
                    continue;
                }
            }
            else {
                assert.equal(test_1.out, strconv.parseBool(test_1.in), test_1);
            }
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (atobtests_1_1 && !atobtests_1_1.done && (_a = atobtests_1.return)) _a.call(atobtests_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
var boolString = [
    [true, "true"],
    [false, "false"],
];
m.test('FormatBool', function (assert) {
    var e_2, _a;
    try {
        for (var boolString_1 = __values(boolString), boolString_1_1 = boolString_1.next(); !boolString_1_1.done; boolString_1_1 = boolString_1.next()) {
            var _b = __read(boolString_1_1.value, 2), b = _b[0], s = _b[1];
            assert.equal(s, strconv.formatBool(b), b, s);
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (boolString_1_1 && !boolString_1_1.done && (_a = boolString_1.return)) _a.call(boolString_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
});
var appendBoolTests = [
    { b: true, in: "foo ", out: "foo true" },
    { b: false, in: "foo ", out: "foo false" },
];
m.test('AppendBool', function (assert) {
    var e_3, _a;
    try {
        for (var appendBoolTests_1 = __values(appendBoolTests), appendBoolTests_1_1 = appendBoolTests_1.next(); !appendBoolTests_1_1.done; appendBoolTests_1_1 = appendBoolTests_1.next()) {
            var test_2 = appendBoolTests_1_1.value;
            var buf = new TextEncoder().encode(test_2.in);
            var bulder = new strconv.StringBuilder(buf, buf.length);
            var s = bulder.appendBool(test_2.b).toString();
            assert.equal(test_2.out, s, test_2);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (appendBoolTests_1_1 && !appendBoolTests_1_1.done && (_a = appendBoolTests_1.return)) _a.call(appendBoolTests_1);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
