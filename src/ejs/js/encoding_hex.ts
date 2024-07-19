declare namespace deps {
    function encodedLen(n: number | string | Uint8Array): number
    function decodedLen(x: number | string | Uint8Array): number
    function encode(dst: Uint8Array, src: string | Uint8Array, uppercase: boolean): number
    function encodeToString(src: string | Uint8Array, uppercase: boolean): string
    function decode(dst: Uint8Array, src: string | Uint8Array): number
    function isHex(v: string | Uint8Array | number): boolean
}
export function encodedLen(n: number | string | Uint8Array) {
    return deps.encodedLen(n)
}

export function decodedLen(x: number | string | Uint8Array): number {
    return deps.decodedLen(x)
}
/**
 * Encodes src into dst. It returns the numberof bytes written to dst, 
 */
export function encode(dst: Uint8Array, src: string | Uint8Array, uppercase = false): number {
    return deps.encode(dst, src, uppercase ? true : false)
}
/**
 * Returns the hexadecimal encoding of src.
 */
export function encodeToString(src: string | Uint8Array, uppercase = false): string {
    return deps.encodeToString(src, uppercase ? true : false)
}
/**
 * Decodes src into dst,
 * returning the actual number of bytes written to dst.
 * 
 * Decode expects that src contains only hexadecimal
 * characters and that src has even length.
 * If the input is malformed, Decode returns the number
 * of bytes decoded before the error.
 * 
 * You can tell if an error occurred by min(decodedLen(x),dst.length) == returns.
 */
export function decode(dst: Uint8Array, src?: string | Uint8Array): number | Uint8Array {
    if (src === null || src === undefined) {
        const buf = new Uint8Array(deps.decodedLen(dst))
        if (buf.length == 0) {
            return buf
        }
        const n = deps.decode(buf, dst)
        return n == buf.length ? buf : buf.subarray(0, n)
    }
    return deps.decode(dst, src)
}
export function isHex(v: string | Uint8Array | number): boolean {
    return deps.isHex(v)
}