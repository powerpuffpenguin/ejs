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
m.test('EncodeQuery', (asserts) => {
    for (const test of encodeQueryTests) {
        asserts.equal(test.expected, test.m.encode())
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

m.test('ResolvePath', (asserts) => {
    for (const test of resolvePathTests) {
        const got = (url as any).resolvePath(test.base, test.ref)
        asserts.equal(test.expected, got)
    }
})