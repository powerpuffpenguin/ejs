declare namespace deps {
    function nget8(isInt: boolean, b: Uint8Array, byteOffset: number): number
    function nget16(bigEndian: boolean, isInt: boolean, b: Uint8Array, byteOffset: number): number
    function nget32(bigEndian: boolean, isInt: boolean, b: Uint8Array, byteOffset: number): number
    function nget64(bigEndian: boolean, isInt: boolean, b: Uint8Array, byteOffset: number): number | string
    function nput8(isInt: boolean, dst: Uint8Array, byteOffset: number, val: number | string): void
    function nput16(bigEndian: boolean, isInt: boolean, dst: Uint8Array, byteOffset: number, val: number | string): void
    function nput32(bigEndian: boolean, isInt: boolean, dst: Uint8Array, byteOffset: number, val: number | string): void
    function nput64(bigEndian: boolean, isInt: boolean, dst: Uint8Array, byteOffset: number, val: number | string): void
    function byteLen(b: Uint8Array): number
}
/**
 * A ByteOrder specifies how to convert Uint8Array into
 * 16-, 32-, or 64-bit unsigned integers.
 */
export interface ByteOrder {
    getUint8(b: Uint8Array, byteOffset: number): number
    getUint16(b: Uint8Array, byteOffset: number): number
    getUint32(b: Uint8Array, byteOffset: number): number
    getUint64(b: Uint8Array, byteOffset: number): number | string
    setUint8(dst: Uint8Array, byteOffset: number, val: number | string): void
    setUint16(dst: Uint8Array, byteOffset: number, val: number | string): void
    setUint32(dst: Uint8Array, byteOffset: number, val: number | string): void
    setUint64(dst: Uint8Array, byteOffset: number, val: number | string): void

    getInt8(b: Uint8Array, byteOffset: number): number
    getInt16(b: Uint8Array, byteOffset: number): number
    getInt32(b: Uint8Array, byteOffset: number): number
    getInt64(b: Uint8Array, byteOffset: number): number | string
    setInt8(dst: Uint8Array, byteOffset: number, val: number | string): void
    setInt16(dst: Uint8Array, byteOffset: number, val: number | string): void
    setInt32(dst: Uint8Array, byteOffset: number, val: number | string): void
    setInt64(dst: Uint8Array, byteOffset: number, val: number | string): void
}
class byteOrder implements ByteOrder {
    constructor(readonly bigEndian: boolean) { }
    getUint8(b: Uint8Array, byteOffset: number): number {
        return deps.nget8(false, b, byteOffset)
    }
    getUint16(b: Uint8Array, byteOffset: number): number {
        return deps.nget16(this.bigEndian, false, b, byteOffset)
    }
    getUint32(b: Uint8Array, byteOffset: number): number {
        return deps.nget32(this.bigEndian, false, b, byteOffset)
    }
    getUint64(b: Uint8Array, byteOffset: number): number | string {
        return deps.nget64(this.bigEndian, false, b, byteOffset)
    }
    setUint8(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput8(false, dst, byteOffset, val)
    }
    setUint16(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput16(this.bigEndian, false, dst, byteOffset, val)
    }
    setUint32(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput32(this.bigEndian, false, dst, byteOffset, val)
    }
    setUint64(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput64(this.bigEndian, false, dst, byteOffset, val)
    }

    getInt8(b: Uint8Array, byteOffset: number): number {
        return deps.nget8(true, b, byteOffset)
    }
    getInt16(b: Uint8Array, byteOffset: number): number {
        return deps.nget16(this.bigEndian, true, b, byteOffset)
    }
    getInt32(b: Uint8Array, byteOffset: number): number {
        return deps.nget32(this.bigEndian, true, b, byteOffset)
    }
    getInt64(b: Uint8Array, byteOffset: number): number | string {
        return deps.nget64(this.bigEndian, true, b, byteOffset)
    }
    setInt8(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput8(true, dst, byteOffset, val)
    }
    setInt16(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput16(this.bigEndian, true, dst, byteOffset, val)
    }
    setInt32(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput32(this.bigEndian, true, dst, byteOffset, val)
    }
    setInt64(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput64(this.bigEndian, true, dst, byteOffset, val)
    }
}
export const LittleEndian = new byteOrder(false)
export const BigEndian = new byteOrder(true)

export class DataView {
    constructor(readonly buffer: Uint8Array) {
        deps.byteLen(buffer)
    }
    get byteLength(): number {
        return deps.byteLen(this.buffer)
    }
    getUint8(byteOffset: number): number {
        return deps.nget8(false, this.buffer, byteOffset)
    }
    getUint16(byteOffset: number, littleEndian?: boolean): number {
        return deps.nget16(littleEndian ? false : true, false, this.buffer, byteOffset)
    }
    getUint32(byteOffset: number, littleEndian?: boolean): number {
        return deps.nget32(littleEndian ? false : true, false, this.buffer, byteOffset)
    }
    getUint64(byteOffset: number, littleEndian?: boolean): number | string {
        return deps.nget32(littleEndian ? false : true, false, this.buffer, byteOffset)
    }
    setUint8(byteOffset: number, val: number | string): void {
        deps.nput8(false, this.buffer, byteOffset, val)
    }
    setUint16(byteOffset: number, val: number | string, littleEndian?: boolean): void {
        deps.nput16(littleEndian ? false : true, false, this.buffer, byteOffset, val)
    }
    setUint32(byteOffset: number, val: number | string, littleEndian?: boolean): void {
        deps.nput32(littleEndian ? false : true, false, this.buffer, byteOffset, val)
    }
    setUint64(byteOffset: number, val: number | string, littleEndian?: boolean): void {
        deps.nput64(littleEndian ? false : true, false, this.buffer, byteOffset, val)
    }

    getInt8(byteOffset: number): number {
        return deps.nget8(true, this.buffer, byteOffset)
    }
    getInt16(byteOffset: number, littleEndian?: boolean): number {
        return deps.nget16(littleEndian ? false : true, true, this.buffer, byteOffset)
    }
    getInt32(byteOffset: number, littleEndian?: boolean): number {
        return deps.nget32(littleEndian ? false : true, true, this.buffer, byteOffset)
    }
    getInt64(byteOffset: number, littleEndian?: boolean): number | string {
        return deps.nget64(littleEndian ? false : true, true, this.buffer, byteOffset)
    }
    setInt8(byteOffset: number, val: number | string): void {
        deps.nput8(true, this.buffer, byteOffset, val)
    }
    setInt16(byteOffset: number, val: number | string, littleEndian?: boolean): void {
        deps.nput16(littleEndian ? false : true, true, this.buffer, byteOffset, val)
    }
    setInt32(byteOffset: number, val: number | string, littleEndian?: boolean): void {
        deps.nput32(littleEndian ? false : true, true, this.buffer, byteOffset, val)
    }
    setInt64(byteOffset: number, val: number | string, littleEndian?: boolean): void {
        deps.nput64(littleEndian ? false : true, true, this.buffer, byteOffset, val)
    }
}