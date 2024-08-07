declare namespace deps {
    const minBase: number
    const maxBase: number

    const ErrNum: number
    const ErrSyntax: number
    const ErrRange: number
    const ErrBase: number
    const ErrBitSize: number
    interface ThrowOptions {
        _what: number
        _fn: string
        _err?: any
    }
    interface Options {
        _fn?: string
        _throw: (opts: any) => never
    }


    function toString(b: Uint8Array): string
    function toBuffer(s: string): Uint8Array

    function append(val: Uint8Array | string, buf: Uint8Array | undefined, len: number): [Uint8Array, number]

    function appendRune(r: Array<number>, buf: Uint8Array | undefined, len: number): [Uint8Array, number]

    function appendBool(vals: Array<boolean>, buf: Uint8Array | undefined, len: number): [Uint8Array, number]
    interface ParseBoolOptions extends Options {
        input: string
    }
    function parseBool(opts: ParseBoolOptions): boolean
    interface FormatUintOptions extends Options {
        input: number | string
        base: number
        hex?: boolean
    }
    function formatUint(opts: FormatUintOptions): string
    function formatInt(opts: FormatUintOptions): string

    function appendUint(buf: Uint8Array | undefined, len: number, i: number, base?: number): [Uint8Array, number]
    function appendInt(buf: Uint8Array | undefined, len: number, i: number, base?: number): [Uint8Array, number]
    function _appendUint(buf: Uint8Array | undefined, len: number, i: string, base?: number): [Uint8Array, number]
    function _appendInt(buf: Uint8Array | undefined, len: number, i: string, base?: number): [Uint8Array, number]

    interface ParseUintOptions extends Options {
        input: string | Uint8Array
        base: number
        bitSize: number
        toString: boolean
    }
    function parseUint(opts: ParseUintOptions): number
    function parseInt(opts: ParseUintOptions): number
    interface FastAtoIOptions extends Options {
        input: string | Uint8Array
    }
    function fast_atoi(opts: FastAtoIOptions): number

    function isGraphic(r: number): boolean
    function isPrint(r: number): boolean
    function canBackquote(s: string | Uint8Array): boolean

    function len(s: string | Uint8Array): number
    interface AppendQuotedWithOptions {
        buf?: Uint8Array
        len?: number
        s: string | Uint8Array
        quote: number
        ASCIIonly: boolean
        graphicOnly: boolean
    }
    function appendQuotedWith(opts: AppendQuotedWithOptions): [Uint8Array, number]
    interface AppendQuotedRuneWithOptions {
        buf?: Uint8Array
        len?: number
        r: number
        quote: number
        ASCIIonly: boolean
        graphicOnly: boolean
    }
    function appendQuotedRuneWith(opts: AppendQuotedRuneWithOptions): [Uint8Array, number]

    function unquote(
        subarray: (data: Uint8Array, start?: number, end?: number) => Uint8Array,
        s: string | Uint8Array,
        unquote: boolean): string | Uint8Array
    function unquoteChar(
        subarray: (data: Uint8Array, start?: number, end?: number) => Uint8Array,
        s: string | Uint8Array, quote: number): {
            value: number,
            multibyte: boolean,
            tail: string | Uint8Array,
        }
}

export interface NumErrorOptions {
    /**
     * the failing function (parseBool, parseInt, parseUint, ...)
     */
    func: string
    /**
     * the input
     */
    input: any
    /**
     * the reason the conversion failed 
     */
    err: any
}
export class NumError extends Error {
    constructor(public opts: NumErrorOptions) {
        super()
        // restore prototype chain   
        const proto = new.target.prototype
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, proto)
        }
        else {
            (this as any).__proto__ = proto
        }
        this.name = "NumError"
    }
    get message(): string {
        const opts = this.opts
        const err = opts.err
        let input = opts.input
        return `strconv.${opts.func} ${input}: ${err instanceof Error ? err.message : err}`
    }
    unwrap() {
        return this.opts.err
    }
}
/**
 * indicates that a value is out of range for the target type.
 */
export const ErrRange = new RangeError("value out of range")

/**
 * indicates that a value does not have the right syntax for the target type.
 */
export const ErrSyntax = new Error("invalid syntax")

interface ThrowOptions extends deps.ThrowOptions {
    input: any
    base?: number
    bitSize?: number
}
function throwError(opts: ThrowOptions): never {
    switch (opts._what) {
        case deps.ErrNum:
            throw new NumError({
                func: opts._fn,
                input: opts.input,
                err: opts._err,
            })
        case deps.ErrSyntax:
            throw new NumError({
                func: opts._fn,
                input: opts.input,
                err: ErrSyntax,
            })
        case deps.ErrRange:
            throw new NumError({
                func: opts._fn,
                input: opts.input,
                err: ErrRange,
            })
        case deps.ErrBase:
            throw new NumError({
                func: opts._fn,
                input: opts.input,
                err: new Error(`invalid base ${opts.base}`),
            })
        case deps.ErrBitSize:
            throw new NumError({
                func: opts._fn,
                input: opts.input,
                err: new Error(`invalid bit size ${opts.bitSize}`),
            })
        default:
            throw new NumError({
                func: opts._fn,
                input: opts.input,
                err: `unknow error what ${opts._what}`,
            })
    }
}

/**
 * Convert v to a string Uint8Array, useful for getting utf8 byte data of string
 */
export function toBuffer(v: string): Uint8Array {
    return deps.toBuffer(v)
}
/**
 * returns "true" or "false" according to the value of b.
 */
export function formatBool(b: any): string {
    return b ? "true" : "false"
}
/**
 * returns the boolean value represented by the string.
 * It accepts 1, t, T, TRUE, true, True, 0, f, F, FALSE, false, False.
 * Any other value returns undefined.
 * @throws NumError
 */
export function parseBool(str: string): boolean {
    return deps.parseBool({
        _throw: throwError,
        input: str,
    })
}

/**
 * returns the string representation of i uin the given base,
 * for 2 <= base <= 36. The result uses the lower-case letters 'a' to 'z'
 * for digit values >= 10.
 */
export function formatUint(i: number, base = 10): string {
    return deps.formatUint({
        _throw: throwError,
        input: i,
        base: base,
    })
}
export function _formatUint(i: string, base = 10): string {
    return deps.formatUint({
        _throw: throwError,
        input: i,
        base: base,
        hex: true,
    })
}
/**
 * Like parseInt but for unsigned numbers.
 * A sign prefix is not permitted.
 */
export function parseUint(s: string, base = 0, bitSize = 64, toString?: boolean): number {
    return deps.parseUint({
        _throw: throwError,
        _fn: 'parseUint',
        input: s,
        base: base,
        bitSize: bitSize,
        toString: toString ? true : false,
    })
}

/**
 * returns the string representation of i in the given base,
 * for 2 <= base <= 36. The result uses the lower-case letters 'a' to 'z'
 * for digit values >= 10.
 */
export function formatInt(i: number, base = 10): string {
    return deps.formatInt({
        _throw: throwError,
        input: i,
        base: base,
    })
}
export function _formatInt(i: string, base = 10): string {
    return deps.formatInt({
        _throw: throwError,
        input: i,
        base: base,
        hex: true
    })
}
/**
 * equivalent to formatInt(i, 10).
 */
export function itoa(i: number): string {
    return deps.formatInt({
        _throw: throwError,
        input: i,
        base: 10,
    })
}
export function _itoa(i: string): string {
    return deps.formatInt({
        _throw: throwError,
        input: i,
        base: 10,
        hex: true,
    })
}
/**
 * equivalent to parseInt(s, 10, 0), converted to type int.
 */
export function atoi(s: string, toString?: boolean): number {
    if (0 < s.length && s.length < 19) {
        return deps.fast_atoi({
            _throw: throwError,
            input: s,
        })
    }
    return deps.parseInt({
        _throw: throwError,
        _fn: 'atoi',
        input: s,
        base: 0,
        bitSize: 64,
        toString: toString ? true : false,
    })
}

/**
 * Interprets a string s in the given base (0, 2 to 36) and bit size (0 to 64) and returns the corresponding value i.
 * The string may begin with a leading sign: "+" or "-".
 * @param s 
 * @param base If the base argument is 0, the true base is implied by the string's prefix following the sign (if present): 2 for "0b", 8 for "0" or "0o", 16 for "0x", and 10 otherwise. Also, for argument base 0 only, underscore characters are permitted as defined by the Go syntax for integer literals.
 * @param bitSize The bitSize argument specifies the integer type that the result must fit into. Bit sizes 0, 8, 16, 32, and 64 correspond to int, int8, int16, int32, and int64. If bitSize is below 0 or above 64, an error is throw.
 */
export function parseInt(s: string, base = 0, bitSize = 64, toString?: boolean): number {
    return deps.parseInt({
        _throw: throwError,
        _fn: 'parseInt',
        input: s,
        base: base,
        bitSize: bitSize,
        toString: toString ? true : false,
    })
}

/**
 * Reports whether the rune is defined as a Graphic by Unicode. Such
 * characters include letters, marks, numbers, punctuation, symbols, and
 * spaces, from categories L, M, N, P, S, and Zs.
 */
export function isGraphic(r: number): boolean {
    return deps.isGraphic(r)
}
/**
 * Reports whether the rune is defined as printable by Go, with
 * the same definition as unicode.IsPrint: letters, numbers, punctuation,
 * symbols and ASCII space.
 */
export function isPrint(r: number): boolean {
    return deps.isPrint(r)
}
/**
 * Reports whether the string s can be represented unchanged as 
 * a single-line backquoted string without control characters other than tab.
 */
export function canBackquote(s: string | Uint8Array): boolean {
    return deps.canBackquote(s)
}

/**
 * Returns a double-quoted string literal representing s. The
 * returned string uses escape sequences (\t, \n, \xFF, \u0100) for
 *  control characters and non-printable characters as defined by
 * isPrint.
 */
export function quote(s: string | Uint8Array, bytes?: boolean): string | Uint8Array {
    const cap = deps.len(s)
    let [buf, len] = deps.appendQuotedWith({
        buf: cap == 0 ? undefined : new Uint8Array(cap * 3 / 2),
        len: 0,
        s: s,
        quote: 34, // `"`
        ASCIIonly: false,
        graphicOnly: false,
    })
    if (buf) {
        buf = buf.length == len ? buf : buf.subarray(0, len)
        return bytes ? buf : new TextDecoder().decode(buf)
    }
    return bytes ? new Uint8Array() : ""
}
/**
 * returns a double-quoted string literal representing s. 
 * The returned string uses escape sequences (\t, \n, \xFF, \u0100) for non-ASCII characters 
 * and non-printable characters as defined by isPrint.
 */
export function quoteToASCII(s: string | Uint8Array, bytes?: boolean): string | Uint8Array {
    const cap = deps.len(s)
    let [buf, len] = deps.appendQuotedWith({
        buf: cap == 0 ? undefined : new Uint8Array(cap * 3 / 2),
        len: 0,
        s: s,
        quote: 34, // `"`
        ASCIIonly: true,
        graphicOnly: false,
    })
    if (buf) {
        buf = buf.length == len ? buf : buf.subarray(0, len)
        return bytes ? buf : new TextDecoder().decode(buf)
    }
    return bytes ? new Uint8Array() : ""
}
/**
 * Returns a double-quoted string literal representing s. 
 * The returned string leaves Unicode graphic characters, as defined by IsGraphic, 
 * unchanged and uses escape sequences (\t, \n, \xFF, \u0100) for non-graphic characters.
 */
export function quoteToGraphic(s: string | Uint8Array, bytes?: boolean): string | Uint8Array {
    const cap = deps.len(s)
    let [buf, len] = deps.appendQuotedWith({
        buf: cap == 0 ? undefined : new Uint8Array(cap * 3 / 2),
        len: 0,
        s: s,
        quote: 34, // `"`
        ASCIIonly: false,
        graphicOnly: true,
    })
    if (buf) {
        buf = buf.length == len ? buf : buf.subarray(0, len)
        return bytes ? buf : new TextDecoder().decode(buf)
    }
    return bytes ? new Uint8Array() : ""
}

/**
 * Returns a single-quoted character literal representing the rune. 
 * The returned string uses escape sequences (\t, \n, \xFF, \u0100) for 
 * control characters and non-printable characters as defined by isPrint. 
 * if r is not a valid Unicode code point, it is interpreted as the Unicode replacement 
 * character U+FFFD.
 */
export function quoteRune(r: number, bytes?: boolean): string | Uint8Array {
    let [buf, len] = deps.appendQuotedRuneWith({
        r: r,
        quote: 39,// `'`
        ASCIIonly: false,
        graphicOnly: false,
    })
    if (buf) {
        buf = buf.length == len ? buf : buf.subarray(0, len)
        return bytes ? buf : new TextDecoder().decode(buf)
    }
    return bytes ? new Uint8Array() : ""
}
/**
 * Returns a single-quoted character literal representing the rune. 
 * The returned string uses escape sequences (\t, \n, \xFF, \u0100) for non-ASCII characters 
 * and non-printable characters as defined by isPrint. If r is not a valid Unicode code point, 
 * it is interpreted as the Unicode replacement character U+FFFD.
 */
export function quoteRuneToASCII(r: number, bytes?: boolean): string | Uint8Array {
    let [buf, len] = deps.appendQuotedRuneWith({
        r: r,
        quote: 39,// `'`
        ASCIIonly: true,
        graphicOnly: false,
    })
    if (buf) {
        buf = buf.length == len ? buf : buf.subarray(0, len)
        return bytes ? buf : new TextDecoder().decode(buf)
    }
    return bytes ? new Uint8Array() : ""
}
/**
 * Returns a single-quoted character literal representing the rune. 
 * If the rune is not a Unicode graphic character, as defined by isGraphic, 
 * the returned string will use a escape sequence (\t, \n, \xFF, \u0100). 
 * If r is not a valid Unicode code point, it is interpreted as the Unicode replacement character U+FFFD.
 */
export function quoteRuneToGraphic(r: number, bytes?: boolean): string | Uint8Array {
    let [buf, len] = deps.appendQuotedRuneWith({
        r: r,
        quote: 39,// `'`
        ASCIIonly: false,
        graphicOnly: true,
    })
    if (buf) {
        buf = buf.length == len ? buf : buf.subarray(0, len)
        return bytes ? buf : new TextDecoder().decode(buf)
    }
    return bytes ? new Uint8Array() : ""
}

/**
 * used to build string
 */
export class StringBuilder {
    private buf_?: Uint8Array
    private len_: number
    /**
     * 
     * @param buf optional buffer
     */
    constructor(buf?: Uint8Array, len?: number) {
        if (buf === undefined || buf === null) {
        } else if (!(buf instanceof Uint8Array)) {
            throw new Error("buf must instanceof Uint8Array")
        } else if (buf.length > 0) {
            this.buf_ = buf
            if (len && len <= buf.length) {
                this.len_ = len
                return
            }
        }
        this.len_ = 0
    }

    /**
     * Returns the encoded string
     */
    toString(): string {
        let s = this.str_
        if (s === undefined) {
            const len = this.len_
            if (len) {
                const buf = this.buf_!
                s = new TextDecoder().decode(buf.length == len ? buf : buf.subarray(0, len))
            } else {
                s = ""
            }
            this.str_ = s
        }
        return s
    }
    private str_?: string
    /**
     * Returns the encoded length in bytes
     */
    get length(): number {
        return this.len_
    }
    /**
     * Returns the encoded byte array
     */
    toBuffer(): Uint8Array | undefined {
        const len = this.len_
        if (len) {
            const buf = this.buf_!
            return buf.length == len ? buf : buf.subarray(0, len)
        }
    }
    /**
     * Return buffer
     */
    get buffer(): Uint8Array | undefined {
        return this.buf_
    }
    /**
     * reset buffer
     */
    reset(buffer?: Uint8Array, len?: number): StringBuilder {
        if (buffer === undefined || buffer === null) {
            this.len_ = 0
        } else if (buffer instanceof Uint8Array) {
            if (typeof len === "number" && Number.isSafeInteger(len)) {
                if (len > 0) {
                    if (len <= buffer.length) {
                        this.len_ = len
                    } else {
                        this.len_ = buffer.length
                    }
                } else {
                    this.len_ = 0
                }
            }
        } else {
            throw new Error("buffer must instanceof Uint8Array")
        }
        this.str_ = undefined
        return this
    }
    append(val: Uint8Array | string): StringBuilder {
        try {
            const [buf, len] = deps.append(val,
                this.buf_,
                this.len_,
            )
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.append',
                input: val,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    /**
     * Encode rune to end of buffer.
     * If the rune is out of range, it appends the encoding of RuneError.
     */
    appendRune(...r: Array<number>): StringBuilder {
        if (r.length > 0) {
            try {
                const [buf, len] = deps.appendRune(r,
                    this.buf_,
                    this.len_,
                )
                this.buf_ = buf
                this.len_ = len
            } catch (e) {
                throw new NumError({
                    func: 'StringBuilder.appendRune',
                    input: r,
                    err: e,
                })
            }
        }
        this.str_ = undefined
        return this
    }
    /**
     * Appends "true" or "false", according to the value of b, to dst
     */
    appendBool(...values: Array<any>): StringBuilder {
        if (values.length > 0) {
            try {
                const [buf, len] = deps.appendBool(values,
                    this.buf_,
                    this.len_,
                )
                this.buf_ = buf
                this.len_ = len
            } catch (e) {
                throw new NumError({
                    func: 'StringBuilder.appendBool',
                    input: values,
                    err: e,
                })
            }
        }
        this.str_ = undefined
        return this
    }
    /**
     * Appends the string form of the integer i,
     * as generated by formatInt.
     */
    appendInt(i: number, base = 10): StringBuilder {
        if (!Number.isSafeInteger(base) || base < deps.minBase || base > deps.maxBase) {
            throw new NumError({
                func: 'StringBuilder.appendInt',
                input: i,
                err: new Error(`invalid base ${base}`),
            })
        }

        try {
            const [buf, len] = deps.appendInt(
                this.buf_, this.len_,
                i, base,
            )
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendInt',
                input: i,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    _appendInt(i: string, base = 10): StringBuilder {
        if (!Number.isSafeInteger(base) || base < deps.minBase || base > deps.maxBase) {
            throw new NumError({
                func: 'StringBuilder._appendInt',
                input: i,
                err: new Error(`invalid base ${base}`),
            })
        }

        try {
            const [buf, len] = deps._appendInt(
                this.buf_, this.len_,
                i, base,
            )
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder._appendInt',
                input: i,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    /**
     * Appends the string form of the integer i,
     * as generated by formatInt.
     */
    appendUint(i: number, base = 10): StringBuilder {
        if (!Number.isSafeInteger(base) || base < deps.minBase || base > deps.maxBase) {
            throw new NumError({
                func: 'StringBuilder.appendUint',
                input: i,
                err: new Error(`invalid base ${base}`),
            })
        }

        try {
            const [buf, len] = deps.appendUint(
                this.buf_, this.len_,
                i, base,
            )
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendUint',
                input: i,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    _appendUint(i: string, base = 10): StringBuilder {
        if (!Number.isSafeInteger(base) || base < deps.minBase || base > deps.maxBase) {
            throw new NumError({
                func: 'StringBuilder._appendUint',
                input: i,
                err: new Error(`invalid base ${base}`),
            })
        }

        try {
            const [buf, len] = deps._appendUint(
                this.buf_, this.len_,
                i, base,
            )
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder._appendUint',
                input: i,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    /**
     * appends a double-quoted string literal representing s,
     * as generated by quote.
     */
    appendQuote(s: string | Uint8Array): StringBuilder {
        try {
            if (!this.buf_) {
                const len = deps.len(s)
                if (len) {
                    this.buf_ = new Uint8Array(len * 3 / 2)
                }
            }
            const [buf, len] = deps.appendQuotedWith({
                buf: this.buf_,
                len: this.len_,
                s: s,
                quote: 34, // `"`
                ASCIIonly: false,
                graphicOnly: false,
            })
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendQuote',
                input: s,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    /**
     * Appends a double-quoted  string literal representing s,
     * as generated by quoteToASCII.
     */
    appendQuoteToASCII(s: string | Uint8Array): StringBuilder {
        try {
            if (!this.buf_) {
                const len = deps.len(s)
                if (len) {
                    this.buf_ = new Uint8Array(len * 3 / 2)
                }
            }
            const [buf, len] = deps.appendQuotedWith({
                buf: this.buf_,
                len: this.len_,
                s: s,
                quote: 34, // `"`
                ASCIIonly: true,
                graphicOnly: false,
            })
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendQuoteToASCII',
                input: s,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    /**
     * Appends a double-quoted string literal representing s, 
     * as generated by QuoteToGraphic.
     */
    appendQuoteToGraphic(s: string | Uint8Array): StringBuilder {
        try {
            if (!this.buf_) {
                const len = deps.len(s)
                if (len) {
                    this.buf_ = new Uint8Array(len * 3 / 2)
                }
            }
            const [buf, len] = deps.appendQuotedWith({
                buf: this.buf_,
                len: this.len_,
                s: s,
                quote: 34, // `"`
                ASCIIonly: false,
                graphicOnly: true,
            })
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendQuoteToGraphic',
                input: s,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    /**
     * Appends a single-quoted character literal representing the rune, 
     * as generated by quoteRune
     */
    appendQuoteRune(r: number): StringBuilder {
        try {
            const [buf, len] = deps.appendQuotedRuneWith({
                buf: this.buf_,
                len: this.len_,
                r: r,
                quote: 39, // `'`
                ASCIIonly: false,
                graphicOnly: false,
            })
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendQuoteRune',
                input: r,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    /**
     * Appends a single-quoted character literal representing the rune, 
     * as generated by quoteRuneToASCII
     */
    appendQuoteRuneToASCII(r: number): StringBuilder {
        try {
            const [buf, len] = deps.appendQuotedRuneWith({
                buf: this.buf_,
                len: this.len_,
                r: r,
                quote: 39, // `'`
                ASCIIonly: true,
                graphicOnly: false,
            })
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendQuoteRuneToASCII',
                input: r,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
    /**
     * Appends a single-quoted character literal representing the rune, 
     * as generated by quoteRuneToGraphic
     */
    appendQuoteRuneToGraphic(r: number): StringBuilder {
        try {
            const [buf, len] = deps.appendQuotedRuneWith({
                buf: this.buf_,
                len: this.len_,
                r: r,
                quote: 39, // `'`
                ASCIIonly: false,
                graphicOnly: true,
            })
            this.buf_ = buf
            this.len_ = len
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendQuoteRuneToGraphic',
                input: r,
                err: e,
            })
        }
        this.str_ = undefined
        return this
    }
}
function subarray(data: Uint8Array, begin?: number, end?: number): Uint8Array {
    return data.subarray(begin, end)
}
/**
 * Returns the quoted string (as understood by Unquote) at the prefix of s. 
 * If s does not start with a valid quoted string, throw an error.
 */
export function quotedPrefix(s: string | Uint8Array): string | Uint8Array {
    return deps.unquote(subarray, s, false)
}
/**
 * Interprets s as a single-quoted, double-quoted,
 * or backquoted Go string literal, returning the string value
 * that s quotes.  (If s is single-quoted, it would be a 
 * character literal; Unquote returns the corresponding
 * one-character string.)
 */
export function unquote(s: string | Uint8Array): string | Uint8Array {
    return deps.unquote(subarray, s, true)
}
/**
 * Decodes the first character or byte in the escaped string
 * or character literal represented by the string s.
 * It returns four values:
 * 
 * 1. value, the decoded Unicode code point or byte value;
 * 2. multibyte, a boolean indicating whether the decoded character requires a multibyte UTF-8 representation;
 * 3. tail, the remainder of the string after the character; and
 * 4. an error that will be nil if the character is syntactically valid.
 * 
 * The second argument, quote, specifies the type of literal being parsed
 * and therefore which escaped quote character is permitted.
 * If set to a single quote, it permits the sequence \' and disallows unescaped '.
 * If set to a double quote, it permits \" and disallows unescaped ".
 * If set to zero, it does not permit either escape and allows both quote characters to appear unescaped.
 */
export function unquoteChar(s: string | Uint8Array, quote: number): {
    value: number,
    multibyte: boolean,
    tail: string | Uint8Array,
} {
    return deps.unquoteChar(subarray, s, quote)
}