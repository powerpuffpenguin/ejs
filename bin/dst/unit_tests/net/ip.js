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
var net_1 = require("ejs/net");
var unit_1 = require("../../unit/unit");
var net = __importStar(require("ejs/net"));
var nil = undefined;
function makeIP() {
    var vals = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        vals[_i] = arguments[_i];
    }
    return new net_1.IP(new Uint8Array(vals));
}
function makeIPMask() {
    var vals = [];
    for (var _i = 0; _i < arguments.length; _i++) {
        vals[_i] = arguments[_i];
    }
    return new net_1.IPMask(new Uint8Array(vals));
}
function ParseError(v) {
    return v;
}
var m = unit_1.test.module("ejs/net");
m.test('IP.parse', function (assert) {
    var e_1, _a;
    var _b;
    var tests = [
        ["127.0.1.2", net_1.IP.v4(127, 0, 1, 2)],
        ["127.0.0.1", net_1.IP.v4(127, 0, 0, 1)],
        ["::ffff:127.1.2.3", net_1.IP.v4(127, 1, 2, 3)],
        ["::ffff:7f01:0203", net_1.IP.v4(127, 1, 2, 3)],
        ["0:0:0:0:0000:ffff:127.1.2.3", net_1.IP.v4(127, 1, 2, 3)],
        ["0:0:0:0:000000:ffff:127.1.2.3", net_1.IP.v4(127, 1, 2, 3)],
        ["0:0:0:0::ffff:127.1.2.3", net_1.IP.v4(127, 1, 2, 3)],
        ["2001:4860:0:2001::68", makeIP(0x20, 0x01, 0x48, 0x60, 0, 0, 0x20, 0x01, 0, 0, 0, 0, 0, 0, 0x00, 0x68)],
        ["2001:4860:0000:2001:0000:0000:0000:0068", makeIP(0x20, 0x01, 0x48, 0x60, 0, 0, 0x20, 0x01, 0, 0, 0, 0, 0, 0, 0x00, 0x68)],
        ["-0.0.0.0", nil],
        ["0.-1.0.0", nil],
        ["0.0.-2.0", nil],
        ["0.0.0.-3", nil],
        ["127.0.0.256", nil],
        ["abc", nil],
        ["123:", nil],
        ["fe80::1%lo0", nil],
        ["fe80::1%911", nil],
        ["", nil],
        ["a1:a2:a3:a4::b1:b2:b3:b4", nil],
        ["127.001.002.003", nil],
        ["::ffff:127.001.002.003", nil],
        ["123.000.000.000", nil],
        ["1.2..4", nil],
        ["0123.0.0.1", nil],
    ];
    try {
        for (var tests_1 = __values(tests), tests_1_1 = tests_1.next(); !tests_1_1.done; tests_1_1 = tests_1.next()) {
            var tt = tests_1_1.value;
            var o = net_1.IP.parse(tt[0]);
            assert.equal(o === null || o === void 0 ? void 0 : o.ip, (_b = tt[1]) === null || _b === void 0 ? void 0 : _b.ip);
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
m.test('IP.toString', function (assert) {
    var e_2, _a;
    function make(vals, str, byt, err) {
        var ip;
        if (vals instanceof net_1.IP) {
            ip = vals;
        }
        else if (Array.isArray(vals)) {
            ip = makeIP.apply(void 0, __spreadArray([], __read(vals), false));
        }
        return {
            in: ip,
            str: str,
            byt: byt ? new TextEncoder().encode(byt) : undefined,
            error: err,
        };
    }
    var tests = [
        // IP.v4 address
        make([192, 0, 2, 1], "192.0.2.1", "192.0.2.1", nil),
        make([0, 0, 0, 0], "0.0.0.0", "0.0.0.0", nil),
        // IP.v4-mapped IPv6 address
        make([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 192, 0, 2, 1], "192.0.2.1", "192.0.2.1", nil),
        make([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 0, 0, 0, 0], "0.0.0.0", "0.0.0.0", nil),
        // IPv6 address
        make([0x20, 0x1, 0xd, 0xb8, 0, 0, 0, 0, 0, 0, 0x1, 0x23, 0, 0x12, 0, 0x1], "2001:db8::123:12:1", "2001:db8::123:12:1", nil),
        make([0x20, 0x1, 0xd, 0xb8, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x1], "2001:db8::1", "2001:db8::1", nil),
        make([0x20, 0x1, 0xd, 0xb8, 0, 0, 0, 0x1, 0, 0, 0, 0x1, 0, 0, 0, 0x1], "2001:db8:0:1:0:1:0:1", "2001:db8:0:1:0:1:0:1", nil),
        make([0x20, 0x1, 0xd, 0xb8, 0, 0x1, 0, 0, 0, 0x1, 0, 0, 0, 0x1, 0, 0], "2001:db8:1:0:1:0:1:0", ("2001:db8:1:0:1:0:1:0"), nil),
        make([0x20, 0x1, 0, 0, 0, 0, 0, 0, 0, 0x1, 0, 0, 0, 0, 0, 0x1], "2001::1:0:0:1", ("2001::1:0:0:1"), nil),
        make([0x20, 0x1, 0xd, 0xb8, 0, 0, 0, 0, 0, 0x1, 0, 0, 0, 0, 0, 0], "2001:db8:0:0:1::", ("2001:db8:0:0:1::"), nil),
        make([0x20, 0x1, 0xd, 0xb8, 0, 0, 0, 0, 0, 0x1, 0, 0, 0, 0, 0, 0x1], "2001:db8::1:0:0:1", ("2001:db8::1:0:0:1"), nil),
        make([0x20, 0x1, 0xd, 0xb8, 0, 0, 0, 0, 0, 0xa, 0, 0xb, 0, 0xc, 0, 0xd], "2001:db8::a:b:c:d", ("2001:db8::a:b:c:d"), nil),
        make(net_1.IP.v6unspecified, "::", ("::"), nil),
        // IP wildcard equivalent address in Dial/Listen API
        make(nil, "<undefined>", nil, nil),
        // Opaque byte sequence
        make([0x01, 0x23, 0x45, 0x67, 0x89, 0xab, 0xcd, 0xef], "?0123456789abcdef", nil, "invalid IP address"),
    ];
    try {
        for (var tests_2 = __values(tests), tests_2_1 = tests_2.next(); !tests_2_1.done; tests_2_1 = tests_2.next()) {
            var tt = tests_2_1.value;
            if (tt.in === undefined) {
                assert.equal("<undefined>", tt.str);
                assert.equal(undefined, tt.byt);
            }
            else {
                var str = tt.in.toString();
                assert.equal(str, tt.str);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (tests_2_1 && !tests_2_1.done && (_a = tests_2.return)) _a.call(tests_2);
        }
        finally { if (e_2) throw e_2.error; }
    }
});
m.test('IPMask', function (assert) {
    var e_3, _a;
    function make(ip, mask, out) {
        return {
            in: ip,
            mask: mask,
            out: out,
        };
    }
    var tests = [
        make(net_1.IP.v4(192, 168, 1, 127), net_1.IPMask.v4(255, 255, 255, 128), net_1.IP.v4(192, 168, 1, 0)),
        make(net_1.IP.v4(192, 168, 1, 127), new net_1.IPMask(net_1.IP.parse("255.255.255.192").ip), net_1.IP.v4(192, 168, 1, 64)),
        make(net_1.IP.v4(192, 168, 1, 127), new net_1.IPMask(net_1.IP.parse("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffe0").ip), net_1.IP.v4(192, 168, 1, 96)),
        make(net_1.IP.v4(192, 168, 1, 127), net_1.IPMask.v4(255, 0, 255, 0), net_1.IP.v4(192, 0, 1, 0)),
        make(net_1.IP.parse("2001:db8::1"), new net_1.IPMask(net_1.IP.parse("ffff:ff80::").ip), net_1.IP.parse("2001:d80::")),
        make(net_1.IP.parse("2001:db8::1"), new net_1.IPMask(net_1.IP.parse("f0f0:0f0f::").ip), net_1.IP.parse("2000:d08::")),
    ];
    try {
        for (var tests_3 = __values(tests), tests_3_1 = tests_3.next(); !tests_3_1.done; tests_3_1 = tests_3.next()) {
            var tt = tests_3_1.value;
            var out = tt.in.mask(tt.mask);
            assert.true(out === undefined || tt.out.equal(out));
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (tests_3_1 && !tests_3_1.done && (_a = tests_3.return)) _a.call(tests_3);
        }
        finally { if (e_3) throw e_3.error; }
    }
});
m.test('IPMask.toString', function (assert) {
    var e_4, _a;
    function make(mask, out) {
        return {
            in: mask,
            out: out,
        };
    }
    var tests = [
        make(net_1.IPMask.v4(255, 255, 255, 240), "fffffff0"),
        make(net_1.IPMask.v4(255, 0, 128, 0), "ff008000"),
        make(new net_1.IPMask(net_1.IP.parse("ffff:ff80::").ip), "ffffff80000000000000000000000000"),
        make(new net_1.IPMask(net_1.IP.parse("ef00:ff80::cafe:0").ip), "ef00ff800000000000000000cafe0000"),
    ];
    try {
        for (var tests_4 = __values(tests), tests_4_1 = tests_4.next(); !tests_4_1.done; tests_4_1 = tests_4.next()) {
            var tt = tests_4_1.value;
            assert.equal(tt.in.toString(), tt.out);
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (tests_4_1 && !tests_4_1.done && (_a = tests_4.return)) _a.call(tests_4);
        }
        finally { if (e_4) throw e_4.error; }
    }
});
m.test("parseCIDR", function (assert) {
    var e_5, _a, _b;
    function make(v, ip, net, err) {
        return {
            in: v,
            ip: ip,
            net: net,
            err: err,
        };
    }
    var tests = [
        make("135.104.0.0/32", net_1.IP.v4(135, 104, 0, 0), new net_1.IPNet(net_1.IP.v4(135, 104, 0, 0), net_1.IPMask.v4(255, 255, 255, 255)), nil),
        make("0.0.0.0/24", net_1.IP.v4(0, 0, 0, 0), new net_1.IPNet(net_1.IP.v4(0, 0, 0, 0), net_1.IPMask.v4(255, 255, 255, 0)), nil),
        make("135.104.0.0/24", net_1.IP.v4(135, 104, 0, 0), new net_1.IPNet(net_1.IP.v4(135, 104, 0, 0), net_1.IPMask.v4(255, 255, 255, 0)), nil),
        make("135.104.0.1/32", net_1.IP.v4(135, 104, 0, 1), new net_1.IPNet(net_1.IP.v4(135, 104, 0, 1), net_1.IPMask.v4(255, 255, 255, 255)), nil),
        make("135.104.0.1/24", net_1.IP.v4(135, 104, 0, 1), new net_1.IPNet(net_1.IP.v4(135, 104, 0, 0), net_1.IPMask.v4(255, 255, 255, 0)), nil),
        make("::1/128", net_1.IP.parse("::1"), new net_1.IPNet(net_1.IP.parse("::1"), new net_1.IPMask(net_1.IP.parse("ffff:ffff:ffff:ffff:ffff:ffff:ffff:ffff").ip)), nil),
        make("abcd:2345::/127", net_1.IP.parse("abcd:2345::"), new net_1.IPNet(net_1.IP.parse("abcd:2345::"), new net_1.IPMask(net_1.IP.parse("ffff:ffff:ffff:ffff:ffff:ffff:ffff:fffe").ip)), nil),
        make("abcd:2345::/65", net_1.IP.parse("abcd:2345::"), new net_1.IPNet(net_1.IP.parse("abcd:2345::"), new net_1.IPMask(net_1.IP.parse("ffff:ffff:ffff:ffff:8000::").ip)), nil),
        make("abcd:2345::/64", net_1.IP.parse("abcd:2345::"), new net_1.IPNet(net_1.IP.parse("abcd:2345::"), new net_1.IPMask(net_1.IP.parse("ffff:ffff:ffff:ffff::").ip)), nil),
        make("abcd:2345::/63", net_1.IP.parse("abcd:2345::"), new net_1.IPNet(net_1.IP.parse("abcd:2345::"), new net_1.IPMask(net_1.IP.parse("ffff:ffff:ffff:fffe::").ip)), nil),
        make("abcd:2345::/33", net_1.IP.parse("abcd:2345::"), new net_1.IPNet(net_1.IP.parse("abcd:2345::"), new net_1.IPMask(net_1.IP.parse("ffff:ffff:8000::").ip)), nil),
        make("abcd:2345::/32", net_1.IP.parse("abcd:2345::"), new net_1.IPNet(net_1.IP.parse("abcd:2345::"), new net_1.IPMask(net_1.IP.parse("ffff:ffff::").ip)), nil),
        make("abcd:2344::/31", net_1.IP.parse("abcd:2344::"), new net_1.IPNet(net_1.IP.parse("abcd:2344::"), new net_1.IPMask(net_1.IP.parse("ffff:fffe::").ip)), nil),
        make("abcd:2300::/24", net_1.IP.parse("abcd:2300::"), new net_1.IPNet(net_1.IP.parse("abcd:2300::"), new net_1.IPMask(net_1.IP.parse("ffff:ff00::").ip)), nil),
        make("abcd:2345::/24", net_1.IP.parse("abcd:2345::"), new net_1.IPNet(net_1.IP.parse("abcd:2300::"), new net_1.IPMask(net_1.IP.parse("ffff:ff00::").ip)), nil),
        make("2001:DB8::/48", net_1.IP.parse("2001:DB8::"), new net_1.IPNet(net_1.IP.parse("2001:DB8::"), new net_1.IPMask(net_1.IP.parse("ffff:ffff:ffff::").ip)), nil),
        make("2001:DB8::1/48", net_1.IP.parse("2001:DB8::1"), new net_1.IPNet(net_1.IP.parse("2001:DB8::"), new net_1.IPMask(net_1.IP.parse("ffff:ffff:ffff::").ip)), nil),
        make("192.168.1.1/255.255.255.0", nil, nil, ParseError({ Type: "CIDR address", Text: "192.168.1.1/255.255.255.0" })),
        make("192.168.1.1/35", nil, nil, ParseError({ Type: "CIDR address", Text: "192.168.1.1/35" })),
        make("2001:db8::1/-1", nil, nil, ParseError({ Type: "CIDR address", Text: "2001:db8::1/-1" })),
        make("2001:db8::1/-0", nil, nil, ParseError({ Type: "CIDR address", Text: "2001:db8::1/-0" })),
        make("-0.0.0.0/32", nil, nil, ParseError({ Type: "CIDR address", Text: "-0.0.0.0/32" })),
        make("0.-1.0.0/32", nil, nil, ParseError({ Type: "CIDR address", Text: "0.-1.0.0/32" })),
        make("0.0.-2.0/32", nil, nil, ParseError({ Type: "CIDR address", Text: "0.0.-2.0/32" })),
        make("0.0.0.-3/32", nil, nil, ParseError({ Type: "CIDR address", Text: "0.0.0.-3/32" })),
        make("0.0.0.0/-0", nil, nil, ParseError({ Type: "CIDR address", Text: "0.0.0.0/-0" })),
        make("127.000.000.001/32", nil, nil, ParseError({ Type: "CIDR address", Text: "127.000.000.001/32" })),
        make("", nil, nil, ParseError({ Type: "CIDR address", Text: "" })),
    ];
    try {
        for (var tests_5 = __values(tests), tests_5_1 = tests_5.next(); !tests_5_1.done; tests_5_1 = tests_5.next()) {
            var tt = tests_5_1.value;
            var ip = void 0;
            var net_2 = void 0;
            var v = (0, net_1.parseCIDR)(tt.in);
            if (tt.err) {
                assert.equal(v, undefined);
            }
            else {
                assert.notEqual(v, undefined);
            }
            if (v) {
                _b = __read(v, 2), ip = _b[0], net_2 = _b[1];
                assert.true(tt.ip.equal(ip));
                assert.true(tt.net.ip.equal(net_2.ip));
                assert.equal(tt.net.mask, net_2.mask);
            }
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (tests_5_1 && !tests_5_1.done && (_a = tests_5.return)) _a.call(tests_5);
        }
        finally { if (e_5) throw e_5.error; }
    }
});
m.test("IPAddrFamily", function (assert) {
    var e_6, _a;
    function make(ip, af4, af6) {
        return {
            in: ip,
            af4: af4,
            af6: af6,
        };
    }
    var tests = [
        make(net_1.IP.v4bcast, true, false),
        make(net_1.IP.v4allsys, true, false),
        make(net_1.IP.v4allrouter, true, false),
        make(net_1.IP.v4zero, true, false),
        make(net_1.IP.v4(224, 0, 0, 1), true, false),
        make(net_1.IP.v4(127, 0, 0, 1), true, false),
        make(net_1.IP.v4(240, 0, 0, 1), true, false),
        make(net_1.IP.v6unspecified, false, true),
        make(net_1.IP.v6loopback, false, true),
        make(net_1.IP.v6interfacelocalallnodes, false, true),
        make(net_1.IP.v6linklocalallnodes, false, true),
        make(net_1.IP.v6linklocalallrouters, false, true),
        make(net_1.IP.parse("ff05::a:b:c:d"), false, true),
        make(net_1.IP.parse("fe80::1:2:3:4"), false, true),
        make(net_1.IP.parse("2001:db8::123:12:1"), false, true),
    ];
    try {
        for (var tests_6 = __values(tests), tests_6_1 = tests_6.next(); !tests_6_1.done; tests_6_1 = tests_6.next()) {
            var tt = tests_6_1.value;
            var af = tt.in.to4() !== undefined;
            assert.equal(af, tt.af4);
            af = tt.in.length == net_1.IPv6len && tt.in.to4() === undefined;
            assert.equal(af, tt.af6, "".concat(tt.in));
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (tests_6_1 && !tests_6_1.done && (_a = tests_6.return)) _a.call(tests_6);
        }
        finally { if (e_6) throw e_6.error; }
    }
});
m.test("IPAddrScope", function (assert) {
    var e_7, _a;
    var nilIP = new net_1.IP(new Uint8Array());
    function make(scope, ip, ok) {
        return {
            scope: scope,
            in: ip !== null && ip !== void 0 ? ip : nilIP,
            ok: ok,
        };
    }
    var tests = [
        make(function (ip) { return ip.isUnspecified; }, net_1.IP.v4zero, true),
        make(function (ip) { return ip.isUnspecified; }, net_1.IP.v4(127, 0, 0, 1), false),
        make(function (ip) { return ip.isUnspecified; }, net_1.IP.v6unspecified, true),
        make(function (ip) { return ip.isUnspecified; }, net_1.IP.v6interfacelocalallnodes, false),
        make(function (ip) { return ip.isUnspecified; }, nil, false),
        make(function (ip) { return ip.isLoopback; }, net_1.IP.v4(127, 0, 0, 1), true),
        make(function (ip) { return ip.isLoopback; }, net_1.IP.v4(127, 255, 255, 254), true),
        make(function (ip) { return ip.isLoopback; }, net_1.IP.v4(128, 1, 2, 3), false),
        make(function (ip) { return ip.isLoopback; }, net_1.IP.v6loopback, true),
        make(function (ip) { return ip.isLoopback; }, net_1.IP.v6linklocalallrouters, false),
        make(function (ip) { return ip.isLoopback; }, nil, false),
        make(function (ip) { return ip.isMulticast; }, net_1.IP.v4(224, 0, 0, 0), true),
        make(function (ip) { return ip.isMulticast; }, net_1.IP.v4(239, 0, 0, 0), true),
        make(function (ip) { return ip.isMulticast; }, net_1.IP.v4(240, 0, 0, 0), false),
        make(function (ip) { return ip.isMulticast; }, net_1.IP.v6linklocalallnodes, true),
        make(function (ip) { return ip.isMulticast; }, makeIP(0xff, 0x05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), true),
        make(function (ip) { return ip.isMulticast; }, makeIP(0xfe, 0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), false),
        make(function (ip) { return ip.isMulticast; }, nil, false),
        make(function (ip) { return ip.isInterfaceLocalMulticast; }, net_1.IP.v4(224, 0, 0, 0), false),
        make(function (ip) { return ip.isInterfaceLocalMulticast; }, net_1.IP.v4(0xff, 0x01, 0, 0), false),
        make(function (ip) { return ip.isInterfaceLocalMulticast; }, net_1.IP.v6interfacelocalallnodes, true),
        make(function (ip) { return ip.isInterfaceLocalMulticast; }, nil, false),
        make(function (ip) { return ip.isLinkLocalMulticast; }, net_1.IP.v4(224, 0, 0, 0), true),
        make(function (ip) { return ip.isLinkLocalMulticast; }, net_1.IP.v4(239, 0, 0, 0), false),
        make(function (ip) { return ip.isLinkLocalMulticast; }, net_1.IP.v4(0xff, 0x02, 0, 0), false),
        make(function (ip) { return ip.isLinkLocalMulticast; }, net_1.IP.v6linklocalallrouters, true),
        make(function (ip) { return ip.isLinkLocalMulticast; }, makeIP(0xff, 0x05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), false),
        make(function (ip) { return ip.isLinkLocalMulticast; }, nil, false),
        make(function (ip) { return ip.isLinkLocalUnicast; }, net_1.IP.v4(169, 254, 0, 0), true),
        make(function (ip) { return ip.isLinkLocalUnicast; }, net_1.IP.v4(169, 255, 0, 0), false),
        make(function (ip) { return ip.isLinkLocalUnicast; }, net_1.IP.v4(0xfe, 0x80, 0, 0), false),
        make(function (ip) { return ip.isLinkLocalUnicast; }, makeIP(0xfe, 0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), true),
        make(function (ip) { return ip.isLinkLocalUnicast; }, makeIP(0xfe, 0xc0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), false),
        make(function (ip) { return ip.isLinkLocalUnicast; }, nil, false),
        make(function (ip) { return ip.isGlobalUnicast; }, net_1.IP.v4(240, 0, 0, 0), true),
        make(function (ip) { return ip.isGlobalUnicast; }, net_1.IP.v4(232, 0, 0, 0), false),
        make(function (ip) { return ip.isGlobalUnicast; }, net_1.IP.v4(169, 254, 0, 0), false),
        make(function (ip) { return ip.isGlobalUnicast; }, net_1.IP.v4bcast, false),
        make(function (ip) { return ip.isGlobalUnicast; }, makeIP(0x20, 0x1, 0xd, 0xb8, 0, 0, 0, 0, 0, 0, 0x1, 0x23, 0, 0x12, 0, 0x1), true),
        make(function (ip) { return ip.isGlobalUnicast; }, makeIP(0xfe, 0x80, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), false),
        make(function (ip) { return ip.isGlobalUnicast; }, makeIP(0xff, 0x05, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), false),
        make(function (ip) { return ip.isGlobalUnicast; }, nil, false),
        make(function (ip) { return ip.isPrivate; }, nil, false),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(1, 1, 1, 1), false),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(9, 255, 255, 255), false),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(10, 0, 0, 0), true),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(10, 255, 255, 255), true),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(11, 0, 0, 0), false),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(172, 15, 255, 255), false),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(172, 16, 0, 0), true),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(172, 16, 255, 255), true),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(172, 23, 18, 255), true),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(172, 31, 255, 255), true),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(172, 31, 0, 0), true),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(172, 32, 0, 0), false),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(192, 167, 255, 255), false),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(192, 168, 0, 0), true),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(192, 168, 255, 255), true),
        make(function (ip) { return ip.isPrivate; }, net_1.IP.v4(192, 169, 0, 0), false),
        make(function (ip) { return ip.isPrivate; }, makeIP(0xfb, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff), false),
        make(function (ip) { return ip.isPrivate; }, makeIP(0xfc, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), true),
        make(function (ip) { return ip.isPrivate; }, makeIP(0xfc, 0xff, 0x12, 0, 0, 0, 0, 0x44, 0, 0, 0, 0, 0, 0, 0, 0), true),
        make(function (ip) { return ip.isPrivate; }, makeIP(0xfd, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff), true),
        make(function (ip) { return ip.isPrivate; }, makeIP(0xfe, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0), false),
    ];
    try {
        for (var tests_7 = __values(tests), tests_7_1 = tests_7.next(); !tests_7_1.done; tests_7_1 = tests_7.next()) {
            var tt = tests_7_1.value;
            assert.equal(tt.scope(tt.in), tt.ok, "".concat(tt.in));
            var ip = tt.in.to4();
            if (ip) {
                assert.equal(tt.scope(ip), tt.ok);
            }
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (tests_7_1 && !tests_7_1.done && (_a = tests_7.return)) _a.call(tests_7);
        }
        finally { if (e_7) throw e_7.error; }
    }
});
m.test("joinHostPort", function (assert) {
    var e_8, _a;
    function make(host, port, hostPort) {
        return {
            host: host,
            port: port,
            hostPort: hostPort,
        };
    }
    var tests = [
        // Host name
        make("localhost", "http", "localhost:http"),
        make("localhost", "80", "localhost:80"),
        // Go-specific host name with zone identifier
        make("localhost%lo0", "http", "localhost%lo0:http"),
        make("localhost%lo0", "80", "localhost%lo0:80"),
        // IP literal
        make("127.0.0.1", "http", "127.0.0.1:http"),
        make("127.0.0.1", "80", "127.0.0.1:80"),
        make("::1", "http", "[::1]:http"),
        make("::1", "80", "[::1]:80"),
        // IP literal with zone identifier
        make("::1%lo0", "http", "[::1%lo0]:http"),
        make("::1%lo0", "80", "[::1%lo0]:80"),
        // Go-specific wildcard for host name
        make("", "http", ":http"),
        make("", "80", ":80"),
        // Go-specific wildcard for service name or transport port number
        make("golang.org", "", "golang.org:"),
        make("127.0.0.1", "", "127.0.0.1:"),
        make("::1", "", "[::1]:"),
        // Opaque service name
        make("golang.org", "https%foo", "golang.org:https%foo"), // Go 1 behavior
    ];
    try {
        for (var tests_8 = __values(tests), tests_8_1 = tests_8.next(); !tests_8_1.done; tests_8_1 = tests_8.next()) {
            var tt = tests_8_1.value;
            assert.equal((0, net_1.joinHostPort)(tt.host, tt.port), tt.hostPort);
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (tests_8_1 && !tests_8_1.done && (_a = tests_8.return)) _a.call(tests_8);
        }
        finally { if (e_8) throw e_8.error; }
    }
});
m.test("splitHostPort", function (assert) {
    var e_9, _a, e_10, _b;
    function make(hostPort, host, port) {
        return {
            host: host,
            port: port,
            hostPort: hostPort,
        };
    }
    var tests = [
        // Host name
        make("localhost:http", "localhost", "http"),
        make("localhost:80", "localhost", "80"),
        // Go-specific host name with zone identifier
        make("localhost%lo0:http", "localhost%lo0", "http"),
        make("localhost%lo0:80", "localhost%lo0", "80"),
        make("[localhost%lo0]:http", "localhost%lo0", "http"),
        make("[localhost%lo0]:80", "localhost%lo0", "80"),
        // IP literal
        make("127.0.0.1:http", "127.0.0.1", "http"),
        make("127.0.0.1:80", "127.0.0.1", "80"),
        make("[::1]:http", "::1", "http"),
        make("[::1]:80", "::1", "80"),
        // IP literal with zone identifier
        make("[::1%lo0]:http", "::1%lo0", "http"),
        make("[::1%lo0]:80", "::1%lo0", "80"),
        // Go-specific wildcard for host name
        make(":http", "", "http"),
        make(":80", "", "80"),
        // Go-specific wildcard for service name or transport port number
        make("golang.org:", "golang.org", ""),
        make("127.0.0.1:", "127.0.0.1", ""),
        make("[::1]:", "::1", ""),
        // Opaque service name
        make("golang.org:https%foo", "golang.org", "https%foo"), // Go 1 behavior
    ];
    try {
        for (var tests_9 = __values(tests), tests_9_1 = tests_9.next(); !tests_9_1.done; tests_9_1 = tests_9.next()) {
            var tt = tests_9_1.value;
            var _c = __read((0, net_1.splitHostPort)(tt.hostPort), 2), host = _c[0], port = _c[1];
            assert.equal(host, tt.host);
            assert.equal(port, tt.port);
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (tests_9_1 && !tests_9_1.done && (_a = tests_9.return)) _a.call(tests_9);
        }
        finally { if (e_9) throw e_9.error; }
    }
    function err(hostPort, err) {
        return {
            err: err,
            hostPort: hostPort,
        };
    }
    var errs = [
        err("golang.org", "missing port in address"),
        err("127.0.0.1", "missing port in address"),
        err("[::1]", "missing port in address"),
        err("[fe80::1%lo0]", "missing port in address"),
        err("[localhost%lo0]", "missing port in address"),
        err("localhost%lo0", "missing port in address"),
        err("::1", "too many colons in address"),
        err("fe80::1%lo0", "too many colons in address"),
        err("fe80::1%lo0:80", "too many colons in address"),
        // Test cases that didn't fail in Go 1
        err("[foo:bar]", "missing port in address"),
        err("[foo:bar]baz", "missing port in address"),
        err("[foo]bar:baz", "missing port in address"),
        err("[foo]:[bar]:baz", "too many colons in address"),
        err("[foo]:[bar]baz", "unexpected '[' in address"),
        err("foo[bar]:baz", "unexpected '[' in address"),
        err("foo]bar:baz", "unexpected ']' in address"),
    ];
    try {
        for (var errs_1 = __values(errs), errs_1_1 = errs_1.next(); !errs_1_1.done; errs_1_1 = errs_1.next()) {
            var tt = errs_1_1.value;
            try {
                (0, net_1.splitHostPort)(tt.hostPort);
                assert.true(false, tt.hostPort);
            }
            catch (e) {
                assert.true(e instanceof net_1.AddrError);
                if (e instanceof net_1.AddrError) {
                    assert.equal(e.message, tt.err);
                }
            }
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (errs_1_1 && !errs_1_1.done && (_b = errs_1.return)) _b.call(errs_1);
        }
        finally { if (e_10) throw e_10.error; }
    }
});
m.test("IPMask.cidr", function (assert) {
    var e_11, _a;
    function make(ones, bits, out) {
        return {
            ones: ones,
            bits: bits,
            out: out,
        };
    }
    var tests = [
        make(0, 32, net_1.IPMask.v4(0, 0, 0, 0)),
        make(12, 32, net_1.IPMask.v4(255, 240, 0, 0)),
        make(24, 32, net_1.IPMask.v4(255, 255, 255, 0)),
        make(32, 32, net_1.IPMask.v4(255, 255, 255, 255)),
        make(0, 128, makeIPMask(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)),
        make(4, 128, makeIPMask(0xf0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)),
        make(48, 128, makeIPMask(0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0)),
        make(128, 128, makeIPMask(0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff)),
        make(33, 32, nil),
        make(32, 33, nil),
        make(-1, 128, nil),
        make(128, -1, nil),
    ];
    try {
        for (var tests_10 = __values(tests), tests_10_1 = tests_10.next(); !tests_10_1.done; tests_10_1 = tests_10.next()) {
            var tt = tests_10_1.value;
            assert.equal(net_1.IPMask.cidr(tt.ones, tt.bits), tt.out);
        }
    }
    catch (e_11_1) { e_11 = { error: e_11_1 }; }
    finally {
        try {
            if (tests_10_1 && !tests_10_1.done && (_a = tests_10.return)) _a.call(tests_10);
        }
        finally { if (e_11) throw e_11.error; }
    }
});
var v4addr = makeIP(192, 168, 0, 1);
var v4mappedv6addr = makeIP(0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff, 192, 168, 0, 1);
var v6addr = makeIP(0x20, 0x1, 0xd, 0xb8, 0, 0, 0, 0, 0, 0, 0x1, 0x23, 0, 0x12, 0, 0x1);
var v4mask = makeIPMask(255, 255, 255, 0);
var v4mappedv6mask = makeIPMask(0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 255, 255, 255, 0);
var v6mask = makeIPMask(0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0, 0, 0, 0, 0, 0, 0, 0);
var badaddr = makeIP(192, 168, 0);
var badmask = makeIPMask(255, 255, 0);
var v4maskzero = makeIPMask(0, 0, 0, 0);
m.test("NetworkNumberAndMask", function (assert) {
    var e_12, _a;
    function make(in0, out) {
        return {
            in: in0,
            out: out,
        };
    }
    var tests = [
        make(new net_1.IPNet(v4addr, v4mask), new net_1.IPNet(v4addr, v4mask)),
        make(new net_1.IPNet(v4addr, v4mappedv6mask), new net_1.IPNet(v4addr, v4mask)),
        make(new net_1.IPNet(v4mappedv6addr, v4mappedv6mask), new net_1.IPNet(v4addr, v4mask)),
        make(new net_1.IPNet(v4mappedv6addr, v6mask), new net_1.IPNet(v4addr, v4maskzero)),
        make(new net_1.IPNet(v4addr, v6mask), new net_1.IPNet(v4addr, v4maskzero)),
        make(new net_1.IPNet(v6addr, v6mask), new net_1.IPNet(v6addr, v6mask)),
        make(new net_1.IPNet(v6addr, v4mappedv6mask), new net_1.IPNet(v6addr, v4mappedv6mask)),
        make(new net_1.IPNet(v6addr, v4mask)),
        make(new net_1.IPNet(v4addr, badmask)),
        make(new net_1.IPNet(v4mappedv6addr, badmask)),
        make(new net_1.IPNet(v6addr, badmask)),
        make(new net_1.IPNet(badaddr, v4mask)),
        make(new net_1.IPNet(badaddr, v4mappedv6mask)),
        make(new net_1.IPNet(badaddr, v6mask)),
        make(new net_1.IPNet(badaddr, badmask)),
    ];
    try {
        for (var tests_11 = __values(tests), tests_11_1 = tests_11.next(); !tests_11_1.done; tests_11_1 = tests_11.next()) {
            var tt = tests_11_1.value;
            var out = net.networkNumberAndMask(tt.in);
            if (out) {
                var _b = __read(out, 2), ip = _b[0], mask = _b[1];
                assert.equal(tt.out.ip, ip);
                assert.equal(tt.out.mask, mask);
            }
            else {
                assert.equal(tt.out, out);
            }
        }
    }
    catch (e_12_1) { e_12 = { error: e_12_1 }; }
    finally {
        try {
            if (tests_11_1 && !tests_11_1.done && (_a = tests_11.return)) _a.call(tests_11);
        }
        finally { if (e_12) throw e_12.error; }
    }
});
m.test("IPNet.toString", function (assert) {
    var e_13, _a;
    function make(net, out) {
        return {
            in: net,
            out: out,
        };
    }
    var tests = [
        make(new net_1.IPNet(net_1.IP.v4(192, 168, 1, 0), net_1.IPMask.cidr(26, 32)), "192.168.1.0/26"),
        make(new net_1.IPNet(net_1.IP.v4(192, 168, 1, 0), net_1.IPMask.v4(255, 0, 255, 0)), "192.168.1.0/ff00ff00"),
        make(new net_1.IPNet(net_1.IP.parse("2001:db8::"), net_1.IPMask.cidr(55, 128)), "2001:db8::/55"),
        make(new net_1.IPNet(net_1.IP.parse("2001:db8::"), new net_1.IPMask(net_1.IP.parse("8000:f123:0:cafe::").ip)), "2001:db8::/8000f1230000cafe0000000000000000"),
    ];
    try {
        for (var tests_12 = __values(tests), tests_12_1 = tests_12.next(); !tests_12_1.done; tests_12_1 = tests_12.next()) {
            var tt = tests_12_1.value;
            assert.equal(tt.out, tt.in.toString());
        }
    }
    catch (e_13_1) { e_13 = { error: e_13_1 }; }
    finally {
        try {
            if (tests_12_1 && !tests_12_1.done && (_a = tests_12.return)) _a.call(tests_12);
        }
        finally { if (e_13) throw e_13.error; }
    }
});
m.test("IPNet.contains", function (assert) {
    var e_14, _a;
    function make(ip, net, ok) {
        return {
            in: ip,
            net: net,
            ok: ok,
        };
    }
    var tests = [
        make(net_1.IP.v4(172, 16, 1, 1), new net_1.IPNet(net_1.IP.v4(172, 16, 0, 0), net_1.IPMask.cidr(12, 32)), true),
        make(net_1.IP.v4(172, 24, 0, 1), new net_1.IPNet(net_1.IP.v4(172, 16, 0, 0), net_1.IPMask.cidr(13, 32)), false),
        make(net_1.IP.v4(192, 168, 0, 3), new net_1.IPNet(net_1.IP.v4(192, 168, 0, 0), net_1.IPMask.v4(0, 0, 255, 252)), true),
        make(net_1.IP.v4(192, 168, 0, 4), new net_1.IPNet(net_1.IP.v4(192, 168, 0, 0), net_1.IPMask.v4(0, 255, 0, 252)), false),
        make(net_1.IP.parse("2001:db8:1:2::1"), new net_1.IPNet(net_1.IP.parse("2001:db8:1::"), net_1.IPMask.cidr(47, 128)), true),
        make(net_1.IP.parse("2001:db8:1:2::1"), new net_1.IPNet(net_1.IP.parse("2001:db8:2::"), net_1.IPMask.cidr(47, 128)), false),
        make(net_1.IP.parse("2001:db8:1:2::1"), new net_1.IPNet(net_1.IP.parse("2001:db8:1::"), new net_1.IPMask(net_1.IP.parse("ffff:0:ffff::").ip)), true),
        make(net_1.IP.parse("2001:db8:1:2::1"), new net_1.IPNet(net_1.IP.parse("2001:db8:1::"), new net_1.IPMask(net_1.IP.parse("0:0:0:ffff::").ip)), false),
    ];
    try {
        for (var tests_13 = __values(tests), tests_13_1 = tests_13.next(); !tests_13_1.done; tests_13_1 = tests_13.next()) {
            var tt = tests_13_1.value;
            assert.equal(tt.ok, tt.net.contains(tt.in), tt.in.toString());
        }
    }
    catch (e_14_1) { e_14 = { error: e_14_1 }; }
    finally {
        try {
            if (tests_13_1 && !tests_13_1.done && (_a = tests_13.return)) _a.call(tests_13);
        }
        finally { if (e_14) throw e_14.error; }
    }
});
