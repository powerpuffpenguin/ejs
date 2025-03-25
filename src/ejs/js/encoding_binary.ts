declare namespace deps {
    function nget16(bigEndian: boolean, isInt: boolean, b: Uint8Array, byteOffset: number): number
    function nget32(bigEndian: boolean, isInt: boolean, b: Uint8Array, byteOffset: number): number
    function nget64(bigEndian: boolean, isInt: boolean, b: Uint8Array, byteOffset: number): number | string
    function nput16(bigEndian: boolean, isInt: boolean, dst: Uint8Array, byteOffset: number, val: number): void
    function nput32(bigEndian: boolean, isInt: boolean, dst: Uint8Array, byteOffset: number, val: number): void
    function nput64(bigEndian: boolean, isInt: boolean, dst: Uint8Array, byteOffset: number, val: number | string): void

}
/**
 * A ByteOrder specifies how to convert Uint8Array into
 * 16-, 32-, or 64-bit unsigned integers.
 */
export interface ByteOrder {
    uint16(b: Uint8Array, byteOffset: number): number
    uint32(b: Uint8Array, byteOffset: number): number
    uint64(b: Uint8Array, byteOffset: number): number | string
    putUint16(dst: Uint8Array, byteOffset: number, val: number): void
    putUint32(dst: Uint8Array, byteOffset: number, val: number): void
    putUint64(dst: Uint8Array, byteOffset: number, val: number | string): void

    int16(b: Uint8Array, byteOffset: number): number
    int32(b: Uint8Array, byteOffset: number): number
    int64(b: Uint8Array, byteOffset: number): number | string
    putInt16(dst: Uint8Array, byteOffset: number, val: number): void
    putInt32(dst: Uint8Array, byteOffset: number, val: number): void
    putInt64(dst: Uint8Array, byteOffset: number, val: number | string): void
}
class byteOrder implements ByteOrder {
    constructor(readonly bigEndian: boolean) { }
    uint16(b: Uint8Array, byteOffset: number): number {
        return deps.nget16(this.bigEndian, false, b, byteOffset)
    }
    uint32(b: Uint8Array, byteOffset: number): number {
        return deps.nget32(this.bigEndian, false, b, byteOffset)
    }
    uint64(b: Uint8Array, byteOffset: number): number | string {
        return deps.nget64(this.bigEndian, false, b, byteOffset)
    }
    putUint16(dst: Uint8Array, byteOffset: number, val: number): void {
        deps.nput16(this.bigEndian, false, dst, byteOffset, val)
    }
    putUint32(dst: Uint8Array, byteOffset: number, val: number): void {
        deps.nput32(this.bigEndian, false, dst, byteOffset, val)
    }
    putUint64(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput64(this.bigEndian, false, dst, byteOffset, val)
    }

    int16(b: Uint8Array, byteOffset: number): number {
        return deps.nget16(this.bigEndian, true, b, byteOffset)
    }
    int32(b: Uint8Array, byteOffset: number): number {
        return deps.nget32(this.bigEndian, true, b, byteOffset)
    }
    int64(b: Uint8Array, byteOffset: number): number | string {
        return deps.nget64(this.bigEndian, true, b, byteOffset)
    }
    putInt16(dst: Uint8Array, byteOffset: number, val: number): void {
        deps.nput16(this.bigEndian, true, dst, byteOffset, val)
    }
    putInt32(dst: Uint8Array, byteOffset: number, val: number): void {
        deps.nput32(this.bigEndian, true, dst, byteOffset, val)
    }
    putInt64(dst: Uint8Array, byteOffset: number, val: number | string): void {
        deps.nput64(this.bigEndian, true, dst, byteOffset, val)
    }
}
export const LittleEndian = new byteOrder(false)
export const BigEndian = new byteOrder(true)
