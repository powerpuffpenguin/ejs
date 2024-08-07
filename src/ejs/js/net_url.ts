declare const Duktape: any
declare namespace deps {
    const encodePath: number
    const encodePathSegment: number
    const encodeHost: number
    const encodeZone: number
    const encodeUserPassword: number
    const encodeQueryComponent: number
    const encodeFragment: number
    function escape(s: string, mode: number): string
    interface UnescapeOptions {
        escape: any
        host: any
    }
    function unescape(opts: UnescapeOptions, s: string, mode: number): string

    function join_values(next: () => undefined | [string, string]): string

    function check(rawURL: string, viaRequest: boolean): void
    function getScheme(rawURL: string): [/*scheme*/string,/*path*/string]
    function validUserinfo(s: string): boolean
    function validOptionalPort(s: string): boolean
    function validEncoded(s: string, mode: number): boolean
    function resolvePath(full: string): string
}
import { joinArray } from "ejs/path";
import { StringBuilder } from "ejs/strconv";
export class EscapeError extends Error {
    constructor(message: string, opts?: any) {
        super(`invalid URL escape ${message}`, opts)
        // restore prototype chain   
        const proto = new.target.prototype
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, proto)
        }
        else {
            (this as any).__proto__ = proto
        }
        this.name = "EscapeError"
    }
}
export class InvalidHostError extends Error {
    constructor(message: string, opts?: any) {
        super(`invalid character ${message} in host name`, opts)
        // restore prototype chain   
        const proto = new.target.prototype
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, proto)
        }
        else {
            (this as any).__proto__ = proto
        }
        this.name = "EscapeError"
    }
}

const unescapeError: deps.UnescapeOptions = {
    escape: EscapeError,
    host: InvalidHostError,
}

export interface URLErrorOptions {
    op: string
    url: string
    err: any
}
export class URLError extends Error {
    constructor(public opts: URLErrorOptions) {
        super()
        // restore prototype chain   
        const proto = new.target.prototype
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, proto)
        }
        else {
            (this as any).__proto__ = proto
        }
        this.name = "URLError"
    }
    get message(): string {
        const opts = this.opts
        const err = opts.err
        return `${opts.op} ${opts.url}: ${err instanceof Error ? err.message : err}`
    }
    unwrap() {
        return this.opts.err
    }
}

/**
 * queryUnescape does the inverse transformation of queryEscape,
 * converting each 3-byte encoded substring of the form "%AB" into the
 * hex-decoded byte 0xAB.
 * It returns an error if any % is not followed by two hexadecimal
 * digits.
 * @throws EscapeError OsErrror Errror
 */
export function queryUnescape(s: string): string {
    return deps.unescape(unescapeError, s, deps.encodeQueryComponent)
}
/**
 * pathUnescape does the inverse transformation of pathEscape,
 * converting each 3-byte encoded substring of the form "%AB" into the
 * hex-decoded byte 0xAB. It returns an error if any % is not followed
 * by two hexadecimal digits.
 * 
 * pathUnescape is identical to queryUnescape except that it does not
 * unescape '+' to ' ' (space).
 * @throws EscapeError OsErrror Errror
 */
export function pathUnescape(s: string): string {
    return deps.unescape(unescapeError, s, deps.encodePathSegment)
}
/**
 * escapes the string so it can be safely placed
 * inside a URL query.
 */
export function queryEscape(s: string): string {
    return deps.escape(s, deps.encodeQueryComponent)
}
/**
 * escapes the string so it can be safely placed inside a URL path segment,
 * replacing special characters (including /) with %XX sequences as needed.
 */
export function pathEscape(s: string): string {
    return deps.escape(s, deps.encodePathSegment)
}

export class Userinfo {
    readonly username: string
    readonly password?: string | null
    constructor(username: string, password?: string | null) {
        this.username = `${username}`
        if (password === undefined || password === null) {
            return
        }
        this.password = `${password}`
    }
    toString() {
        const s = deps.escape(this.username, deps.encodeUserPassword)
        const p = this.password
        if (p === undefined || p === null || p === '') {
            return s
        }
        return s + ":" + deps.escape(p, deps.encodeUserPassword)
    }
}

function parseQuery(m: Record<string, Array<string> | undefined>, query: string, ignoeInvalid?: boolean) {
    let key: string
    let value: string
    let i: number
    let found: Array<string> | undefined
    while (query != "") {
        i = query.indexOf("&")
        if (i >= 0) {
            key = query.substring(0, i)
            query = query.substring(i + 1)
        } else {
            key = query
            query = ""
        }

        if (key == "") {
            continue
        } else if (key.indexOf(";") >= 0) {
            if (!ignoeInvalid) {
                throw new Error("invalid semicolon separator in query")
            }
            continue
        }

        i = key.indexOf("=")
        if (i >= 0) {
            value = key.substring(i + 1)
            key = key.substring(0, i)
        } else {
            value = ""
        }
        if (ignoeInvalid) {
            try {
                key = queryUnescape(key)
                value = queryUnescape(value)
            } catch (_) {
                continue
            }
        } else {
            key = queryUnescape(key)
            value = queryUnescape(value)
        }

        found = m[key]
        if (found) {
            found.push(value)
        } else {
            m[key] = [value]
        }
    }
}

/**
 * Values maps a string key to a list of values.
 * It is typically used for query parameters and form values.
 * Unlike in the http.Header map, the keys in a Values map
 * are case-sensitive.
 */
export class Values {
    /**
     * Parses the URL-encoded query string and returns
     * the values specified for each key.
     * 
     * Query is expected to be a list of key=value settings separated by ampersands.
     * A setting without an equals sign is interpreted as a key set to an empty value.
     * Settings containing a non-URL-encoded semicolon are considered invalid.
     */
    static parse(query: string, ignoeInvalid?: boolean): Values {
        const m: Record<string, Array<string> | undefined> = {}
        parseQuery(m, query, ignoeInvalid)
        return new Values(m)
    }
    readonly values: Record<string, Array<string> | undefined>
    constructor(values?: Record<string, Array<string> | undefined>) {
        if (values === undefined || values === null) {
            this.values = {}
        } else {
            this.values = values
        }
    }
    /**
     * Gets the first value associated with the given key.
     * If there are no values associated with the key, Get returns
     * undefined. To access multiple values, use the record
     * directly.
     */
    get(key: string): string | undefined {
        const vs = this.values[key]
        if (vs && vs.length) {
            return vs[0]
        }
    }
    /**
     * Sets the key to value. It replaces any existing values
     */
    set(key: string, value: any) {
        this.values[key] = [`${value}`]
    }
    /**
     * Adds the value to key. It appends to any existing
     * values associated with key.
     */
    add(key: string, value: any) {
        const keys = this.values
        const found = keys[key]
        if (found) {
            found.push(`${value}`)
        } else {
            keys[key] = [`${value}`]
        }
    }


    /**
     * Deletes the values associated with key.
     * @param logic If true, just set the property to undefined; if false, delete is called.
     */
    remove(key: string, logic?: boolean) {
        if (logic) {
            const keys = this.values
            if (keys[key]) {
                keys[key] = undefined
            }
        } else {
            delete this.values[key]
        }
    }

    /**
     * checks whether a given key is set
     */
    has(key: string): boolean {
        const v = this.values[key]
        return v === undefined || v === null ? false : true
    }

    /**
     * encodes the values into “URL encoded” form ("bar=baz&foo=quux") sorted by key.
     */
    encode(): string {
        const values = this.values
        const keys: Array<string> = []
        for (const key in values) {
            if (Object.prototype.hasOwnProperty.call(values, key)) {
                const val = values[key]
                if (val === null || val === undefined || val.length === 0) {
                    continue
                }
                keys.push(key)
            }
        }
        keys.sort()
        const t = new Duktape.Thread(() => {
            const cb = Duktape.Thread.yield;
            for (let i = 0; i < keys.length; i++) {
                const k = keys[i]
                const vs = values[k]!
                const keyEscaped = queryEscape(k)
                for (let j = 0; j < vs.length; j++) {
                    cb([keyEscaped, queryEscape(vs[j])])
                }
            }
        })
        return deps.join_values(() => {
            return Duktape.Thread.resume(t)
        })
    }
}

function stringsCut(s: string, sep: string): {
    before: string
    after: string
    found: boolean
} {
    const i = s.indexOf(sep)
    if (i >= 0) {
        return {
            before: s.substring(0, i),
            after: s.substring(i + sep.length),
            found: true,
        }
    }
    return {
        before: s,
        after: "",
        found: false,
    }
}
function parseHost(host: string): string {
    let i: number
    if (host.startsWith("[")) {
        // Parse an IP-Literal in RFC 3986 and RFC 6874.
        // E.g., "[fe80::1]", "[fe80::1%25en0]", "[fe80::1]:80".
        i = host.lastIndexOf("]")
        if (i < 0) {
            throw new Error("missing ']' in host")
        }
        const colonPort = host.substring(i + 1,)
        if (!deps.validOptionalPort(colonPort)) {
            throw new Error(`invalid port ${colonPort} after host`)
        }

        // RFC 6874 defines that %25 (%-encoded percent) introduces
        // the zone identifier, and the zone identifier can use basically
        // any %-encoding it likes. That's different from the host, which
        // can only %-encode non-ASCII bytes.
        // We do impose some restrictions on the zone, to avoid stupidity
        // like newlines.
        let zone = host.indexOf("%25")
        if (zone >= 0 && zone < i) {
            return deps.unescape(unescapeError, host.substring(0, zone), deps.encodeHost) +
                deps.unescape(unescapeError, host.substring(zone, i), deps.encodeZone) +
                deps.unescape(unescapeError, host.substring(i), deps.encodeHost)
        }
    } else {
        i = host.lastIndexOf(":")
        if (i != -1) {
            const colonPort = host.substring(i)
            if (!deps.validOptionalPort(colonPort)) {
                throw new Error(`invalid port ${colonPort} after host`)
            }
        }
    }

    return deps.unescape(unescapeError, host, deps.encodeHost)
}
function parseAuthority(authority: string): {
    user?: Userinfo
    host: string
} {
    let host = ''
    let i = authority.lastIndexOf("@")
    if (i < 0) {
        host = parseHost(authority)
    } else {
        host = parseHost(authority.substring(i + 1))
    }

    if (i < 0) {
        return {
            host: host,
        }
    }
    let userinfo = authority.substring(0, i)
    if (!deps.validUserinfo(userinfo)) {
        throw new Error("ejs/net/url: invalid userinfo")
    }
    let user: Userinfo | undefined
    i = userinfo.indexOf(":")
    if (i < 0) {
        userinfo = deps.unescape(unescapeError, userinfo, deps.encodeUserPassword)
        user = new Userinfo(userinfo)
    } else {
        const username = deps.unescape(unescapeError, userinfo.substring(0, i), deps.encodeUserPassword)
        const password = deps.unescape(unescapeError, userinfo.substring(i + 1), deps.encodeUserPassword)
        user = new Userinfo(username, password)
    }
    return {
        user: user,
        host: host,
    }
}
function stringsCountOne(s: string, substr: string): boolean {
    const i = s.indexOf(substr)
    if (i == -1) {
        return false
    }
    return i == s.lastIndexOf(substr)
}
function parse(url: URL, rawURL: string, viaRequest: boolean) {
    if (rawURL == "*") {
        url.path = "*"
        return
    }
    let vals = deps.getScheme(rawURL)
    url.scheme = vals[0].toLowerCase()
    let rest = vals[1]

    if (rest.endsWith("?") && stringsCountOne(rest, "?")) {
        url.forceQuery = true
        rest = rest.substring(0, rest.length - 1)
    } else {
        const o = stringsCut(rest, "?")
        rest = o.before
        url.rawQuery = o.after
    }

    if (!rest.startsWith("/")) {
        if (url.scheme != "") {
            // We consider rootless paths per RFC 3986 as opaque.
            url.opaque = rest
            return
        }
        if (viaRequest) {
            throw new Error("invalid URI for request")
        }

        // Avoid confusion with malformed schemes, like cache_object:foo/bar.
        // See golang.org/issue/16822.
        //
        // RFC 3986, §3.3:
        // In addition, a URI reference (Section 4.1) may be a relative-path reference,
        // in which case the first path segment cannot contain a colon (":") character.
        const segment = stringsCut(rest, "/").before
        if (segment.indexOf(":") >= 0) {
            // First path segment has colon. Not allowed in relative URL.
            throw new Error("first path segment in URL cannot contain colon")
        }
    }
    if ((url.scheme != "" || !viaRequest && !rest.startsWith("///")) && rest.startsWith("//")) {
        // var authority string
        let authority = rest.substring(2)
        rest = ''
        const i = authority.indexOf("/")
        if (i >= 0) {
            rest = authority.substring(i)
            authority = authority.substring(0, i)
        }
        const o = parseAuthority(authority)
        url.user = o.user
        url.host = o.host
    } else if (url.scheme != "" && rest.startsWith("/")) {
        // OmitHost is set to true when rawURL has an empty host (authority).
        // See golang.org/issue/46059.
        url.omitHost = true
    }

    // Set Path and, optionally, RawPath.
    // RawPath is a hint of the encoding of Path. We don't want to set it if
    // the default escaping of Path is equivalent, to help make sure that people
    // don't rely on it in general.
    url._setPath(rest)
}
// splitHostPort separates host and port. If the port is not valid, it returns
// the entire input as host, and it doesn't check the validity of the host.
// Unlike net.SplitHostPort, but per RFC 3986, it requires ports to be numeric.
function splitHostPort(hostPort: string, getport: boolean): string {
    let host = hostPort

    const colon = host.lastIndexOf(':')
    if (colon != -1 && deps.validOptionalPort(host.substring(colon))) {
        if (getport) {
            return host.substring(colon + 1)
        }
        host = host.substring(0, colon)
    } else if (getport) {
        return ''
    }

    if (host.startsWith('[') && host.endsWith(']')) {
        host = host.substring(1, host.length - 1)
    }

    return host
}

// resolvePath applies special path segments from refs and applies
// them to base, per RFC 3986.
export function resolvePath(base: string, ref: string): string {
    let full: string
    if (ref == "") {
        full = base
    } else if (ref[0] != '/') {
        const i = base.lastIndexOf("/") + 1
        full = i == base.length ? base : base.substring(0, i)
        if (ref != "") {
            full += ref
        }
    } else {
        full = ref
    }
    if (full == "") {
        return ""
    }
    return deps.resolvePath(full)
}
export interface URLOptions {
    scheme?: string
    /**
     * encoded opaque data
     */
    opaque?: string
    /**
     * username and password information
     */
    user?: {
        username?: string
        password?: string
    }
    /**
     * host or host:port
     */
    host?: string
    /**
     * path (relative paths may omit leading slash)
     */
    path?: string
    /**
     * encoded path hint (see escapedPath method)
     */
    rawPath?: string
    /**
     * do not emit empty host (authority)
     */
    omitHost?: boolean
    /**
     * append a query ('?') even if rawQuery is empty
     */
    forceQuery?: boolean
    /**
     * encoded query values, without '?'
     */
    rawQuery?: string
    /**
     * fragment for references, without '#'
     */
    fragment?: string
    /**
     *  encoded fragment hint (see EscapedFragment method)
     */
    rawFragment?: string
}
export class URL {
    static parse(rawURL: string, requestURI?: boolean): URL {
        try {
            if (requestURI) {
                deps.check(rawURL, true)
                const url = new URL()
                parse(url, rawURL, true)
                return url
            } else {
                // Cut off #frag
                const i = rawURL.indexOf("#")
                let u: string
                let frag: string
                if (i >= 0) {
                    u = rawURL.substring(0, i)
                    frag = rawURL.substring(i + 1)
                } else {
                    u = rawURL
                    frag = ''
                }
                deps.check(u, false)
                const url = new URL()
                parse(url, u, false)
                if (frag != '') {
                    url._setFragment(frag)
                }
                return url
            }
        } catch (e) {
            throw new URLError({
                op: 'parse',
                url: rawURL,
                err: e,
            })
        }
    }
    clone(): URL {
        const url = new URL()
        url.scheme = this.scheme
        url.opaque = this.opaque
        url.user = this.user
        url.host = this.host
        url.path = this.path
        url.rawPath = this.rawPath
        url.omitHost = this.omitHost
        url.forceQuery = this.forceQuery
        url.rawQuery = this.rawQuery
        url.fragment = this.fragment
        url.rawFragment = this.rawFragment
        return url
    }
    constructor(o?: URLOptions) {
        if (o) {
            this.scheme = o.scheme ?? ''
            this.opaque = o.opaque ?? ''
            const user = o.user
            if (user && user.username !== undefined) {
                this.user = new Userinfo(user.username, user.password)
            } else {
                this.user = undefined
            }
            this.host = o.host ?? ''
            this.path = o.path ?? ''
            this.rawPath = o.rawPath ?? ''
            this.omitHost = o.omitHost ? true : false
            this.forceQuery = o.forceQuery ? true : false
            this.rawQuery = o.rawQuery ?? ''
            this.fragment = o.fragment ?? ''
            this.rawFragment = o.rawFragment ?? ''
        } else {
            this.scheme = ''
            this.opaque = ''
            this.user = undefined
            this.host = ''
            this.path = ''
            this.rawPath = ''
            this.omitHost = false
            this.forceQuery = false
            this.rawQuery = ''
            this.fragment = ''
            this.rawFragment = ''
        }
    }
    scheme: string
    /**
     * encoded opaque data
     */
    opaque: string
    /**
     * username and password information
     */
    user?: Userinfo
    /**
     * host or host:port
     */
    host: string
    /**
     * path (relative paths may omit leading slash)
     */
    path: string
    /**
     * encoded path hint (see escapedPath method)
     */
    rawPath: string
    /**
     * do not emit empty host (authority)
     */
    omitHost: boolean
    /**
     * append a query ('?') even if rawQuery is empty
     */
    forceQuery: boolean
    /**
     * encoded query values, without '?'
     */
    rawQuery: string
    /**
     * fragment for references, without '#'
     */
    fragment: string
    /**
     *  encoded fragment hint (see EscapedFragment method)
     */
    rawFragment: string

    private _setFragment(f: string) {
        const frag = deps.unescape(unescapeError, f, deps.encodeFragment)
        const escf = deps.escape(frag, deps.encodeFragment)

        this.fragment = frag
        if (f == escf) {
            // Default encoding is fine.
            this.rawFragment = ""
        } else {
            this.rawFragment = f
        }
    }
    _setPath(p: string) {
        const path = deps.unescape(unescapeError, p, deps.encodePath)
        const escp = deps.escape(path, deps.encodePath)
        this.path = path
        if (p == escp) {
            // Default encoding is fine.
            this.rawPath = ""
        } else {
            this.rawPath = p
        }
    }
    /**
     * EscapedFragment returns the escaped form of URL.fragment.
     * In general there are multiple possible escaped forms of any fragment.
     * EscapedFragment returns URL.rawFragment when it is a valid escaping of URL.fragment.
     * Otherwise escapedFragment ignores URL.rawFragment and computes an escaped
     * form on its own.
     * The toString method uses escapedFragment to construct its result.
     * In general, code should call escapedFragment instead of
     * reading URL.rawFragment directly.
     */
    escapedFragment(): string {
        if (this.rawFragment != "" && deps.validEncoded(this.rawFragment, deps.encodeFragment)) {
            try {
                if (deps.unescape(unescapeError, this.rawFragment, deps.encodeFragment) == this.fragment) {
                    return this.rawFragment
                }
            } catch (_) {
            }
        }
        return deps.escape(this.fragment, deps.encodeFragment)
    }
    /**
     * EscapedPath returns the escaped form of URL.path.
     * In general there are multiple possible escaped forms of any path.
     * EscapedPath returns URL.rawPath when it is a valid escaping of URL.path.
     * Otherwise escapedPath ignores URL.rawPath and computes an escaped
     * form on its own.
     * The toString and requestURI methods use escapedPath to construct
     * their results.
     * In general, code should call escapedPath instead of
     * reading URL.rawPath directly.
     */
    escapedPath(): string {
        if (this.rawPath != "" && deps.validEncoded(this.rawPath, deps.encodePath)) {
            try {
                if (deps.unescape(unescapeError, this.rawPath, deps.encodePath) == this.path) {
                    return this.rawPath
                }
            } catch (_) {
            }
        }
        if (this.path == "*") {
            return "*" // don't escape (Issue 11202)
        }
        return deps.escape(this.path, deps.encodePath)
    }
    /**
     * Returns URL.host, stripping any valid port number if present.
     * 
     * If the result is enclosed in square brackets, as literal IPv6 addresses are,
     * the square brackets are removed from the result.
     */
    hostname(): string {
        return splitHostPort(this.host, false)
    }
    /**
     * Returns the port part of URL.host, without the leading colon.
     * 
     * If URL.host doesn't contain a valid numeric port, Port returns an empty string.
     */
    port(): string {
        return splitHostPort(this.host, true)
    }
    /**
     * Reports whether the URL is absolute.
     * Absolute means that it has a non-empty scheme.
     */
    isAbs(): boolean {
        return this.scheme != ""
    }
    /**
     * JoinPath returns a new URL with the provided path elements joined to
     * any existing path and the resulting path cleaned of any ./ or ../ elements.
     * Any sequences of multiple / characters will be reduced to a single /.
     */
    joinPathArray(elem: Array<string>): URL {
        switch (elem.length) {
            case 0:
                elem = [this.escapedPath()]
                break;
            case 1:
                elem = [this.escapedPath(), elem[0]]
                break;
            default:
                elem = [this.escapedPath(), ...elem]
                break;
        }
        let p: string
        if (!elem[0].startsWith("/")) {
            // Return a relative path if u is relative,
            // but ensure that it contains no ../ elements.
            elem[0] = "/" + elem[0]
            p = joinArray(elem).substring(1)
        } else {
            p = joinArray(elem)
        }
        // path.Join will remove any trailing slashes.
        // Preserve at least one.
        if (elem[elem.length - 1].endsWith("/") && !p.endsWith("/")) {
            p += "/"
        }
        const url = this.clone()
        url._setPath(p)
        return url
    }
    /**
     * JoinPath returns a new URL with the provided path elements joined to
     * any existing path and the resulting path cleaned of any ./ or ../ elements.
     * Any sequences of multiple / characters will be reduced to a single /.
     */
    joinPath(...elem: Array<string>): URL {
        return this.joinPathArray(elem)
    }
    /**
     * Query parses rawQuery and returns the corresponding values.
     * It silently discards malformed value pairs.
     * To check errors use Values.parse.
     */
    query(ignoeInvalid?: boolean): Values {
        return Values.parse(this.rawQuery, ignoeInvalid)
    }
    /**
     * Redacted is like String but replaces any password with "xxxxx".
     * Only the password in URL.user is redacted.
     */
    redacted(): string {
        const user = this.user
        if (user &&
            user.password !== undefined &&
            user.password !== null &&
            user.password != '') {
            const ru = this.clone()
            ru.user = new Userinfo(user.username, "xxxxx")
            return ru.toString()
        }
        return this.toString()
    }
    /**
     * Returns the encoded path?query or opaque?query
     * string that would be used in an HTTP request for u.
     */
    requestURI(): string {
        let result = this.opaque
        if (result == "") {
            result = this.escapedPath()
            if (result == "") {
                result = "/"
            }
        } else {
            if (result.startsWith("//")) {
                result = this.scheme + ":" + result
            }
        }
        if (this.forceQuery || this.rawQuery != "") {
            result += "?" + this.rawQuery
        }
        return result
    }
    /**
     * Resolves a URI reference to an absolute URI from
     * an absolute base URI u, per RFC 3986 Section 5.2. The URI reference
     * may be relative or absolute. ResolveReference always returns a new
     * URL instance, even if the returned URL is identical to either the
     * base or reference. If ref is an absolute URL, then ResolveReference
     * ignores base and returns a copy of ref.
     */
    resolveReference(refer: URL | string): URL {
        const ref = typeof refer === "string" ? URL.parse(refer) : refer
        const url = ref.clone()
        if (ref.scheme == "") {
            url.scheme = this.scheme
        }
        if (ref.scheme != "" || ref.host != "" || ref.user) {
            // The "absoluteURI" or "net_path" cases.
            // We can ignore the error from setPath since we know we provided a
            // validly-escaped path.
            url._setPath(resolvePath(ref.escapedPath(), ""))
            return url
        }
        if (ref.opaque != "") {
            url.user = undefined
            url.host = ""
            url.path = ""
            return url
        }
        if (ref.path == "" && !ref.forceQuery && ref.rawQuery == "") {
            url.rawQuery = this.rawQuery
            if (ref.fragment == "") {
                url.fragment = this.fragment
                url.rawFragment = this.rawFragment
            }
        }
        // The "abs_path" or "rel_path" cases.
        url.host = this.host
        url.user = this.user
        url._setPath(resolvePath(this.escapedPath(), ref.escapedPath()))
        return url
    }

    toString(): string {
        const buf = new StringBuilder()
        if (this.scheme != "") {
            buf.append(this.scheme)
            buf.append(":")
        }
        if (this.opaque != "") {
            buf.append(this.opaque)
        } else {
            if (this.scheme != "" || this.host != "" || this.user) {
                if (this.omitHost && this.host == "" && !this.user) {
                    // omit empty host
                } else {
                    if (this.host != "" || this.path != "" || this.user) {
                        buf.append("//")
                    }
                    if (this.user) {
                        buf.append(this.user.toString())
                        buf.append("@")
                    }
                    if (this.host != "") {
                        buf.append(deps.escape(this.host, deps.encodeHost))
                    }
                }
            }
            const path = this.escapedPath()
            if (path != "" && path[0] != '/' && this.host != "") {
                buf.append('/')
            }
            if (buf.length == 0) {
                // RFC 3986 §4.2
                // A path segment that contains a colon character (e.g., "this:that")
                // cannot be used as the first segment of a relative-path reference, as
                // it would be mistaken for a scheme name. Such a segment must be
                // preceded by a dot-segment (e.g., "./this:that") to make a relative-
                // path reference.
                const segment = stringsCut(path, "/").before
                if (segment.indexOf(":") > -1) {
                    buf.append('./')
                }
            }
            buf.append(path)
        }
        if (this.forceQuery || this.rawQuery != "") {
            buf.append('?')
            buf.append(this.rawQuery)
        }
        if (this.fragment != "") {
            buf.append('#')
            buf.append(this.escapedFragment())
        }
        return buf.toString()
    }
}
/**
 * eturns a URL string with the provided path elements joined to
 * the existing path of base and the resulting path cleaned of any ./ or ../ elements.
 */
export function joinPath(base: string, ...elem: Array<string>): string {
    return URL.parse(base).joinPathArray(elem).toString()
}
/**
 * eturns a URL string with the provided path elements joined to
 * the existing path of base and the resulting path cleaned of any ./ or ../ elements.
 */
export function joinPathArray(base: string, elem: Array<string>): string {
    return URL.parse(base).joinPathArray(elem).toString()
}