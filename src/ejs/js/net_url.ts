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
}
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
    static parse(query: string): Values {
        const m: Record<string, Array<string> | undefined> = {}
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
                throw new Error("invalid semicolon separator in query")
            }

            i = key.indexOf("=")
            if (i >= 0) {
                value = key.substring(i + 1)
                key = key.substring(0, i)
            } else {
                value = ""
            }

            key = queryUnescape(key)
            value = queryUnescape(value)

            found = m[key]
            if (found) {
                found.push(value)
            } else {
                m[key] = [value]
            }
        }
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
function stringsCountOne(s: string, substr: string): boolean {
    let i = s.indexOf(substr)
    if (i < 0) {
        return false;
    }
    return s.indexOf(substr, i + substr.length) < 0 ? true : false
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

        // 	// RFC 6874 defines that %25 (%-encoded percent) introduces
        // 	// the zone identifier, and the zone identifier can use basically
        // 	// any %-encoding it likes. That's different from the host, which
        // 	// can only %-encode non-ASCII bytes.
        // 	// We do impose some restrictions on the zone, to avoid stupidity
        // 	// like newlines.
        // 	zone := strings.Index(host[:i], "%25")
        // 	if zone >= 0 {
        // 		host1, err := unescape(host[:zone], encodeHost)
        // 		if err != nil {
        // 			return "", err
        // 		}
        // 		host2, err := unescape(host[zone:i], encodeZone)
        // 		if err != nil {
        // 			return "", err
        // 		}
        // 		host3, err := unescape(host[i:], encodeHost)
        // 		if err != nil {
        // 			return "", err
        // 		}
        // 		return host1 + host2 + host3, nil
        // 	}
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

function parse(url: URL, rawURL: string, viaRequest: boolean) {
    if (rawURL == "*") {
        url.path = "*"
        return
    }
    let vals = deps.getScheme(rawURL)
    url.scheme = vals[0].toLowerCase()
    let rest = vals[1]


    if (rest.startsWith("?") && stringsCountOne(rest, "?")) {
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
    scheme = ''
    /**
     * encoded opaque data
     */
    opaque = ''
    /**
     * username and password information
     */
    user?: Userinfo
    /**
     * host or host:port
     */
    host = ''
    /**
     * path (relative paths may omit leading slash)
     */
    path = ''
    /**
     * encoded path hint (see escapedPath method)
     */
    rawPath = ''
    /**
     * do not emit empty host (authority)
     */
    omitHost = false
    /**
     * append a query ('?') even if rawQuery is empty
     */
    forceQuery = false
    /**
     * encoded query values, without '?'
     */
    rawQuery = ''
    /**
     * fragment for references, without '#'
     */
    fragment = ''
    /**
     *  encoded fragment hint (see EscapedFragment method)
     */
    rawFragment = ''

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
}