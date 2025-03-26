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
Object.defineProperty(exports, "__esModule", { value: true });
var binary = __importStar(require("ejs/encoding/binary"));
var hex = __importStar(require("ejs/encoding/hex"));
var unit_1 = require("../../unit/unit");
var m = unit_1.test.module("ejs/encoding/binary");
var Test8 = /** @class */ (function () {
    function Test8(assert) {
        this.assert = assert;
        var b = new ArrayBuffer(5);
        var view = new DataView(b);
        view.setInt8(0, -1);
        view.setInt8(1, -2);
        view.setInt8(2, 127);
        view.setInt8(3, 0);
        var h0 = hex.encodeToString(b);
        view.setUint8(0, 1);
        view.setUint8(1, 128);
        view.setUint8(2, 129);
        view.setUint8(3, 0);
        var h1 = hex.encodeToString(b);
        this.expect = h0 + h1;
        this.expect2 = h1 + h0;
    }
    Test8.prototype.test = function (name, view) {
        var assert = this.assert;
        view.setInt(0, -1);
        view.setInt(1, -2);
        view.setInt(2, 127);
        view.setInt(3, 0);
        view.setUint(5, 1);
        view.setUint(6, 128);
        view.setUint(7, 129);
        view.setUint(8, 0);
        assert.equal(-1, view.getInt(0), name);
        assert.equal(-2, view.getInt(1), name);
        assert.equal(127, view.getInt(2), name);
        assert.equal(0, view.getInt(3), name);
        assert.equal(1, view.getUint(5), name);
        assert.equal(128, view.getUint(6), name);
        assert.equal(129, view.getUint(7), name);
        assert.equal(0, view.getUint(8), name);
        assert.equal(this.expect, hex.encodeToString(view.buffer), name);
        view.setInt(5, '-1');
        view.setInt(6, '-2');
        view.setInt(7, '127');
        view.setInt(8, '0');
        view.setUint(0, '1');
        view.setUint(1, '128');
        view.setUint(2, '129');
        view.setUint(3, '0');
        assert.equal(-1, view.getInt(5), name);
        assert.equal(-2, view.getInt(6), name);
        assert.equal(127, view.getInt(7), name);
        assert.equal(0, view.getInt(8), name);
        assert.equal(1, view.getUint(0), name);
        assert.equal(128, view.getUint(1), name);
        assert.equal(129, view.getUint(2), name);
        assert.equal(0, view.getUint(3), name);
        assert.equal(this.expect2, hex.encodeToString(view.buffer), name);
    };
    return Test8;
}());
var SetView = /** @class */ (function () {
    function SetView(opts) {
        this.opts = opts;
    }
    Object.defineProperty(SetView.prototype, "buffer", {
        get: function () {
            return this.opts.buffer;
        },
        enumerable: false,
        configurable: true
    });
    SetView.prototype.setInt = function (byteOffset, value) {
        this.opts.setInt(byteOffset, value);
    };
    SetView.prototype.setUint = function (byteOffset, value) {
        this.opts.setUint(byteOffset, value);
    };
    SetView.prototype.getInt = function (byteOffset) {
        return this.opts.getInt(byteOffset);
    };
    SetView.prototype.getUint = function (byteOffset) {
        return this.opts.getUint(byteOffset);
    };
    return SetView;
}());
m.test("Test8", function (assert) {
    var t = new Test8(assert);
    t.test('BigEndian', new SetView({
        buffer: new ArrayBuffer(10),
        setInt: function (byteOffset, value) {
            binary.BigEndian.setInt8(this.buffer, byteOffset, value);
        },
        setUint: function (byteOffset, value) {
            binary.BigEndian.setUint8(this.buffer, byteOffset, value);
        },
        getInt: function (byteOffset) {
            return binary.BigEndian.getInt8(this.buffer, byteOffset);
        },
        getUint: function (byteOffset) {
            return binary.BigEndian.getUint8(this.buffer, byteOffset);
        },
    }));
    t.test('LittleEndian', new SetView({
        buffer: new Uint8Array(10),
        setInt: function (byteOffset, value) {
            binary.LittleEndian.setInt8(this.buffer, byteOffset, value);
        },
        setUint: function (byteOffset, value) {
            binary.LittleEndian.setUint8(this.buffer, byteOffset, value);
        },
        getInt: function (byteOffset) {
            return binary.LittleEndian.getInt8(this.buffer, byteOffset);
        },
        getUint: function (byteOffset) {
            return binary.LittleEndian.getUint8(this.buffer, byteOffset);
        },
    }));
    var b = new ArrayBuffer(10);
    var v = new binary.DataView(b);
    t.test('DataView', new SetView({
        buffer: b,
        setInt: function (byteOffset, value) {
            v.setInt8(byteOffset, value);
        },
        setUint: function (byteOffset, value) {
            v.setUint8(byteOffset, value);
        },
        getInt: function (byteOffset) {
            return v.getInt8(byteOffset);
        },
        getUint: function (byteOffset) {
            return v.getUint8(byteOffset);
        },
    }));
});
var SetViewN = /** @class */ (function () {
    function SetViewN(opts) {
        this.opts = opts;
    }
    Object.defineProperty(SetViewN.prototype, "buffer", {
        get: function () {
            return this.opts.buffer;
        },
        enumerable: false,
        configurable: true
    });
    SetViewN.prototype.setInt = function (byteOffset, value, littleEndian) {
        this.opts.setInt(byteOffset, value, littleEndian);
    };
    SetViewN.prototype.setUint = function (byteOffset, value, littleEndian) {
        this.opts.setUint(byteOffset, value, littleEndian);
    };
    SetViewN.prototype.getInt = function (byteOffset, littleEndian) {
        return this.opts.getInt(byteOffset, littleEndian);
    };
    SetViewN.prototype.getUint = function (byteOffset, littleEndian) {
        return this.opts.getUint(byteOffset, littleEndian);
    };
    return SetViewN;
}());
var Test16 = /** @class */ (function () {
    function Test16(assert) {
        this.assert = assert;
        var n = 2;
        var b = new ArrayBuffer(5 * n);
        var view = new DataView(b);
        view.setInt16(0 * n, -1);
        view.setInt16(1 * n, -32768);
        view.setInt16(2 * n, 32767);
        view.setInt16(3 * n, 0);
        var h0 = hex.encodeToString(b);
        view.setUint16(0, 1);
        view.setUint16(1, 65534);
        view.setUint16(2, 65535);
        view.setUint16(3, 0);
        var h1 = hex.encodeToString(b);
        this.big = h0 + h1;
        this.big2 = h1 + h0;
        view.setInt16(0 * n, -1, true);
        view.setInt16(1 * n, -32768, true);
        view.setInt16(2 * n, 32767, true);
        view.setInt16(3 * n, 0, true);
        h0 = hex.encodeToString(b);
        view.setUint16(0, 1, true);
        view.setUint16(1, 65534, true);
        view.setUint16(2, 65535, true);
        view.setUint16(3, 0, true);
        h1 = hex.encodeToString(b);
        this.little = h0 + h1;
        this.little2 = h1 + h0;
    }
    Test16.prototype.test = function (name, view) {
        var n = 2;
        var assert = this.assert;
        view.setInt(0 * n, -1);
        view.setInt(1 * n, -32768);
        view.setInt(2 * n, 32767);
        view.setInt(3 * n, 0);
        view.setUint(5 * n, 1);
        view.setUint(6 * n, 65534);
        view.setUint(7 * n, 65535);
        view.setUint(8 * n, 0);
        assert.equal(-1, view.getInt(0 * n), "".concat(name, " big int"));
        assert.equal(-32768, view.getInt(1 * n), "".concat(name, " big int"));
        assert.equal(32767, view.getInt(2 * n), "".concat(name, " big int"));
        assert.equal(0, view.getInt(3 * n), "".concat(name, " big int"));
        assert.equal(1, view.getUint(5 * n), "".concat(name, " big uint"));
        assert.equal(65534, view.getUint(6 * n), "".concat(name, " big uint"));
        assert.equal(65535, view.getUint(7 * n), "".concat(name, " big uint"));
        assert.equal(0, view.getUint(8 * n), "".concat(name, " big uint"));
        assert.equal(this.big, hex.encodeToString(view.buffer), "".concat(name, " big"));
        // view.setInt(5, '-1')
        // view.setInt(6, '-2')
        // view.setInt(7, '127')
        // view.setInt(8, '0')
        // view.setUint(0, '1')
        // view.setUint(1, '128')
        // view.setUint(2, '129')
        // view.setUint(3, '0')
        // assert.equal(-1, view.getInt(5))
        // assert.equal(-2, view.getInt(6))
        // assert.equal(127, view.getInt(7))
        // assert.equal(0, view.getInt(8))
        // assert.equal(1, view.getUint(0))
        // assert.equal(128, view.getUint(1))
        // assert.equal(129, view.getUint(2))
        // assert.equal(0, view.getUint(3))
        // assert.equal(this.expect2, hex.encodeToString(view.buffer), name)
    };
    return Test16;
}());
m.test("Test16", function (assert) {
    var t = new Test16(assert);
    var n = 2;
    // t.test('BigEndian-LittleEndian', new SetViewN({
    //     buffer: new ArrayBuffer(10 * n),
    //     setInt(byteOffset, value, littleEndian) {
    //         if (littleEndian) {
    //             binary.LittleEndian.setInt16(this.buffer, byteOffset, value)
    //         } else {
    //             binary.BigEndian.setInt16(this.buffer, byteOffset, value)
    //         }
    //     },
    //     setUint(byteOffset, value, littleEndian) {
    //         if (littleEndian) {
    //             binary.LittleEndian.setUint16(this.buffer, byteOffset, value)
    //         } else {
    //             binary.BigEndian.setUint16(this.buffer, byteOffset, value)
    //         }
    //     },
    //     getInt(byteOffset, littleEndian) {
    //         if (littleEndian) {
    //             return binary.LittleEndian.getInt16(this.buffer, byteOffset)
    //         }
    //         return binary.BigEndian.getInt16(this.buffer, byteOffset)
    //     },
    //     getUint(byteOffset, littleEndian) {
    //         if (littleEndian) {
    //             return binary.LittleEndian.getUint16(this.buffer, byteOffset)
    //         }
    //         return binary.BigEndian.getUint16(this.buffer, byteOffset)
    //     },
    // }))
    // t.test('LittleEndian', new SetView({
    //     buffer: new Uint8Array(10),
    //     setInt(byteOffset, value) {
    //         binary.LittleEndian.setInt8(this.buffer, byteOffset, value)
    //     },
    //     setUint(byteOffset, value) {
    //         binary.LittleEndian.setUint8(this.buffer, byteOffset, value)
    //     },
    //     getInt(byteOffset) {
    //         return binary.LittleEndian.getInt8(this.buffer, byteOffset)
    //     },
    //     getUint(byteOffset) {
    //         return binary.LittleEndian.getUint8(this.buffer, byteOffset)
    //     },
    // }))
    // const b = new ArrayBuffer(10)
    // const v = new binary.DataView(b)
    // t.test('DataView', new SetView({
    //     buffer: b,
    //     setInt(byteOffset, value) {
    //         v.setInt8(byteOffset, value)
    //     },
    //     setUint(byteOffset, value) {
    //         v.setUint8(byteOffset, value)
    //     },
    //     getInt(byteOffset) {
    //         return v.getInt8(byteOffset)
    //     },
    //     getUint(byteOffset) {
    //         return v.getUint8(byteOffset)
    //     },
    // }))
});
