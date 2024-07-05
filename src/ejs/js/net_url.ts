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