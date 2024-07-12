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

    function append(val: Uint8Array, buf: Uint8Array | undefined, len: number): [Uint8Array, number]

    function appendRune(r: Array<number>, buf: Uint8Array | undefined, len: number): [Uint8Array, number]

    function appendBool(vals: Array<boolean>, buf: Uint8Array | undefined, len: number): [Uint8Array, number]
    interface ParseBoolOptions extends Options {
        input: string
    }
    function parseBool(opts: ParseBoolOptions): boolean
    interface FormatUintOptions extends Options {
        input: number
        base: number
    }
    function formatUint(opts: FormatUintOptions): string
    function formatInt(opts: FormatUintOptions): string

    function appendUint(buf: Uint8Array | undefined, len: number, i: number, base?: number): [Uint8Array, number]
    function appendInt(buf: Uint8Array | undefined, len: number, i: number, base?: number): [Uint8Array, number]

    interface ParseUintOptions extends Options {
        input: string
        base: number
        bitSize: number
    }
    function parseUint(opts: ParseUintOptions): number
    function parseInt(opts: ParseUintOptions): number
    interface FastAtoIOptions extends Options {
        input: string
    }
    function fast_atoi(opts: FastAtoIOptions): number
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
/**
 * Like parseInt but for unsigned numbers.
 * A sign prefix is not permitted.
 */
export function parseUint(s: string, base = 0, bitSize = 64): number {
    return deps.parseUint({
        _throw: throwError,
        _fn: 'parseUint',
        input: s,
        base: base,
        bitSize: bitSize,
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
/**
 * equivalent to parseInt(s, 10, 0), converted to type int.
 */
export function atoi(s: string): number {
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
    })
}
/**
 * Interprets a string s in the given base (0, 2 to 36) and bit size (0 to 64) and returns the corresponding value i.
 * The string may begin with a leading sign: "+" or "-".
 * @param s 
 * @param base If the base argument is 0, the true base is implied by the string's prefix following the sign (if present): 2 for "0b", 8 for "0" or "0o", 16 for "0x", and 10 otherwise. Also, for argument base 0 only, underscore characters are permitted as defined by the Go syntax for integer literals.
 * @param bitSize The bitSize argument specifies the integer type that the result must fit into. Bit sizes 0, 8, 16, 32, and 64 correspond to int, int8, int16, int32, and int64. If bitSize is below 0 or above 64, an error is throw.
 */
export function parseInt(s: string, base = 0, bitSize = 64): number {
    return deps.parseInt({
        _throw: throwError,
        _fn: 'parseInt',
        input: s,
        base: base,
        bitSize: bitSize,
    })
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
        const len = this.len_
        if (len) {
            const buf = this.buf_!
            return new TextDecoder().decode(buf.length == len ? buf : buf.subarray(0, len))
        }
        return ""
    }
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
            return this
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendInt',
                input: i,
                err: e,
            })
        }
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
            return this
        } catch (e) {
            throw new NumError({
                func: 'StringBuilder.appendUint',
                input: i,
                err: e,
            })
        }
    }
}