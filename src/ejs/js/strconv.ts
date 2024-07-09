declare namespace deps {
    class BufferData {
        readonly __id = "BufferData"
    }
    function toBuffer(s: string): Uint8Array
}
/**
 * Convert v to a string Uint8Array, useful for getting utf8 byte data of string
 */
export function toBuffer(v: string): Uint8Array {
    return deps.toBuffer(v)
}
