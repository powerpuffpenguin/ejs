declare namespace deps {
    function toString(b: Uint8Array): string
    function toBuffer(s: string): Uint8Array

    function append(val: Uint8Array, buf: Uint8Array | undefined, len: number): [Uint8Array, number]

    function appendRune(r: Array<number>, buf: Uint8Array | undefined, len: number): [Uint8Array, number]
    function appendBool(vals: Array<boolean>, buf: Uint8Array | undefined, len: number): [Uint8Array, number]
    function formatFloat(f: number, fmt: number, prec: number, bitSize: number): Uint8Array
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
 * Converts the floating-point number f to a string, according to the format fmt and precision prec. It rounds the result assuming that the original was obtained from a floating-point value of bitSize bits (32 for float32, 64 for float64)
 * 
 * The format fmt is one of
 *   - 'b' (-ddddp±ddd, a binary exponent),
 *   - 'e' (-d.dddde±dd, a decimal exponent),
 *   - 'E' (-d.ddddE±dd, a decimal exponent),
 *   - 'f' (-ddd.dddd, no exponent),
 *   - 'g' ('e' for large exponents, 'f' otherwise),
 *   - 'G' ('E' for large exponents, 'f' otherwise),
 *   - 'x' (-0xd.ddddp±ddd, a hexadecimal fraction and binary exponent), or
 *   - 'X' (-0Xd.ddddP±ddd, a hexadecimal fraction and binary exponent).
 * 
 * The precision prec controls the number of digits (excluding the exponent)
 * printed by the 'e', 'E', 'f', 'g', 'G', 'x', and 'X' formats.
 * For 'e', 'E', 'f', 'x', and 'X', it is the number of digits after the decimal point.
 * For 'g' and 'G' it is the maximum number of significant digits (trailing
 * zeros are removed).
 * The special precision -1 uses the smallest number of digits
 * necessary such that ParseFloat will return f exactly.
 */
export function formatFloat(f: number, fmt: number, prec: number, bitSize: number): string {
    return deps.toString(deps.formatFloat(f, fmt, prec, bitSize))
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
            const [buf, len] = deps.appendRune(r,
                this.buf_,
                this.len_,
            )
            this.buf_ = buf
            this.len_ = len
        }
        return this
    }
    /**
     * Appends "true" or "false", according to the value of b, to dst
     */
    appendBool(...values: Array<any>): StringBuilder {
        if (values.length > 0) {
            const [buf, len] = deps.appendBool(values,
                this.buf_,
                this.len_,
            )
            this.buf_ = buf
            this.len_ = len
        }
        return this
    }
    /**
     *  Appends the string form of the floating-point number f,
     * as generated by FormatFloat, to dst and returns the extended buffer.
     */
    appendFloat(f: number, fmt: number, prec: number, bitSize: number): StringBuilder {
        const value = deps.formatFloat(f, fmt, prec, bitSize)
        const [buf, len] = deps.append(value,
            this.buf_,
            this.len_,
        )
        this.buf_ = buf
        this.len_ = len
        return this
    }
}