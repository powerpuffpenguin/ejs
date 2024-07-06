declare const Duktape: any
declare namespace deps {
    export const encodePath: number
    export const encodePathSegment: number
    export const encodeHost: number
    export const encodeZone: number
    export const encodeUserPassword: number
    export const encodeQueryComponent: number
    export const encodeFragment: number
    export function escape(s: string, mode: number): string
    export interface UnescapeOptions {
        escape: any
        host: any
    }
    export function unescape(opts: UnescapeOptions, s: string, mode: number): string


    export function join_values(next: () => undefined | [string, string]): string;
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
export class URL {
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
}