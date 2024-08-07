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
var unit_1 = require("../../../unit/unit");
var url = __importStar(require("ejs/net/url"));
var m = unit_1.test.module("ejs/net/url");
var nil = undefined;
var urltests = [
    // no path
    {
        in: "http://www.google.com",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
        }),
        roundtrip: "",
    },
    // path
    {
        in: "http://www.google.com/",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/",
        }),
        roundtrip: "",
    },
    // path with hex escaping
    {
        in: "http://www.google.com/file%20one%26two",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/file one&two",
            rawPath: "/file%20one%26two",
        }),
        roundtrip: "",
    },
    // fragment with hex escaping
    {
        in: "http://www.google.com/#file%20one%26two",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/",
            fragment: "file one&two",
            rawFragment: "file%20one%26two",
        }),
        roundtrip: "",
    },
    // user
    {
        in: "ftp://webmaster@www.google.com/",
        out: new url.URL({
            scheme: "ftp",
            user: { username: "webmaster" },
            host: "www.google.com",
            path: "/",
        }),
        roundtrip: "",
    },
    // escape sequence in username
    {
        in: "ftp://john%20doe@www.google.com/",
        out: new url.URL({
            scheme: "ftp",
            user: { username: "john doe" },
            host: "www.google.com",
            path: "/",
        }),
        roundtrip: "ftp://john%20doe@www.google.com/",
    },
    // empty query
    {
        in: "http://www.google.com/?",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/",
            forceQuery: true,
        }),
        roundtrip: "",
    },
    // query ending in question mark (Issue 14573)
    {
        in: "http://www.google.com/?foo=bar?",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/",
            rawQuery: "foo=bar?",
        }),
        roundtrip: "",
    },
    // query
    {
        in: "http://www.google.com/?q=go+language",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/",
            rawQuery: "q=go+language",
        }),
        roundtrip: "",
    },
    // query with hex escaping: NOT parsed
    {
        in: "http://www.google.com/?q=go%20language",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/",
            rawQuery: "q=go%20language",
        }),
        roundtrip: "",
    },
    // %20 outside query
    {
        in: "http://www.google.com/a%20b?q=c+d",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/a b",
            rawQuery: "q=c+d",
        }),
        roundtrip: "",
    },
    // path without leading /, so no parsing
    {
        in: "http:www.google.com/?q=go+language",
        out: new url.URL({
            scheme: "http",
            opaque: "www.google.com/",
            rawQuery: "q=go+language",
        }),
        roundtrip: "http:www.google.com/?q=go+language",
    },
    // path without leading /, so no parsing
    {
        in: "http:%2f%2fwww.google.com/?q=go+language",
        out: new url.URL({
            scheme: "http",
            opaque: "%2f%2fwww.google.com/",
            rawQuery: "q=go+language",
        }),
        roundtrip: "http:%2f%2fwww.google.com/?q=go+language",
    },
    // non-authority with path; see golang.org/issue/46059
    {
        in: "mailto:/webmaster@golang.org",
        out: new url.URL({
            scheme: "mailto",
            path: "/webmaster@golang.org",
            omitHost: true,
        }),
        roundtrip: "",
    },
    // non-authority
    {
        in: "mailto:webmaster@golang.org",
        out: new url.URL({
            scheme: "mailto",
            opaque: "webmaster@golang.org",
        }),
        roundtrip: "",
    },
    // unescaped :// in query should not create a scheme
    {
        in: "/foo?query=http://bad",
        out: new url.URL({
            path: "/foo",
            rawQuery: "query=http://bad",
        }),
        roundtrip: "",
    },
    // leading // without scheme should create an authority
    {
        in: "//foo",
        out: new url.URL({
            host: "foo",
        }),
        roundtrip: "",
    },
    // leading // without scheme, with userinfo, path, and query
    {
        in: "//user@foo/path?a=b",
        out: new url.URL({
            user: { username: "user" },
            host: "foo",
            path: "/path",
            rawQuery: "a=b",
        }),
        roundtrip: "",
    },
    // Three leading slashes isn't an authority, but doesn't return an error.
    // (We can't return an error, as this code is also used via
    // ServeHTTP -> ReadRequest -> Parse, which is arguably a
    // different URL parsing context, but currently shares the
    // same codepath)
    {
        in: "///threeslashes",
        out: new url.URL({
            path: "///threeslashes",
        }),
        roundtrip: "",
    },
    {
        in: "http://user:password@google.com",
        out: new url.URL({
            scheme: "http",
            user: { username: "user", password: "password" },
            host: "google.com",
        }),
        roundtrip: "http://user:password@google.com",
    },
    // unescaped @ in username should not confuse host
    {
        in: "http://j@ne:password@google.com",
        out: new url.URL({
            scheme: "http",
            user: { username: "j@ne", password: "password" },
            host: "google.com",
        }),
        roundtrip: "http://j%40ne:password@google.com",
    },
    // unescaped @ in password should not confuse host
    {
        in: "http://jane:p@ssword@google.com",
        out: new url.URL({
            scheme: "http",
            user: { username: "jane", password: "p@ssword" },
            host: "google.com",
        }),
        roundtrip: "http://jane:p%40ssword@google.com",
    },
    {
        in: "http://j@ne:password@google.com/p@th?q=@go",
        out: new url.URL({
            scheme: "http",
            user: { username: "j@ne", password: "password" },
            host: "google.com",
            path: "/p@th",
            rawQuery: "q=@go",
        }),
        roundtrip: "http://j%40ne:password@google.com/p@th?q=@go",
    },
    {
        in: "http://www.google.com/?q=go+language#foo",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/",
            rawQuery: "q=go+language",
            fragment: "foo",
        }),
        roundtrip: "",
    },
    {
        in: "http://www.google.com/?q=go+language#foo&bar",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/",
            rawQuery: "q=go+language",
            fragment: "foo&bar",
        }),
        roundtrip: "http://www.google.com/?q=go+language#foo&bar",
    },
    {
        in: "http://www.google.com/?q=go+language#foo%26bar",
        out: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "/",
            rawQuery: "q=go+language",
            fragment: "foo&bar",
            rawFragment: "foo%26bar",
        }),
        roundtrip: "http://www.google.com/?q=go+language#foo%26bar",
    },
    {
        in: "file:///home/adg/rabbits",
        out: new url.URL({
            scheme: "file",
            host: "",
            path: "/home/adg/rabbits",
        }),
        roundtrip: "file:///home/adg/rabbits",
    },
    // "Windows" paths are no exception to the rule.
    // See golang.org/issue/6027, especially comment #9.
    {
        in: "file:///C:/FooBar/Baz.txt",
        out: new url.URL({
            scheme: "file",
            host: "",
            path: "/C:/FooBar/Baz.txt",
        }),
        roundtrip: "file:///C:/FooBar/Baz.txt",
    },
    // case-insensitive scheme
    {
        in: "MaIlTo:webmaster@golang.org",
        out: new url.URL({
            scheme: "mailto",
            opaque: "webmaster@golang.org",
        }),
        roundtrip: "mailto:webmaster@golang.org",
    },
    // Relative path
    {
        in: "a/b/c",
        out: new url.URL({
            path: "a/b/c",
        }),
        roundtrip: "a/b/c",
    },
    // escaped '?' in username and password
    {
        in: "http://%3Fam:pa%3Fsword@google.com",
        out: new url.URL({
            scheme: "http",
            user: { username: "?am", password: "pa?sword" },
            host: "google.com",
        }),
        roundtrip: "",
    },
    // host subcomponent; IPv4 address in RFC 3986
    {
        in: "http://192.168.0.1/",
        out: new url.URL({
            scheme: "http",
            host: "192.168.0.1",
            path: "/",
        }),
        roundtrip: "",
    },
    // host and port subcomponents; IPv4 address in RFC 3986
    {
        in: "http://192.168.0.1:8080/",
        out: new url.URL({
            scheme: "http",
            host: "192.168.0.1:8080",
            path: "/",
        }),
        roundtrip: "",
    },
    // host subcomponent; IPv6 address in RFC 3986
    {
        in: "http://[fe80::1]/",
        out: new url.URL({
            scheme: "http",
            host: "[fe80::1]",
            path: "/",
        }),
        roundtrip: "",
    },
    // host and port subcomponents; IPv6 address in RFC 3986
    {
        in: "http://[fe80::1]:8080/",
        out: new url.URL({
            scheme: "http",
            host: "[fe80::1]:8080",
            path: "/",
        }),
        roundtrip: "",
    },
    // host subcomponent; IPv6 address with zone identifier in RFC 6874
    {
        in: "http://[fe80::1%25en0]/",
        out: new url.URL({
            scheme: "http",
            host: "[fe80::1%en0]",
            path: "/",
        }),
        roundtrip: "",
    },
    // host and port subcomponents; IPv6 address with zone identifier in RFC 6874
    {
        in: "http://[fe80::1%25en0]:8080/",
        out: new url.URL({
            scheme: "http",
            host: "[fe80::1%en0]:8080",
            path: "/",
        }),
        roundtrip: "",
    },
    // host subcomponent; IPv6 address with zone identifier in RFC 6874
    {
        in: "http://[fe80::1%25%65%6e%301-._~]/",
        out: new url.URL({
            scheme: "http",
            host: "[fe80::1%en01-._~]",
            path: "/",
        }),
        roundtrip: "http://[fe80::1%25en01-._~]/",
    },
    // host and port subcomponents; IPv6 address with zone identifier in RFC 6874
    {
        in: "http://[fe80::1%25%65%6e%301-._~]:8080/",
        out: new url.URL({
            scheme: "http",
            host: "[fe80::1%en01-._~]:8080",
            path: "/",
        }),
        roundtrip: "http://[fe80::1%25en01-._~]:8080/",
    },
    // alternate escapings of path survive round trip
    {
        in: "http://rest.rsc.io/foo%2fbar/baz%2Fquux?alt=media",
        out: new url.URL({
            scheme: "http",
            host: "rest.rsc.io",
            path: "/foo/bar/baz/quux",
            rawPath: "/foo%2fbar/baz%2Fquux",
            rawQuery: "alt=media",
        }),
        roundtrip: "",
    },
    // issue 12036
    {
        in: "mysql://a,b,c/bar",
        out: new url.URL({
            scheme: "mysql",
            host: "a,b,c",
            path: "/bar",
        }),
        roundtrip: "",
    },
    // worst case host, still round trips
    {
        in: "scheme://!$&'()*+,;=hello!:1/path",
        out: new url.URL({
            scheme: "scheme",
            host: "!$&'()*+,;=hello!:1",
            path: "/path",
        }),
        roundtrip: "",
    },
    // worst case path, still round trips
    {
        in: "http://host/!$&'()*+,;=:@[hello]",
        out: new url.URL({
            scheme: "http",
            host: "host",
            path: "/!$&'()*+,;=:@[hello]",
            rawPath: "/!$&'()*+,;=:@[hello]",
        }),
        roundtrip: "",
    },
    // golang.org/issue/5684
    {
        in: "http://example.com/oid/[order_id]",
        out: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "/oid/[order_id]",
            rawPath: "/oid/[order_id]",
        }),
        roundtrip: "",
    },
    // golang.org/issue/12200 (colon with empty port)
    {
        in: "http://192.168.0.2:8080/foo",
        out: new url.URL({
            scheme: "http",
            host: "192.168.0.2:8080",
            path: "/foo",
        }),
        roundtrip: "",
    },
    {
        in: "http://192.168.0.2:/foo",
        out: new url.URL({
            scheme: "http",
            host: "192.168.0.2:",
            path: "/foo",
        }),
        roundtrip: "",
    },
    {
        // Malformed IPv6 but still accepted.
        in: "http://2b01:e34:ef40:7730:8e70:5aff:fefe:edac:8080/foo",
        out: new url.URL({
            scheme: "http",
            host: "2b01:e34:ef40:7730:8e70:5aff:fefe:edac:8080",
            path: "/foo",
        }),
        roundtrip: "",
    },
    {
        // Malformed IPv6 but still accepted.
        in: "http://2b01:e34:ef40:7730:8e70:5aff:fefe:edac:/foo",
        out: new url.URL({
            scheme: "http",
            host: "2b01:e34:ef40:7730:8e70:5aff:fefe:edac:",
            path: "/foo",
        }),
        roundtrip: "",
    },
    {
        in: "http://[2b01:e34:ef40:7730:8e70:5aff:fefe:edac]:8080/foo",
        out: new url.URL({
            scheme: "http",
            host: "[2b01:e34:ef40:7730:8e70:5aff:fefe:edac]:8080",
            path: "/foo",
        }),
        roundtrip: "",
    },
    {
        in: "http://[2b01:e34:ef40:7730:8e70:5aff:fefe:edac]:/foo",
        out: new url.URL({
            scheme: "http",
            host: "[2b01:e34:ef40:7730:8e70:5aff:fefe:edac]:",
            path: "/foo",
        }),
        roundtrip: "",
    },
    // golang.org/issue/7991 and golang.org/issue/12719 (non-ascii %-encoded in host)
    {
        in: "http://hello.世界.com/foo",
        out: new url.URL({
            scheme: "http",
            host: "hello.世界.com",
            path: "/foo",
        }),
        roundtrip: "http://hello.%E4%B8%96%E7%95%8C.com/foo",
    },
    {
        in: "http://hello.%e4%b8%96%e7%95%8c.com/foo",
        out: new url.URL({
            scheme: "http",
            host: "hello.世界.com",
            path: "/foo",
        }),
        roundtrip: "http://hello.%E4%B8%96%E7%95%8C.com/foo",
    },
    {
        in: "http://hello.%E4%B8%96%E7%95%8C.com/foo",
        out: new url.URL({
            scheme: "http",
            host: "hello.世界.com",
            path: "/foo",
        }),
        roundtrip: "",
    },
    // golang.org/issue/10433 (path beginning with //)
    {
        in: "http://example.com//foo",
        out: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "//foo",
        }),
        roundtrip: "",
    },
    // test that we can reparse the host names we accept.
    {
        in: "myscheme://authority<\"hi\">/foo",
        out: new url.URL({
            scheme: "myscheme",
            host: "authority<\"hi\">",
            path: "/foo",
        }),
        roundtrip: "",
    },
    // spaces in hosts are disallowed but escaped spaces in IPv6 scope IDs are grudgingly OK.
    // This happens on Windows.
    // golang.org/issue/14002
    {
        in: "tcp://[2020::2020:20:2020:2020%25Windows%20Loves%20Spaces]:2020",
        out: new url.URL({
            scheme: "tcp",
            host: "[2020::2020:20:2020:2020%Windows Loves Spaces]:2020",
        }),
        roundtrip: "",
    },
    // test we can roundtrip magnet url
    // fix issue https://golang.org/issue/20054
    {
        in: "magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn",
        out: new url.URL({
            scheme: "magnet",
            host: "",
            path: "",
            rawQuery: "xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn",
        }),
        roundtrip: "magnet:?xt=urn:btih:c12fe1c06bba254a9dc9f519b335aa7c1367a88a&dn",
    },
    {
        in: "mailto:?subject=hi",
        out: new url.URL({
            scheme: "mailto",
            host: "",
            path: "",
            rawQuery: "subject=hi",
        }),
        roundtrip: "mailto:?subject=hi",
    },
];
m.test("Parse", function (assert) {
    var e_1, _a;
    try {
        for (var urltests_1 = __values(urltests), urltests_1_1 = urltests_1.next(); !urltests_1_1.done; urltests_1_1 = urltests_1.next()) {
            var test_1 = urltests_1_1.value;
            var out = url.URL.parse(test_1.in);
            assert.equal(test_1.out, out, test_1);
        }
    }
    catch (e_1_1) { e_1 = { error: e_1_1 }; }
    finally {
        try {
            if (urltests_1_1 && !urltests_1_1.done && (_a = urltests_1.return)) _a.call(urltests_1);
        }
        finally { if (e_1) throw e_1.error; }
    }
});
var pathThatLooksSchemeRelative = "//not.a.user@not.a.host/just/a/path";
var parseRequestURLTests = [
    { url: "http://foo.com", expectedValid: true },
    { url: "http://foo.com/", expectedValid: true },
    { url: "http://foo.com/path", expectedValid: true },
    { url: "/", expectedValid: true },
    { url: pathThatLooksSchemeRelative, expectedValid: true },
    { url: "//not.a.user@%66%6f%6f.com/just/a/path/also", expectedValid: true },
    { url: "*", expectedValid: true },
    { url: "http://192.168.0.1/", expectedValid: true },
    { url: "http://192.168.0.1:8080/", expectedValid: true },
    { url: "http://[fe80::1]/", expectedValid: true },
    { url: "http://[fe80::1]:8080/", expectedValid: true },
    // Tests exercising RFC 6874 compliance:
    { url: "http://[fe80::1%25en0]/", expectedValid: true },
    { url: "http://[fe80::1%25en0]:8080/", expectedValid: true },
    { url: "http://[fe80::1%25%65%6e%301-._~]/", expectedValid: true },
    { url: "http://[fe80::1%25%65%6e%301-._~]:8080/", expectedValid: true },
    { url: "foo.html", expectedValid: false },
    { url: "../dir/", expectedValid: false },
    { url: " http://foo.com", expectedValid: false },
    { url: "http://192.168.0.%31/", expectedValid: false },
    { url: "http://192.168.0.%31:8080/", expectedValid: false },
    { url: "http://[fe80::%31]/", expectedValid: false },
    { url: "http://[fe80::%31]:8080/", expectedValid: false },
    { url: "http://[fe80::%31%25en0]/", expectedValid: false },
    { url: "http://[fe80::%31%25en0]:8080/", expectedValid: false },
    // These two cases are valid as textual representations as
    // described in RFC 4007, but are not valid as address
    // literals with IPv6 zone identifiers in URIs as described in
    // RFC 6874.
    { url: "http://[fe80::1%en0]/", expectedValid: false },
    { url: "http://[fe80::1%en0]:8080/", expectedValid: false },
];
m.test('RequestURI', function (assert) {
    var e_2, _a;
    try {
        for (var parseRequestURLTests_1 = __values(parseRequestURLTests), parseRequestURLTests_1_1 = parseRequestURLTests_1.next(); !parseRequestURLTests_1_1.done; parseRequestURLTests_1_1 = parseRequestURLTests_1.next()) {
            var test_2 = parseRequestURLTests_1_1.value;
            if (test_2.expectedValid) {
                url.URL.parse(test_2.url, true);
            }
            else {
                try {
                    url.URL.parse(test_2.url, true);
                }
                catch (_) {
                    continue;
                }
                assert.fail(test_2);
            }
        }
    }
    catch (e_2_1) { e_2 = { error: e_2_1 }; }
    finally {
        try {
            if (parseRequestURLTests_1_1 && !parseRequestURLTests_1_1.done && (_a = parseRequestURLTests_1.return)) _a.call(parseRequestURLTests_1);
        }
        finally { if (e_2) throw e_2.error; }
    }
    var u = url.URL.parse(pathThatLooksSchemeRelative, true);
    assert.equal(pathThatLooksSchemeRelative, u.path);
});
var stringURLTests = [
    // No leading slash on path should prepend slash on String() call
    {
        url: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "search",
        }),
        want: "http://www.google.com/search",
    },
    // Relative path with first element containing ":" should be prepended with "./", golang.org/issue/17184
    {
        url: new url.URL({
            path: "this:that",
        }),
        want: "./this:that",
    },
    // Relative path with second element containing ":" should not be prepended with "./"
    {
        url: new url.URL({
            path: "here/this:that",
        }),
        want: "here/this:that",
    },
    // Non-relative path with first element containing ":" should not be prepended with "./"
    {
        url: new url.URL({
            scheme: "http",
            host: "www.google.com",
            path: "this:that",
        }),
        want: "http://www.google.com/this:that",
    },
];
m.test('URLString', function (assert) {
    var e_3, _a, e_4, _b;
    try {
        for (var urltests_2 = __values(urltests), urltests_2_1 = urltests_2.next(); !urltests_2_1.done; urltests_2_1 = urltests_2.next()) {
            var test_3 = urltests_2_1.value;
            var u = url.URL.parse(test_3.in);
            var expected = test_3.roundtrip == '' ? test_3.in : test_3.roundtrip;
            assert.equal(expected, u.toString(), test_3);
        }
    }
    catch (e_3_1) { e_3 = { error: e_3_1 }; }
    finally {
        try {
            if (urltests_2_1 && !urltests_2_1.done && (_a = urltests_2.return)) _a.call(urltests_2);
        }
        finally { if (e_3) throw e_3.error; }
    }
    try {
        for (var stringURLTests_1 = __values(stringURLTests), stringURLTests_1_1 = stringURLTests_1.next(); !stringURLTests_1_1.done; stringURLTests_1_1 = stringURLTests_1.next()) {
            var test_4 = stringURLTests_1_1.value;
            assert.equal(test_4.want, test_4.url.toString());
        }
    }
    catch (e_4_1) { e_4 = { error: e_4_1 }; }
    finally {
        try {
            if (stringURLTests_1_1 && !stringURLTests_1_1.done && (_b = stringURLTests_1.return)) _b.call(stringURLTests_1);
        }
        finally { if (e_4) throw e_4.error; }
    }
});
m.test('URLRedacted', function (assert) {
    var e_5, _a;
    var cases = [
        {
            name: "non-blank Password",
            url: new url.URL({
                scheme: "http",
                host: "host.tld",
                path: "this:that",
                user: { username: "user", password: "password" },
            }),
            want: "http://user:xxxxx@host.tld/this:that",
        },
        {
            name: "blank Password",
            url: new url.URL({
                scheme: "http",
                host: "host.tld",
                path: "this:that",
                user: { username: "user" },
            }),
            want: "http://user@host.tld/this:that",
        },
        {
            name: "nil User",
            url: new url.URL({
                scheme: "http",
                host: "host.tld",
                path: "this:that",
                user: { username: "", password: "password" },
            }),
            want: "http://:xxxxx@host.tld/this:that",
        },
        {
            name: "blank Username, blank Password",
            url: new url.URL({
                scheme: "http",
                host: "host.tld",
                path: "this:that",
            }),
            want: "http://host.tld/this:that",
        },
        {
            name: "empty URL",
            url: new url.URL(),
            want: "",
        },
    ];
    try {
        for (var cases_1 = __values(cases), cases_1_1 = cases_1.next(); !cases_1_1.done; cases_1_1 = cases_1.next()) {
            var test_5 = cases_1_1.value;
            assert.equal(test_5.want, test_5.url.redacted(), test_5);
        }
    }
    catch (e_5_1) { e_5 = { error: e_5_1 }; }
    finally {
        try {
            if (cases_1_1 && !cases_1_1.done && (_a = cases_1.return)) _a.call(cases_1);
        }
        finally { if (e_5) throw e_5.error; }
    }
});
function EscapeError(s) {
    return new url.EscapeError(s);
}
var unescapeTests = [
    {
        in: "",
        out: "",
        err: nil,
    },
    {
        in: "abc",
        out: "abc",
        err: nil,
    },
    {
        in: "1%41",
        out: "1A",
        err: nil,
    },
    {
        in: "1%41%42%43",
        out: "1ABC",
        err: nil,
    },
    {
        in: "%4a",
        out: "J",
        err: nil,
    },
    {
        in: "%6F",
        out: "o",
        err: nil,
    },
    {
        in: "%",
        out: "",
        err: EscapeError("%"),
    },
    {
        in: "%a",
        out: "",
        err: EscapeError("%a"),
    },
    {
        in: "%1",
        out: "",
        err: EscapeError("%1"),
    },
    {
        in: "123%45%6",
        out: "",
        err: EscapeError("%6"),
    },
    {
        in: "%zzzzz",
        out: "",
        err: EscapeError("%zz"),
    },
    {
        in: "a+b",
        out: "a b",
        err: nil,
    },
    {
        in: "a%20b",
        out: "a b",
        err: nil,
    },
];
m.test('Unescape', function (assert) {
    var e_6, _a;
    try {
        for (var unescapeTests_1 = __values(unescapeTests), unescapeTests_1_1 = unescapeTests_1.next(); !unescapeTests_1_1.done; unescapeTests_1_1 = unescapeTests_1.next()) {
            var test_6 = unescapeTests_1_1.value;
            if (test_6.err) {
                var isthrow = false;
                try {
                    url.queryUnescape(test_6.in);
                }
                catch (_) {
                    isthrow = true;
                }
                if (!isthrow) {
                    assert.fail(test_6);
                }
            }
            else {
                var actual = url.queryUnescape(test_6.in);
                assert.equal(test_6.out, actual);
            }
            var input = test_6.in;
            var out = test_6.out;
            if (test_6.in.indexOf("+") != -1) {
                input = input.replaceAll("+", "%20");
                if (test_6.err) {
                    var isthrow = false;
                    try {
                        url.queryUnescape(input);
                    }
                    catch (_) {
                        isthrow = true;
                    }
                    if (!isthrow) {
                        assert.fail(test_6);
                    }
                }
                else {
                    var actual = url.pathUnescape(input);
                    assert.equal(test_6.out, actual);
                    var s = void 0;
                    try {
                        s = url.queryUnescape(test_6.in.replaceAll("+", "XXX"));
                    }
                    catch (_) {
                        continue;
                    }
                    input = test_6.in;
                    out = s.replaceAll("XXX", "+");
                }
            }
            if (test_6.err) {
                var isthrow = false;
                try {
                    url.pathUnescape(input);
                }
                catch (_) {
                    isthrow = true;
                }
                if (!isthrow) {
                    assert.fail(test_6);
                }
            }
            else {
                var actual = url.pathUnescape(input);
                assert.equal(out, actual);
            }
        }
    }
    catch (e_6_1) { e_6 = { error: e_6_1 }; }
    finally {
        try {
            if (unescapeTests_1_1 && !unescapeTests_1_1.done && (_a = unescapeTests_1.return)) _a.call(unescapeTests_1);
        }
        finally { if (e_6) throw e_6.error; }
    }
});
var queryEscapeTests = [
    {
        in: "",
        out: "",
        err: nil,
    },
    {
        in: "abc",
        out: "abc",
        err: nil,
    },
    {
        in: "one two",
        out: "one+two",
        err: nil,
    },
    {
        in: "10%",
        out: "10%25",
        err: nil,
    },
    {
        in: " ?&=#+%!<>#\"{}|\\^[]`☺\t:/@$'()*,;",
        out: "+%3F%26%3D%23%2B%25%21%3C%3E%23%22%7B%7D%7C%5C%5E%5B%5D%60%E2%98%BA%09%3A%2F%40%24%27%28%29%2A%2C%3B",
        err: nil,
    },
];
m.test('QueryEscape', function (assert) {
    var e_7, _a;
    try {
        for (var queryEscapeTests_1 = __values(queryEscapeTests), queryEscapeTests_1_1 = queryEscapeTests_1.next(); !queryEscapeTests_1_1.done; queryEscapeTests_1_1 = queryEscapeTests_1.next()) {
            var test_7 = queryEscapeTests_1_1.value;
            var actual = url.queryEscape(test_7.in);
            assert.equal(test_7.out, actual);
            var roundtrip = url.queryUnescape(actual);
            assert.equal(test_7.in, roundtrip);
        }
    }
    catch (e_7_1) { e_7 = { error: e_7_1 }; }
    finally {
        try {
            if (queryEscapeTests_1_1 && !queryEscapeTests_1_1.done && (_a = queryEscapeTests_1.return)) _a.call(queryEscapeTests_1);
        }
        finally { if (e_7) throw e_7.error; }
    }
});
var pathEscapeTests = [
    {
        in: "",
        out: "",
        err: nil,
    },
    {
        in: "abc",
        out: "abc",
        err: nil,
    },
    {
        in: "abc+def",
        out: "abc+def",
        err: nil,
    },
    {
        in: "a/b",
        out: "a%2Fb",
        err: nil,
    },
    {
        in: "one two",
        out: "one%20two",
        err: nil,
    },
    {
        in: "10%",
        out: "10%25",
        err: nil,
    },
    {
        in: " ?&=#+%!<>#\"{}|\\^[]`☺\t:/@$'()*,;",
        out: "%20%3F&=%23+%25%21%3C%3E%23%22%7B%7D%7C%5C%5E%5B%5D%60%E2%98%BA%09:%2F@$%27%28%29%2A%2C%3B",
        err: nil,
    },
];
m.test('PathEscape', function (assert) {
    var e_8, _a;
    try {
        for (var pathEscapeTests_1 = __values(pathEscapeTests), pathEscapeTests_1_1 = pathEscapeTests_1.next(); !pathEscapeTests_1_1.done; pathEscapeTests_1_1 = pathEscapeTests_1.next()) {
            var test_8 = pathEscapeTests_1_1.value;
            var actual = url.pathEscape(test_8.in);
            assert.equal(test_8.out, actual);
        }
    }
    catch (e_8_1) { e_8 = { error: e_8_1 }; }
    finally {
        try {
            if (pathEscapeTests_1_1 && !pathEscapeTests_1_1.done && (_a = pathEscapeTests_1.return)) _a.call(pathEscapeTests_1);
        }
        finally { if (e_8) throw e_8.error; }
    }
});
var encodeQueryTests = [
    { m: new url.Values(), expected: "" },
    { m: new url.Values({ "q": ["puppies"], "oe": ["utf8"] }), expected: "oe=utf8&q=puppies" },
    { m: new url.Values({ "q": ["dogs", "&", "7"] }), expected: "q=dogs&q=%26&q=7" },
    {
        m: new url.Values({
            "a": ["a1", "a2", "a3"],
            "b": ["b1", "b2", "b3"],
            "c": ["c1", "c2", "c3"],
        }), expected: "a=a1&a=a2&a=a3&b=b1&b=b2&b=b3&c=c1&c=c2&c=c3"
    },
];
m.test('EncodeQuery', function (assert) {
    var e_9, _a;
    try {
        for (var encodeQueryTests_1 = __values(encodeQueryTests), encodeQueryTests_1_1 = encodeQueryTests_1.next(); !encodeQueryTests_1_1.done; encodeQueryTests_1_1 = encodeQueryTests_1.next()) {
            var test_9 = encodeQueryTests_1_1.value;
            assert.equal(test_9.expected, test_9.m.encode());
        }
    }
    catch (e_9_1) { e_9 = { error: e_9_1 }; }
    finally {
        try {
            if (encodeQueryTests_1_1 && !encodeQueryTests_1_1.done && (_a = encodeQueryTests_1.return)) _a.call(encodeQueryTests_1);
        }
        finally { if (e_9) throw e_9.error; }
    }
});
var resolvePathTests = [
    { base: "a/b", ref: ".", expected: "/a/" },
    { base: "a/b", ref: "c", expected: "/a/c" },
    { base: "a/b", ref: "..", expected: "/" },
    { base: "a/", ref: "..", expected: "/" },
    { base: "a/", ref: "../..", expected: "/" },
    { base: "a/b/c", ref: "..", expected: "/a/" },
    { base: "a/b/c", ref: "../d", expected: "/a/d" },
    { base: "a/b/c", ref: ".././d", expected: "/a/d" },
    { base: "a/b", ref: "./..", expected: "/" },
    { base: "a/./b", ref: ".", expected: "/a/" },
    { base: "a/../", ref: ".", expected: "/" },
    { base: "a/.././b", ref: "c", expected: "/c" },
];
m.test('ResolvePath', function (assert) {
    var e_10, _a;
    try {
        for (var resolvePathTests_1 = __values(resolvePathTests), resolvePathTests_1_1 = resolvePathTests_1.next(); !resolvePathTests_1_1.done; resolvePathTests_1_1 = resolvePathTests_1.next()) {
            var test_10 = resolvePathTests_1_1.value;
            var got = url.resolvePath(test_10.base, test_10.ref);
            assert.equal(test_10.expected, got);
        }
    }
    catch (e_10_1) { e_10 = { error: e_10_1 }; }
    finally {
        try {
            if (resolvePathTests_1_1 && !resolvePathTests_1_1.done && (_a = resolvePathTests_1.return)) _a.call(resolvePathTests_1);
        }
        finally { if (e_10) throw e_10.error; }
    }
});
var resolveReferenceTests = [
    // Absolute URL references
    { base: "http://foo.com?a=b", rel: "https://bar.com/", expected: "https://bar.com/" },
    { base: "http://foo.com/", rel: "https://bar.com/?a=b", expected: "https://bar.com/?a=b" },
    { base: "http://foo.com/", rel: "https://bar.com/?", expected: "https://bar.com/?" },
    { base: "http://foo.com/bar", rel: "mailto:foo@example.com", expected: "mailto:foo@example.com" },
    // Path-absolute references
    { base: "http://foo.com/bar", rel: "/baz", expected: "http://foo.com/baz" },
    { base: "http://foo.com/bar?a=b#f", rel: "/baz", expected: "http://foo.com/baz" },
    { base: "http://foo.com/bar?a=b", rel: "/baz?", expected: "http://foo.com/baz?" },
    { base: "http://foo.com/bar?a=b", rel: "/baz?c=d", expected: "http://foo.com/baz?c=d" },
    // Multiple slashes
    { base: "http://foo.com/bar", rel: "http://foo.com//baz", expected: "http://foo.com//baz" },
    { base: "http://foo.com/bar", rel: "http://foo.com///baz/quux", expected: "http://foo.com///baz/quux" },
    // Scheme-relative
    { base: "https://foo.com/bar?a=b", rel: "//bar.com/quux", expected: "https://bar.com/quux" },
    // Path-relative references:
    // ... current directory
    { base: "http://foo.com", rel: ".", expected: "http://foo.com/" },
    { base: "http://foo.com/bar", rel: ".", expected: "http://foo.com/" },
    { base: "http://foo.com/bar/", rel: ".", expected: "http://foo.com/bar/" },
    // ... going down
    { base: "http://foo.com", rel: "bar", expected: "http://foo.com/bar" },
    { base: "http://foo.com/", rel: "bar", expected: "http://foo.com/bar" },
    { base: "http://foo.com/bar/baz", rel: "quux", expected: "http://foo.com/bar/quux" },
    // ... going up
    { base: "http://foo.com/bar/baz", rel: "../quux", expected: "http://foo.com/quux" },
    { base: "http://foo.com/bar/baz", rel: "../../../../../quux", expected: "http://foo.com/quux" },
    { base: "http://foo.com/bar", rel: "..", expected: "http://foo.com/" },
    { base: "http://foo.com/bar/baz", rel: "./..", expected: "http://foo.com/" },
    // ".." in the middle (issue 3560)
    { base: "http://foo.com/bar/baz", rel: "quux/dotdot/../tail", expected: "http://foo.com/bar/quux/tail" },
    { base: "http://foo.com/bar/baz", rel: "quux/./dotdot/../tail", expected: "http://foo.com/bar/quux/tail" },
    { base: "http://foo.com/bar/baz", rel: "quux/./dotdot/.././tail", expected: "http://foo.com/bar/quux/tail" },
    { base: "http://foo.com/bar/baz", rel: "quux/./dotdot/./../tail", expected: "http://foo.com/bar/quux/tail" },
    { base: "http://foo.com/bar/baz", rel: "quux/./dotdot/dotdot/././../../tail", expected: "http://foo.com/bar/quux/tail" },
    { base: "http://foo.com/bar/baz", rel: "quux/./dotdot/dotdot/./.././../tail", expected: "http://foo.com/bar/quux/tail" },
    { base: "http://foo.com/bar/baz", rel: "quux/./dotdot/dotdot/dotdot/./../../.././././tail", expected: "http://foo.com/bar/quux/tail" },
    { base: "http://foo.com/bar/baz", rel: "quux/./dotdot/../dotdot/../dot/./tail/..", expected: "http://foo.com/bar/quux/dot/" },
    // Remove any dot-segments prior to forming the target URI.
    // https://datatracker.ietf.org/doc/html/rfc3986#section-5.2.4
    { base: "http://foo.com/dot/./dotdot/../foo/bar", rel: "../baz", expected: "http://foo.com/dot/baz" },
    // Triple dot isn't special
    { base: "http://foo.com/bar", rel: "...", expected: "http://foo.com/..." },
    // Fragment
    { base: "http://foo.com/bar", rel: ".#frag", expected: "http://foo.com/#frag" },
    { base: "http://example.org/", rel: "#!$&%27()*+,;=", expected: "http://example.org/#!$&%27()*+,;=" },
    // Paths with escaping (issue 16947).
    { base: "http://foo.com/foo%2fbar/", rel: "../baz", expected: "http://foo.com/baz" },
    { base: "http://foo.com/1/2%2f/3%2f4/5", rel: "../../a/b/c", expected: "http://foo.com/1/a/b/c" },
    { base: "http://foo.com/1/2/3", rel: "./a%2f../../b/..%2fc", expected: "http://foo.com/1/2/b/..%2fc" },
    { base: "http://foo.com/1/2%2f/3%2f4/5", rel: "./a%2f../b/../c", expected: "http://foo.com/1/2%2f/3%2f4/a%2f../c" },
    { base: "http://foo.com/foo%20bar/", rel: "../baz", expected: "http://foo.com/baz" },
    { base: "http://foo.com/foo", rel: "../bar%2fbaz", expected: "http://foo.com/bar%2fbaz" },
    { base: "http://foo.com/foo%2dbar/", rel: "./baz-quux", expected: "http://foo.com/foo%2dbar/baz-quux" },
    // RFC 3986: Normal Examples
    // https://datatracker.ietf.org/doc/html/rfc3986#section-5.4.1
    { base: "http://a/b/c/d;p?q", rel: "g:h", expected: "g:h" },
    { base: "http://a/b/c/d;p?q", rel: "g", expected: "http://a/b/c/g" },
    { base: "http://a/b/c/d;p?q", rel: "./g", expected: "http://a/b/c/g" },
    { base: "http://a/b/c/d;p?q", rel: "g/", expected: "http://a/b/c/g/" },
    { base: "http://a/b/c/d;p?q", rel: "/g", expected: "http://a/g" },
    { base: "http://a/b/c/d;p?q", rel: "//g", expected: "http://g" },
    { base: "http://a/b/c/d;p?q", rel: "?y", expected: "http://a/b/c/d;p?y" },
    { base: "http://a/b/c/d;p?q", rel: "g?y", expected: "http://a/b/c/g?y" },
    { base: "http://a/b/c/d;p?q", rel: "#s", expected: "http://a/b/c/d;p?q#s" },
    { base: "http://a/b/c/d;p?q", rel: "g#s", expected: "http://a/b/c/g#s" },
    { base: "http://a/b/c/d;p?q", rel: "g?y#s", expected: "http://a/b/c/g?y#s" },
    { base: "http://a/b/c/d;p?q", rel: ";x", expected: "http://a/b/c/;x" },
    { base: "http://a/b/c/d;p?q", rel: "g;x", expected: "http://a/b/c/g;x" },
    { base: "http://a/b/c/d;p?q", rel: "g;x?y#s", expected: "http://a/b/c/g;x?y#s" },
    { base: "http://a/b/c/d;p?q", rel: "", expected: "http://a/b/c/d;p?q" },
    { base: "http://a/b/c/d;p?q", rel: ".", expected: "http://a/b/c/" },
    { base: "http://a/b/c/d;p?q", rel: "./", expected: "http://a/b/c/" },
    { base: "http://a/b/c/d;p?q", rel: "..", expected: "http://a/b/" },
    { base: "http://a/b/c/d;p?q", rel: "../", expected: "http://a/b/" },
    { base: "http://a/b/c/d;p?q", rel: "../g", expected: "http://a/b/g" },
    { base: "http://a/b/c/d;p?q", rel: "../..", expected: "http://a/" },
    { base: "http://a/b/c/d;p?q", rel: "../../", expected: "http://a/" },
    { base: "http://a/b/c/d;p?q", rel: "../../g", expected: "http://a/g" },
    // RFC 3986: Abnormal Examples
    // https://datatracker.ietf.org/doc/html/rfc3986#section-5.4.2
    { base: "http://a/b/c/d;p?q", rel: "../../../g", expected: "http://a/g" },
    { base: "http://a/b/c/d;p?q", rel: "../../../../g", expected: "http://a/g" },
    { base: "http://a/b/c/d;p?q", rel: "/./g", expected: "http://a/g" },
    { base: "http://a/b/c/d;p?q", rel: "/../g", expected: "http://a/g" },
    { base: "http://a/b/c/d;p?q", rel: "g.", expected: "http://a/b/c/g." },
    { base: "http://a/b/c/d;p?q", rel: ".g", expected: "http://a/b/c/.g" },
    { base: "http://a/b/c/d;p?q", rel: "g..", expected: "http://a/b/c/g.." },
    { base: "http://a/b/c/d;p?q", rel: "..g", expected: "http://a/b/c/..g" },
    { base: "http://a/b/c/d;p?q", rel: "./../g", expected: "http://a/b/g" },
    { base: "http://a/b/c/d;p?q", rel: "./g/.", expected: "http://a/b/c/g/" },
    { base: "http://a/b/c/d;p?q", rel: "g/./h", expected: "http://a/b/c/g/h" },
    { base: "http://a/b/c/d;p?q", rel: "g/../h", expected: "http://a/b/c/h" },
    { base: "http://a/b/c/d;p?q", rel: "g;x=1/./y", expected: "http://a/b/c/g;x=1/y" },
    { base: "http://a/b/c/d;p?q", rel: "g;x=1/../y", expected: "http://a/b/c/y" },
    { base: "http://a/b/c/d;p?q", rel: "g?y/./x", expected: "http://a/b/c/g?y/./x" },
    { base: "http://a/b/c/d;p?q", rel: "g?y/../x", expected: "http://a/b/c/g?y/../x" },
    { base: "http://a/b/c/d;p?q", rel: "g#s/./x", expected: "http://a/b/c/g#s/./x" },
    { base: "http://a/b/c/d;p?q", rel: "g#s/../x", expected: "http://a/b/c/g#s/../x" },
    // Extras.
    { base: "https://a/b/c/d;p?q", rel: "//g?q", expected: "https://g?q" },
    { base: "https://a/b/c/d;p?q", rel: "//g#s", expected: "https://g#s" },
    { base: "https://a/b/c/d;p?q", rel: "//g/d/e/f?y#s", expected: "https://g/d/e/f?y#s" },
    { base: "https://a/b/c/d;p#s", rel: "?y", expected: "https://a/b/c/d;p?y" },
    { base: "https://a/b/c/d;p?q#s", rel: "?y", expected: "https://a/b/c/d;p?y" },
    // Empty path and query but with ForceQuery (issue 46033).
    { base: "https://a/b/c/d;p?q#s", rel: "?", expected: "https://a/b/c/d;p?" },
];
m.test('ResolveReference', function (assert) {
    var e_11, _a;
    var mustParse = url.URL.parse;
    var opaque = new url.URL({ scheme: "scheme", opaque: "opaque" });
    try {
        for (var resolveReferenceTests_1 = __values(resolveReferenceTests), resolveReferenceTests_1_1 = resolveReferenceTests_1.next(); !resolveReferenceTests_1_1.done; resolveReferenceTests_1_1 = resolveReferenceTests_1.next()) {
            var test_11 = resolveReferenceTests_1_1.value;
            var base = mustParse(test_11.base);
            var rel = mustParse(test_11.rel);
            var url_1 = base.resolveReference(rel);
            assert.equal(test_11.expected, url_1.toString(), test_11);
            // Ensure that new instances are returned.
            assert.false(base == url_1, test_11);
            // Test the convenience wrapper too.
            url_1 = base.resolveReference(test_11.rel);
            assert.equal(test_11.expected, url_1.toString(), test_11);
            // Ensure Opaque resets the URL.
            url_1 = base.resolveReference(opaque);
            assert.equal(opaque, url_1, test_11);
        }
    }
    catch (e_11_1) { e_11 = { error: e_11_1 }; }
    finally {
        try {
            if (resolveReferenceTests_1_1 && !resolveReferenceTests_1_1.done && (_a = resolveReferenceTests_1.return)) _a.call(resolveReferenceTests_1);
        }
        finally { if (e_11) throw e_11.error; }
    }
});
m.test("QueryValues", function (assert) {
    var u = url.URL.parse("http://x.com?foo=bar&bar=1&bar=2&baz");
    var v = u.query();
    assert.equal("bar", v.get("foo"));
    // Case sensitive:
    assert.equal(undefined, v.get("Foo"));
    assert.equal("1", v.get("bar"));
    assert.equal("", v.get("baz"));
    assert.true(v.has("foo"));
    assert.true(v.has("bar"));
    assert.true(v.has("baz"));
    assert.false(v.has("noexist"));
    v.remove("bar");
    assert.equal(undefined, v.get("bar"));
});
var parseTests = [
    {
        query: "a=1",
        out: new url.Values({ "a": ["1"] }),
        ok: true,
    },
    {
        query: "a=1&b=2",
        out: new url.Values({ "a": ["1"], "b": ["2"] }),
        ok: true,
    },
    {
        query: "a=1&a=2&a=banana",
        out: new url.Values({ "a": ["1", "2", "banana"] }),
        ok: true,
    },
    {
        query: "ascii=%3Ckey%3A+0x90%3E",
        out: new url.Values({ "ascii": ["<key: 0x90>"] }),
        ok: true,
    }, {
        query: "a=1;b=2",
        out: new url.Values(),
        ok: false,
    }, {
        query: "a;b=1",
        out: new url.Values(),
        ok: false,
    }, {
        query: "a=%3B",
        out: new url.Values({ "a": [";"] }),
        ok: true,
    },
    {
        query: "a%3Bb=1",
        out: new url.Values({ "a;b": ["1"] }),
        ok: true,
    },
    {
        query: "a=1&a=2;a=banana",
        out: new url.Values({ "a": ["1"] }),
        ok: false,
    },
    {
        query: "a;b&c=1",
        out: new url.Values({ "c": ["1"] }),
        ok: false,
    },
    {
        query: "a=1&b=2;a=3&c=4",
        out: new url.Values({ "a": ["1"], "c": ["4"] }),
        ok: false,
    },
    {
        query: "a=1&b=2;c=3",
        out: new url.Values({ "a": ["1"] }),
        ok: false,
    },
    {
        query: ";",
        out: new url.Values(),
        ok: false,
    },
    {
        query: "a=1;",
        out: new url.Values(),
        ok: false,
    },
    {
        query: "a=1&;",
        out: new url.Values({ "a": ["1"] }),
        ok: false,
    },
    {
        query: ";a=1&b=2",
        out: new url.Values({ "b": ["2"] }),
        ok: false,
    },
    {
        query: "a=1&b=2;",
        out: new url.Values({ "a": ["1"] }),
        ok: false,
    },
];
m.test('ParseQuery', function (assert) {
    var e_12, _a;
    var form;
    try {
        for (var parseTests_1 = __values(parseTests), parseTests_1_1 = parseTests_1.next(); !parseTests_1_1.done; parseTests_1_1 = parseTests_1.next()) {
            var test_12 = parseTests_1_1.value;
            if (test_12.ok) {
                form = url.Values.parse(test_12.query);
            }
            else {
                var isthrow = false;
                try {
                    url.Values.parse(test_12.query);
                }
                catch (_) {
                    isthrow = true;
                }
                assert.true(isthrow, test_12);
                form = url.Values.parse(test_12.query, true);
            }
            for (var key in test_12.out.values) {
                if (Object.prototype.hasOwnProperty.call(test_12.out.values, key)) {
                    var evs = test_12.out.values[key];
                    var vs = form.values[key];
                    assert.true(vs);
                    assert.equal(evs.length, vs.length, test_12);
                    for (var i = 0; i < evs.length; i++) {
                        assert.equal(evs[i], vs[i]);
                    }
                }
            }
        }
    }
    catch (e_12_1) { e_12 = { error: e_12_1 }; }
    finally {
        try {
            if (parseTests_1_1 && !parseTests_1_1.done && (_a = parseTests_1.return)) _a.call(parseTests_1);
        }
        finally { if (e_12) throw e_12.error; }
    }
});
var requritests = [
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "",
        }),
        out: "/",
    },
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "/a b",
        }),
        out: "/a%20b",
    },
    // golang.org/issue/4860 variant 1
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            opaque: "/%2F/%2F/",
        }),
        out: "/%2F/%2F/",
    },
    // golang.org/issue/4860 variant 2
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            opaque: "//other.example.com/%2F/%2F/",
        }),
        out: "http://other.example.com/%2F/%2F/",
    },
    // better fix for issue 4860
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "/////",
            rawPath: "/%2F/%2F/",
        }),
        out: "/%2F/%2F/",
    },
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "/////",
            rawPath: "/WRONG/", // ignored because doesn't match Path
        }),
        out: "/////",
    },
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "/a b",
            rawQuery: "q=go+language",
        }),
        out: "/a%20b?q=go+language",
    },
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "/a b",
            rawPath: "/a b",
            rawQuery: "q=go+language",
        }),
        out: "/a%20b?q=go+language",
    },
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "/a?b",
            rawPath: "/a?b",
            rawQuery: "q=go+language",
        }),
        out: "/a%3Fb?q=go+language",
    },
    {
        url: new url.URL({
            scheme: "myschema",
            opaque: "opaque",
        }),
        out: "opaque",
    },
    {
        url: new url.URL({
            scheme: "myschema",
            opaque: "opaque",
            rawQuery: "q=go+language",
        }),
        out: "opaque?q=go+language",
    },
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "//foo",
        }),
        out: "//foo",
    },
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "/foo",
            forceQuery: true,
        }),
        out: "/foo?",
    },
];
m.test('URL.RequestURI', function (assert) {
    var e_13, _a;
    try {
        for (var requritests_1 = __values(requritests), requritests_1_1 = requritests_1.next(); !requritests_1_1.done; requritests_1_1 = requritests_1.next()) {
            var test_13 = requritests_1_1.value;
            var s = test_13.url.requestURI();
            assert.equal(test_13.out, s);
        }
    }
    catch (e_13_1) { e_13 = { error: e_13_1 }; }
    finally {
        try {
            if (requritests_1_1 && !requritests_1_1.done && (_a = requritests_1.return)) _a.call(requritests_1);
        }
        finally { if (e_13) throw e_13.error; }
    }
});
m.test('ParseFailure', function (assert) {
    var err;
    try {
        url.Values.parse("%gh&%ij");
    }
    catch (e) {
        err = e;
    }
    assert.true(err, "not throw");
    var errStr = "".concat(err === null || err === void 0 ? void 0 : err.message);
    assert.true(errStr.indexOf("%gh") >= 0);
});
m.test('ParseErrors', function (assert) {
    var e_14, _a;
    var tests = [
        { in: "http://[::1]", wantErr: false },
        { in: "http://[::1]:80", wantErr: false },
        { in: "http://[::1]:namedport", wantErr: true },
        { in: "http://x:namedport", wantErr: true },
        { in: "http://[::1]/", wantErr: false },
        { in: "http://[::1]a", wantErr: true },
        { in: "http://[::1]%23", wantErr: true },
        { in: "http://[::1%25en0]", wantErr: false },
        { in: "http://[::1]:", wantErr: false },
        { in: "http://x:", wantErr: false },
        { in: "http://[::1]:%38%30", wantErr: true },
        { in: "http://[::1%25%41]", wantErr: false },
        { in: "http://[%10::1]", wantErr: true },
        { in: "http://[::1]/%48", wantErr: false },
        { in: "http://%41:8080/", wantErr: true },
        { in: "mysql://x@y(z:123)/foo", wantErr: true },
        { in: "mysql://x@y(1.2.3.4:123)/foo", wantErr: true },
        { in: " http://foo.com", wantErr: true },
        { in: "ht tp://foo.com", wantErr: true },
        { in: "ahttp://foo.com", wantErr: false },
        { in: "1http://foo.com", wantErr: true },
        { in: "http://[]%20%48%54%54%50%2f%31%2e%31%0a%4d%79%48%65%61%64%65%72%3a%20%31%32%33%0a%0a/", wantErr: true },
        { in: "http://a b.com/", wantErr: true },
        { in: "cache_object://foo", wantErr: true },
        { in: "cache_object:foo", wantErr: true },
        { in: "cache_object:foo/bar", wantErr: true },
        { in: "cache_object/:foo/bar", wantErr: false },
    ];
    try {
        for (var tests_1 = __values(tests), tests_1_1 = tests_1.next(); !tests_1_1.done; tests_1_1 = tests_1.next()) {
            var test_14 = tests_1_1.value;
            if (test_14.wantErr) {
                var isthrow = false;
                try {
                    url.URL.parse(test_14.in);
                }
                catch (_) {
                    isthrow = true;
                }
                if (!isthrow) {
                    assert.fail("not throw", test_14);
                }
            }
            else {
                url.URL.parse(test_14.in);
            }
        }
    }
    catch (e_14_1) { e_14 = { error: e_14_1 }; }
    finally {
        try {
            if (tests_1_1 && !tests_1_1.done && (_a = tests_1.return)) _a.call(tests_1);
        }
        finally { if (e_14) throw e_14.error; }
    }
});
// Issue 11202
m.test('StarRequest', function (assert) {
    var u = url.URL.parse("*");
    assert.equal("*", u.requestURI());
});
var shouldEscapeTests = [
    // Unreserved characters (§2.3)
    { in: 'a'.charCodeAt(0), mode: url.encodePath, escape: false },
    { in: 'a'.charCodeAt(0), mode: url.encodeUserPassword, escape: false },
    { in: 'a'.charCodeAt(0), mode: url.encodeQueryComponent, escape: false },
    { in: 'a'.charCodeAt(0), mode: url.encodeFragment, escape: false },
    { in: 'a'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: 'z'.charCodeAt(0), mode: url.encodePath, escape: false },
    { in: 'A'.charCodeAt(0), mode: url.encodePath, escape: false },
    { in: 'Z'.charCodeAt(0), mode: url.encodePath, escape: false },
    { in: '0'.charCodeAt(0), mode: url.encodePath, escape: false },
    { in: '9'.charCodeAt(0), mode: url.encodePath, escape: false },
    { in: '-'.charCodeAt(0), mode: url.encodePath, escape: false },
    { in: '-'.charCodeAt(0), mode: url.encodeUserPassword, escape: false },
    { in: '-'.charCodeAt(0), mode: url.encodeQueryComponent, escape: false },
    { in: '-'.charCodeAt(0), mode: url.encodeFragment, escape: false },
    { in: '.'.charCodeAt(0), mode: url.encodePath, escape: false },
    { in: '_'.charCodeAt(0), mode: url.encodePath, escape: false },
    { in: '~'.charCodeAt(0), mode: url.encodePath, escape: false },
    // User information (§3.2.1)
    { in: ':'.charCodeAt(0), mode: url.encodeUserPassword, escape: true },
    { in: '/'.charCodeAt(0), mode: url.encodeUserPassword, escape: true },
    { in: '?'.charCodeAt(0), mode: url.encodeUserPassword, escape: true },
    { in: '@'.charCodeAt(0), mode: url.encodeUserPassword, escape: true },
    { in: '$'.charCodeAt(0), mode: url.encodeUserPassword, escape: false },
    { in: '&'.charCodeAt(0), mode: url.encodeUserPassword, escape: false },
    { in: '+'.charCodeAt(0), mode: url.encodeUserPassword, escape: false },
    { in: ','.charCodeAt(0), mode: url.encodeUserPassword, escape: false },
    { in: ';'.charCodeAt(0), mode: url.encodeUserPassword, escape: false },
    { in: '='.charCodeAt(0), mode: url.encodeUserPassword, escape: false },
    // Host (IP address, IPv6 address, registered name, port suffix; §3.2.2)
    { in: '!'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '$'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '&'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '\''.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '('.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: ')'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '*'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '+'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: ','.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: ';'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '='.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: ':'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '['.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: ']'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '0'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '9'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: 'A'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: 'z'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '_'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '-'.charCodeAt(0), mode: url.encodeHost, escape: false },
    { in: '.'.charCodeAt(0), mode: url.encodeHost, escape: false },
];
m.test('ShouldEscape', function (assert) {
    var e_15, _a;
    try {
        for (var shouldEscapeTests_1 = __values(shouldEscapeTests), shouldEscapeTests_1_1 = shouldEscapeTests_1.next(); !shouldEscapeTests_1_1.done; shouldEscapeTests_1_1 = shouldEscapeTests_1.next()) {
            var test_15 = shouldEscapeTests_1_1.value;
            assert.equal(test_15.escape, url.shouldEscape(test_15.in, test_15.mode));
        }
    }
    catch (e_15_1) { e_15 = { error: e_15_1 }; }
    finally {
        try {
            if (shouldEscapeTests_1_1 && !shouldEscapeTests_1_1.done && (_a = shouldEscapeTests_1.return)) _a.call(shouldEscapeTests_1);
        }
        finally { if (e_15) throw e_15.error; }
    }
});
m.test('URLHostnameAndPort', function (assert) {
    var e_16, _a;
    var tests = [
        { in: "foo.com:80", host: "foo.com", port: "80" },
        { in: "foo.com", host: "foo.com", port: "" },
        { in: "foo.com:", host: "foo.com", port: "" },
        { in: "FOO.COM", host: "FOO.COM", port: "" },
        { in: "1.2.3.4", host: "1.2.3.4", port: "" },
        { in: "1.2.3.4:80", host: "1.2.3.4", port: "80" },
        { in: "[1:2:3:4]", host: "1:2:3:4", port: "" },
        { in: "[1:2:3:4]:80", host: "1:2:3:4", port: "80" },
        { in: "[::1]:80", host: "::1", port: "80" },
        { in: "[::1]", host: "::1", port: "" },
        { in: "[::1]:", host: "::1", port: "" },
        { in: "localhost", host: "localhost", port: "" },
        { in: "localhost:443", host: "localhost", port: "443" },
        { in: "some.super.long.domain.example.org:8080", host: "some.super.long.domain.example.org", port: "8080" },
        { in: "[2001:0db8:85a3:0000:0000:8a2e:0370:7334]:17000", host: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", port: "17000" },
        { in: "[2001:0db8:85a3:0000:0000:8a2e:0370:7334]", host: "2001:0db8:85a3:0000:0000:8a2e:0370:7334", port: "" },
        // Ensure that even when not valid, Host is one of "Hostname",
        // "Hostname:Port", "[Hostname]" or "[Hostname]:Port".
        // See https://golang.org/issue/29098.
        { in: "[google.com]:80", host: "google.com", port: "80" },
        { in: "google.com]:80", host: "google.com]", port: "80" },
        { in: "google.com:80_invalid_port", host: "google.com:80_invalid_port", port: "" },
        { in: "[::1]extra]:80", host: "::1]extra", port: "80" },
        { in: "google.com]extra:extra", host: "google.com]extra:extra", port: "" },
    ];
    try {
        for (var tests_2 = __values(tests), tests_2_1 = tests_2.next(); !tests_2_1.done; tests_2_1 = tests_2.next()) {
            var test_16 = tests_2_1.value;
            var u = new url.URL({ host: test_16.in });
            assert.equal(test_16.host, u.hostname(), test_16);
            assert.equal(test_16.port, u.port(), test_16, u);
        }
    }
    catch (e_16_1) { e_16 = { error: e_16_1 }; }
    finally {
        try {
            if (tests_2_1 && !tests_2_1.done && (_a = tests_2.return)) _a.call(tests_2);
        }
        finally { if (e_16) throw e_16.error; }
    }
});
m.test('InvalidUserPassword', function (assert) {
    try {
        url.URL.parse("http://user^:passwo^rd@foo.com/");
    }
    catch (e) {
        assert.true("".concat(e).indexOf("net/url: invalid userinfo") >= 0);
        return;
    }
    assert.fail("not throw");
});
m.test('JoinPath', function (assert) {
    var e_17, _a;
    var _b, _c;
    var tests = [
        {
            base: "https://go.googlesource.com",
            elem: ["go"],
            out: "https://go.googlesource.com/go",
        },
        {
            base: "https://go.googlesource.com/a/b/c",
            elem: ["../../../go"],
            out: "https://go.googlesource.com/go",
        },
        {
            base: "https://go.googlesource.com/",
            elem: ["../go"],
            out: "https://go.googlesource.com/go",
        },
        {
            base: "https://go.googlesource.com",
            elem: ["../go"],
            out: "https://go.googlesource.com/go",
        },
        {
            base: "https://go.googlesource.com",
            elem: ["../go", "../../go", "../../../go"],
            out: "https://go.googlesource.com/go",
        },
        {
            base: "https://go.googlesource.com/../go",
            elem: nil,
            out: "https://go.googlesource.com/go",
        },
        {
            base: "https://go.googlesource.com/",
            elem: ["./go"],
            out: "https://go.googlesource.com/go",
        },
        {
            base: "https://go.googlesource.com//",
            elem: ["/go"],
            out: "https://go.googlesource.com/go",
        },
        {
            base: "https://go.googlesource.com//",
            elem: ["/go", "a", "b", "c"],
            out: "https://go.googlesource.com/go/a/b/c",
        },
        {
            base: "http://[fe80::1%en0]:8080/",
            elem: ["/go"],
            out: '',
        },
        {
            base: "https://go.googlesource.com",
            elem: ["go/"],
            out: "https://go.googlesource.com/go/",
        },
        {
            base: "https://go.googlesource.com",
            elem: ["go//"],
            out: "https://go.googlesource.com/go/",
        },
        {
            base: "https://go.googlesource.com",
            elem: nil,
            out: "https://go.googlesource.com/",
        },
        {
            base: "https://go.googlesource.com/",
            elem: nil,
            out: "https://go.googlesource.com/",
        },
        {
            base: "https://go.googlesource.com/a%2fb",
            elem: ["c"],
            out: "https://go.googlesource.com/a%2fb/c",
        },
        {
            base: "https://go.googlesource.com/a%2fb",
            elem: ["c%2fd"],
            out: "https://go.googlesource.com/a%2fb/c%2fd",
        },
        {
            base: "https://go.googlesource.com/a/b",
            elem: ["/go"],
            out: "https://go.googlesource.com/a/b/go",
        },
        {
            base: "/",
            elem: nil,
            out: "/",
        },
        {
            base: "a",
            elem: nil,
            out: "a",
        },
        {
            base: "a",
            elem: ["b"],
            out: "a/b",
        },
        {
            base: "a",
            elem: ["../b"],
            out: "b",
        },
        {
            base: "a",
            elem: ["../../b"],
            out: "b",
        },
        {
            base: "",
            elem: ["a"],
            out: "a",
        },
        {
            base: "",
            elem: ["../a"],
            out: "a",
        },
    ];
    try {
        for (var tests_3 = __values(tests), tests_3_1 = tests_3.next(); !tests_3_1.done; tests_3_1 = tests_3.next()) {
            var test_17 = tests_3_1.value;
            if (test_17.out == '') {
                try {
                    url.joinPathArray(test_17.base, (_b = test_17.elem) !== null && _b !== void 0 ? _b : []);
                }
                catch (_) {
                    continue;
                }
                assert.fail("not throw", test_17);
            }
            var out = url.joinPathArray(test_17.base, (_c = test_17.elem) !== null && _c !== void 0 ? _c : []);
            assert.equal(test_17.out, out, test_17);
        }
    }
    catch (e_17_1) { e_17 = { error: e_17_1 }; }
    finally {
        try {
            if (tests_3_1 && !tests_3_1.done && (_a = tests_3.return)) _a.call(tests_3);
        }
        finally { if (e_17) throw e_17.error; }
    }
});
