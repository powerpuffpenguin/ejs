declare namespace deps {
    function encodedLen(n: number, padding: boolean): number
    function decodedLen(n: number, padding: boolean): number

    function createDecode(encoder: string): Uint8Array
    function createPadding(encode: string, padding: number | string | Uint8Array): number

    function encode(dst: Uint8Array, src: string | Uint8Array, encoder: string, padding: number): number
    function encodeToString(src: string | Uint8Array, encoder: string, padding: number): string
    function decode(dst: Uint8Array, src: string | Uint8Array, decoder: Uint8Array, padding: number): number
}
/**
 * base64 encoding
 */
export interface Encoding {
    /**
     * Returns the buffer required to encode n bytes in base64
     */
    encodedLen(n: number): number
    /**
     * Returns the length of the buffer required to decode n length base64
     */
    decodedLen(n: number): number

    /**
     * Write src to dst after base64 encoding
     * @returns the length of bytes written to dst
     */
    encode(dst: Uint8Array, src: string | Uint8Array): number
    /**
     * Returns src as a base64-encoded string
     */
    encodeToString(src: string | Uint8Array): string

    /**
     * Decode src as base64
     * @param dst 
     * @returns the length of bytes written to dst. If it is less than decodedLen, it means an illegal base64 value was encountered.
     */
    decode(dst: Uint8Array, src: string | Uint8Array): number
}
/**
 * Returns the buffer required to encode n bytes in base64
 */
export function encodedLen(n: number, padding?: boolean): number {
    return deps.encodedLen(n, padding ? true : false)
}
/**
 * Returns the length of the buffer required to decode n length base64
 */
export function decodedLen(n: number, padding?: boolean): number {
    return deps.decodedLen(n, padding ? true : false)
}
export const encodeStd = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/"
export const encodeURL = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
/**
 * Implemented base64 algorithm
 */
export class Base64 implements Encoding {
    private static std_?: Base64
    private static rawstd_?: Base64
    private static url_?: Base64
    private static rawurl_?: Base64
    static get std(): Base64 {
        let v = Base64.std_
        if (!v) {
            v = new Base64(Base64.rawstd_ ? Base64.rawstd_ : encodeStd, "=")
            Base64.std_ = v
        }
        return v
    }
    static get rawstd(): Base64 {
        let v = Base64.rawstd_
        if (!v) {
            v = new Base64(Base64.std_ ? Base64.std_ : encodeStd, 0)
            Base64.rawstd_ = v
        }
        return v
    }
    static get url(): Base64 {
        let v = Base64.url_
        if (!v) {
            v = new Base64(Base64.rawurl_ ? Base64.rawurl_ : encodeURL, "=")
            Base64.url_ = v
        }
        return v
    }
    static get rawurl(): Base64 {
        let v = Base64.rawurl_
        if (!v) {
            v = new Base64(Base64.url_ ? Base64.url_ : encodeURL, 0)
            Base64.rawurl_ = v
        }
        return v
    }

    private encoder_: string
    private decoder_: Uint8Array
    private padding_: number
    constructor(encoder: string | Base64, padding?: number | string | Uint8Array) {
        if (encoder instanceof Base64) {
            this.decoder_ = encoder.decoder_
            this.encoder_ = encoder.encoder_

            if (padding === 0) {
                this.padding_ = 0
            } else if (padding !== undefined && padding !== null) {
                this.padding_ = deps.createPadding(this.encoder_, padding)
            } else {
                this.padding_ = encoder.padding_
            }
        } else {
            this.decoder_ = deps.createDecode(encoder)
            this.encoder_ = encoder

            if (padding === 0) {
                this.padding_ = 0
            } else if (padding !== undefined && padding !== null) {
                this.padding_ = deps.createPadding(this.encoder_, padding)
            } else {
                this.padding_ = 0
            }
        }

    }
    /**
     * Returns the buffer required to encode n bytes in base64
     */
    encodedLen(n: number): number {
        return deps.encodedLen(n, this.padding_ != 0)
    }
    /**
     * Returns the length of the buffer required to decode n length base64
     */
    decodedLen(n: number): number {
        return deps.decodedLen(n, this.padding_ != 0)
    }
    /**
     * Write src to dst after base64 encoding
     * @returns the length of bytes written to dst
     */
    encode(dst: Uint8Array, src: string | Uint8Array): number {
        return deps.encode(dst, src, this.encoder_, this.padding_)
    }
    /**
     * Returns src as a base64-encoded string
     */
    encodeToString(src: string | Uint8Array): string {
        return deps.encodeToString(src, this.encoder_, this.padding_)
    }
    /**
     * Decode src as base64
     * @param dst 
     * @returns the length of bytes written to dst. If it is less than decodedLen, it means an illegal base64 value was encountered.
     */
    decode(dst: Uint8Array, src: string | Uint8Array): number {
        return deps.decode(dst, src, this.decoder_, this.padding_)
    }
}