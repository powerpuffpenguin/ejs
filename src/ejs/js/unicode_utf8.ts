declare namespace deps {
    function append_rune(r: Array<number>, buf: Uint8Array | undefined, len: number): [Uint8Array, number]
    function encode(p: Uint8Array, r: number): number
    function encode_len(r: number): number
    function len(r: number): number
    function decode_last(r: Uint8Array | string): [number, number]
    function decode(r: Uint8Array | string): [number, number]
    function full(r: Uint8Array | string): boolean
    function count(p: Uint8Array | string): number
    function is_valid(p: Uint8Array | string): boolean
    function is_rune(r: Rune): boolean
}
/**
 * int32 number used to store unicode characters
 */
export type Rune = number

/**
 * the "error" Rune or "Unicode replacement character"
 */
export const RuneError: Rune = 65533
/**
 * characters below RuneSelf are represented as themselves in a single byte.
 */
export const RuneSelf: Rune = 0x80
/**
 * Maximum valid Unicode code point.
 */
export const MaxRune: Rune = 1114111
/**
 * maximum number of bytes of a UTF-8 encoded Unicode character.
 */
export const UTFMax = 4


/**
 * Encode rune to Uint8Array
 */
export class UTF8Builder {
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
    reset(): void {
        this.len_ = 0
    }
    /**
     * Encode rune to end of buffer.
     * If the rune is out of range, it appends the encoding of RuneError.
     */
    append(...r: Array<Rune>): void {
        if (r.length > 0) {
            const [buf, len] = deps.append_rune(r,
                this.buf_,
                this.len_,
            )
            this.buf_ = buf
            this.len_ = len
        }
    }
}
/**
 * Writes into p (which must be large enough) the UTF-8 encoding of the rune.
 * If the rune is out of range, it writes the encoding of RuneError.
 * It returns the number of bytes written.
 */
export function encode(p: Uint8Array, r: Rune): number {
    return deps.encode(p, r)
}
/**
 * Calculate how many bytes are needed to encode r, 
 * and return the bytes needed to encode RuneError if r is invalid
 */
export function encodeLen(r: Rune): number {
    return deps.encode_len(r)
}
/**
 * Returns the number of bytes required to encode the rune.
 * It returns -1 if the rune is not a valid value to encode in UTF-8.
 */
export function len(r: Rune): number {
    return deps.len(r)
}
/**
 * Unpacks the last UTF-8 encoding in p and returns the rune and
 * its width in bytes. If p is empty it returns (RuneError, 0). Otherwise, if
 * the encoding is invalid, it returns (RuneError, 1). Both are impossible
 * results for correct, non-empty UTF-8.
 * 
 * An encoding is invalid if it is incorrect UTF-8, encodes a rune that is
 * out of range, or is not the shortest possible UTF-8 encoding for the
 * value. No other validation is performed.
 */
export function decodeLast(p: Uint8Array | string): [/*r:*/Rune, /*size:*/ number] {
    return deps.decode_last(p)
}
/**
 * Reports whether the byte could be the first byte of an encoded,
 * possibly invalid rune. Second and subsequent bytes always have the top two
 * bits set to 10.
 */
export function isStart(b: number): boolean {
    return (b & 0xC0) != 0x80 ? true : false
}
/**
 * Unpacks the first UTF-8 encoding in p and returns the rune and
 * its width in bytes. If p is empty it returns (RuneError, 0). Otherwise, if
 * the encoding is invalid, it returns (RuneError, 1). Both are impossible
 * results for correct, non-empty UTF-8.
 * 
 * An encoding is invalid if it is incorrect UTF-8, encodes a rune that is
 * out of range, or is not the shortest possible UTF-8 encoding for the
 * value. No other validation is performed.
 */
export function decode(p: Uint8Array | string): [/*r:*/Rune, /*size:*/ number] {
    return deps.decode(p)
}
/**
 * 
 * Reports whether the bytes in p begin with a full UTF-8 encoding of a rune.
 * An invalid encoding is considered a full Rune since it will convert as a width-1 error rune.
 */
export function isFull(p: Uint8Array | string): boolean {
    return deps.full(p)
}
/**
 * Returns the number of runes in p. Erroneous and short
 * encodings are treated as single runes of width 1 byte.
 */
export function count(p: Uint8Array | string): number {
    return deps.count(p)
}
/**
 * Reports whether p consists entirely of valid UTF-8-encoded runes.
 */
export function isValid(p: Uint8Array | string): boolean {
    return deps.is_valid(p)
}
/**
 * Reports whether r can be legally encoded as UTF-8.
 * Code points that are out of range or a surrogate half are illegal.
 */
export function isRune(r: Rune): boolean {
    return deps.is_rune(r)
}
/**
 * callback function called for each utf8 rune
 * @param cb If true is returned, stop continuing the callback
 */
export function forEach(p: Uint8Array, cb: (r: Rune, offset: number) => void | boolean) {
    if (!(p instanceof Uint8Array)) {
        throw new Error("p must instanceof Uint8Array")
    } else if (typeof cb !== "function") {
        throw new Error("cb must be a function")
    }

    let ret: [number, number]
    let i = 0
    while (p.length) {
        ret = deps.decode(p)
        if (cb(ret[0], i)) {
            break
        }
        i += ret[1]
        p = p.subarray(ret[1])
    }
}