import { test } from "../../../unit/unit";
import * as url from "ejs/net/url"
const m = test.module("ejs/net/url")
const nil = undefined
interface URLTest {
    in: string
    out: url.URL   // expected parse
    roundtrip: string // expected result of reserializing the URL; empty means same as "in".
}
const urltests: Array<URLTest> = [
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
        in: "http://[fe80::1%25en0]/", // alphanum zone identifier
        out: new url.URL({
            scheme: "http",
            host: "[fe80::1%en0]",
            path: "/",
        }),
        roundtrip: "",
    },
    // host and port subcomponents; IPv6 address with zone identifier in RFC 6874
    {
        in: "http://[fe80::1%25en0]:8080/", // alphanum zone identifier
        out: new url.URL({
            scheme: "http",
            host: "[fe80::1%en0]:8080",
            path: "/",
        }),
        roundtrip: "",
    },
    // host subcomponent; IPv6 address with zone identifier in RFC 6874
    {
        in: "http://[fe80::1%25%65%6e%301-._~]/", // percent-encoded+unreserved zone identifier
        out: new url.URL({
            scheme: "http",
            host: "[fe80::1%en01-._~]",
            path: "/",
        }),
        roundtrip: "http://[fe80::1%25en01-._~]/",
    },
    // host and port subcomponents; IPv6 address with zone identifier in RFC 6874
    {
        in: "http://[fe80::1%25%65%6e%301-._~]:8080/", // percent-encoded+unreserved zone identifier
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
]
m.test("Parse", (assert) => {
    for (const test of urltests) {
        const out = url.URL.parse(test.in)
        assert.equal(test.out, out, test)
    }
})

const pathThatLooksSchemeRelative = "//not.a.user@not.a.host/just/a/path"

const parseRequestURLTests: Array<{
    url: string
    expectedValid: boolean
}> = [
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
        { url: "http://[fe80::1%25en0]/", expectedValid: true },                 // with alphanum zone identifier
        { url: "http://[fe80::1%25en0]:8080/", expectedValid: true },            // with alphanum zone identifier
        { url: "http://[fe80::1%25%65%6e%301-._~]/", expectedValid: true },      // with percent-encoded+unreserved zone identifier
        { url: "http://[fe80::1%25%65%6e%301-._~]:8080/", expectedValid: true }, // with percent-encoded+unreserved zone identifier

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
    ]
m.test('RequestURI', (assert) => {
    for (const test of parseRequestURLTests) {
        if (test.expectedValid) {
            url.URL.parse(test.url, true)
        } else {
            try {
                url.URL.parse(test.url, true)
            } catch (_) {
                continue
            }
            assert.fail(test)
        }
    }
    const u = url.URL.parse(pathThatLooksSchemeRelative, true)
    assert.equal(pathThatLooksSchemeRelative, u.path)
})

const stringURLTests: Array<{ url: url.URL, want: string }> = [
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
]
m.test('URLString', (assert) => {
    for (const test of urltests) {
        const u = url.URL.parse(test.in)
        const expected = test.roundtrip == '' ? test.in : test.roundtrip
        assert.equal(expected, u.toString(), test)
    }

    for (const test of stringURLTests) {
        assert.equal(test.want, test.url.toString())
    }
})

m.test('URLRedacted', (assert) => {
    const cases: Array<{
        name: string
        url: url.URL
        want: string
    }> = [
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
        ]
    for (const test of cases) {
        assert.equal(test.want, test.url.redacted(), test)
    }
})
interface EscapeTest {
    in: string
    out: string
    err?: Error
}
function EscapeError(s: string) {
    return new url.EscapeError(s)
}
const unescapeTests: Array<EscapeTest> = [
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
        in: "%", // not enough characters after %
        out: "",
        err: EscapeError("%"),
    },
    {
        in: "%a", // not enough characters after %
        out: "",
        err: EscapeError("%a"),
    },
    {
        in: "%1", // not enough characters after %
        out: "",
        err: EscapeError("%1"),
    },
    {
        in: "123%45%6", // not enough characters after %
        out: "",
        err: EscapeError("%6"),
    },
    {
        in: "%zzzzz", // invalid hex digits
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
]
m.test('Unescape', (assert) => {
    for (const test of unescapeTests) {
        if (test.err) {
            let isthrow = false
            try {
                url.queryUnescape(test.in)
            } catch (_) {
                isthrow = true
            }
            if (!isthrow) {
                assert.fail(test)
            }
        } else {
            const actual = url.queryUnescape(test.in)
            assert.equal(test.out, actual)
        }

        let input = test.in
        let out = test.out
        if (test.in.indexOf("+") != -1) {
            input = input.replaceAll("+", "%20")
            if (test.err) {
                let isthrow = false
                try {
                    url.queryUnescape(input)
                } catch (_) {
                    isthrow = true
                }
                if (!isthrow) {
                    assert.fail(test)
                }
            } else {
                const actual = url.pathUnescape(input)
                assert.equal(test.out, actual)

                let s: string
                try {
                    s = url.queryUnescape(test.in.replaceAll("+", "XXX"))
                } catch (_) {
                    continue
                }
                input = test.in
                out = s.replaceAll("XXX", "+")
            }
        }

        if (test.err) {
            let isthrow = false
            try {
                url.pathUnescape(input)
            } catch (_) {
                isthrow = true
            }
            if (!isthrow) {
                assert.fail(test)
            }
        } else {
            const actual = url.pathUnescape(input)
            assert.equal(out, actual)
        }
    }
})

const queryEscapeTests: Array<EscapeTest> = [
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
]
m.test('QueryEscape', (assert) => {
    for (const test of queryEscapeTests) {
        const actual = url.queryEscape(test.in)
        assert.equal(test.out, actual)

        const roundtrip = url.queryUnescape(actual)
        assert.equal(test.in, roundtrip)
    }
})


const pathEscapeTests: Array<EscapeTest> = [
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
]
m.test('PathEscape', (assert) => {
    for (const test of pathEscapeTests) {
        const actual = url.pathEscape(test.in)
        assert.equal(test.out, actual)
    }
})

interface EncodeQueryTest {
    m: url.Values
    expected: string
}
const encodeQueryTests: Array<EncodeQueryTest> = [
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
]
m.test('EncodeQuery', (assert) => {
    for (const test of encodeQueryTests) {
        assert.equal(test.expected, test.m.encode())
    }
})
const resolvePathTests: Array<{
    base: string
    ref: string
    expected: string
}> = [
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
    ]

m.test('ResolvePath', (assert) => {
    for (const test of resolvePathTests) {
        const got = (url as any).resolvePath(test.base, test.ref)
        assert.equal(test.expected, got)
    }
})

const resolveReferenceTests: Array<{
    base: string, rel: string, expected: string
}> = [
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
    ]
m.test('ResolveReference', (assert) => {
    const mustParse = url.URL.parse
    const opaque = new url.URL({ scheme: "scheme", opaque: "opaque" })
    for (const test of resolveReferenceTests) {
        const base = mustParse(test.base)
        const rel = mustParse(test.rel)
        let url = base.resolveReference(rel)
        assert.equal(test.expected, url.toString(), test)
        // Ensure that new instances are returned.

        assert.false(base == url, test)

        // Test the convenience wrapper too.
        url = base.resolveReference(test.rel)
        assert.equal(test.expected, url.toString(), test)

        // Ensure Opaque resets the URL.
        url = base.resolveReference(opaque)
        assert.equal(opaque, url, test)
    }
})
m.test("QueryValues", (assert) => {
    const u = url.URL.parse("http://x.com?foo=bar&bar=1&bar=2&baz")
    const v = u.query()
    assert.equal("bar", v.get("foo"))
    // Case sensitive:
    assert.equal(undefined, v.get("Foo"))
    assert.equal("1", v.get("bar"))
    assert.equal("", v.get("baz"))
    assert.true(v.has("foo"))
    assert.true(v.has("bar"))
    assert.true(v.has("baz"))

    assert.false(v.has("noexist"))
    v.remove("bar")
    assert.equal(undefined, v.get("bar"))

})

interface parseTest {
    query: string
    out: url.Values
    ok: boolean
}

const parseTests: Array<parseTest> = [
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
        query: "a=%3B", // hex encoding for semicolon
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
]
m.test('ParseQuery', (assert) => {
    let form: url.Values
    for (const test of parseTests) {
        if (test.ok) {
            form = url.Values.parse(test.query)
        } else {
            let isthrow = false
            try {
                url.Values.parse(test.query)
            } catch (_) {
                isthrow = true
            }
            assert.true(isthrow, test)

            form = url.Values.parse(test.query, true)
        }
        for (const key in test.out.values) {
            if (Object.prototype.hasOwnProperty.call(test.out.values, key)) {
                const evs = test.out.values[key]!
                const vs = form.values[key]!
                assert.true(vs)
                assert.equal(evs.length, vs.length, test)
                for (let i = 0; i < evs.length; i++) {
                    assert.equal(evs[i], vs[i])

                }
            }
        }

    }
})
interface RequestURITest {
    url: url.URL
    out: string
}
const requritests: Array<RequestURITest> = [
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
            rawPath: "/a b", // ignored because invalid
            rawQuery: "q=go+language",
        }),
        out: "/a%20b?q=go+language",
    },
    {
        url: new url.URL({
            scheme: "http",
            host: "example.com",
            path: "/a?b",
            rawPath: "/a?b", // ignored because invalid
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
]
m.test('URL.RequestURI', (assert) => {
    for (const test of requritests) {
        const s = test.url.requestURI()
        assert.equal(test.out, s)

    }
})
m.test('ParseFailure', (assert) => {
    let err: Error | undefined
    try {
        url.Values.parse("%gh&%ij")
    } catch (e) {
        err = e as any
    }
    assert.true(err, "not throw")
    const errStr = `${err?.message}`
    assert.true(errStr.indexOf("%gh") >= 0)
})
m.test('ParseErrors', (assert) => {
    const tests: Array<{
        in: string
        wantErr: boolean
    }> = [
            { in: "http://[::1]", wantErr: false },
            { in: "http://[::1]:80", wantErr: false },
            { in: "http://[::1]:namedport", wantErr: true }, // rfc3986 3.2.3
            { in: "http://x:namedport", wantErr: true },     // rfc3986 3.2.3
            { in: "http://[::1]/", wantErr: false },
            { in: "http://[::1]a", wantErr: true },
            { in: "http://[::1]%23", wantErr: true },
            { in: "http://[::1%25en0]", wantErr: false },    // valid zone id
            { in: "http://[::1]:", wantErr: false },         // colon, but no port OK
            { in: "http://x:", wantErr: false },             // colon, but no port OK
            { in: "http://[::1]:%38%30", wantErr: true },    // not allowed: % encoding only for non-ASCII
            { in: "http://[::1%25%41]", wantErr: false },    // RFC 6874 allows over-escaping in zone
            { in: "http://[%10::1]", wantErr: true },        // no %xx escapes in IP address
            { in: "http://[::1]/%48", wantErr: false },      // %xx in path is fine
            { in: "http://%41:8080/", wantErr: true },       // not allowed: % encoding only for non-ASCII
            { in: "mysql://x@y(z:123)/foo", wantErr: true }, // not well-formed per RFC 3986, golang.org/issue/33646
            { in: "mysql://x@y(1.2.3.4:123)/foo", wantErr: true },

            { in: " http://foo.com", wantErr: true },  // invalid character in schema
            { in: "ht tp://foo.com", wantErr: true },  // invalid character in schema
            { in: "ahttp://foo.com", wantErr: false }, // valid schema characters
            { in: "1http://foo.com", wantErr: true },  // invalid character in schema

            { in: "http://[]%20%48%54%54%50%2f%31%2e%31%0a%4d%79%48%65%61%64%65%72%3a%20%31%32%33%0a%0a/", wantErr: true }, // golang.org/issue/11208
            { in: "http://a b.com/", wantErr: true },    // no space in host name please
            { in: "cache_object://foo", wantErr: true }, // scheme cannot have _, relative path cannot have : in first segment
            { in: "cache_object:foo", wantErr: true },
            { in: "cache_object:foo/bar", wantErr: true },
            { in: "cache_object/:foo/bar", wantErr: false },
        ]
    for (const test of tests) {
        if (test.wantErr) {
            let isthrow = false
            try {
                url.URL.parse(test.in)
            } catch (_) {
                isthrow = true
            }
            if (!isthrow) {
                assert.fail("not throw", test)
            }
        } else {
            url.URL.parse(test.in)
        }
    }
})
// Issue 11202
m.test('StarRequest', (assert) => {

})