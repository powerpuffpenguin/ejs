declare namespace deps {
    class Pointer {
        readonly __id = "pointer"
    }
    class Desc {
        readonly __id = "desc"
    }
    class HashState {
        readonly __id = "hash_state"
        p: Pointer
    }

    class Hash {
        desc: Desc
        hashsum(data?: string | Uint8Array): Uint8Array
        hashsumTo(dst: Uint8Array, data?: string | Uint8Array): number
        create(): HashState
        sum(state: Pointer, data?: string | Uint8Array): Uint8Array
        sumTo(state: Pointer, dst: Uint8Array, data?: string | Uint8Array): number
    }


    const sha3_512: Hash
    const sha3_384: Hash
    const sha3_256: Hash
    const sha3_224: Hash

    const sha512: Hash
    const sha384: Hash
    const sha512_256: Hash
    const sha512_224: Hash
    const sha256: Hash
    const sha224: Hash
    const sha1: Hash

    const md5: Hash

    function hashsize(h: Desc): number
    function blocksize(h: Desc): number
    function process(h: Desc, state: Pointer, data?: string | Uint8Array): void
    function reset(h: Desc, state: Pointer): void
    function done(h: Desc, state: Pointer, data?: string | Uint8Array): Uint8Array
    function doneTo(h: Desc, state: Pointer, dst: Uint8Array, data?: string | Uint8Array): number
}
export class Hash {
    private state: deps.HashState
    protected constructor(private readonly hash: deps.Hash) {
        this.hashsize = deps.hashsize(this.hash.desc)
        this.blocksize = deps.blocksize(this.hash.desc)
        this.state = hash.create()
    }
    /**
     * Bytes of digest
     */
    readonly hashsize: number
    /**
     * The hash's underlying block size.
     * The Write method must be able to accept any amount
     * of data, but it may operate more efficiently if all writes
     * are a multiple of the block size
     */
    readonly blocksize: number
    /**
     *  Resets the hash to its initial state.
     */
    reset() {
        deps.reset(this.hash.desc, this.state.p)
    }
    /**
     * Append data to hash
     */
    write(data?: string | Uint8Array): void {
        deps.process(this.hash.desc, this.state.p, data)
    }
    /**
     * Append data to hash and returns the resulting.
     * It does not change the underlying hash state.
     */
    sum(data?: string | Uint8Array): Uint8Array {
        const hash = this.hash
        return hash.sum(this.state.p, data)
    }

    /**
     * Similar to sum but writes the hash value to dst
     * @returns hashsize
     */
    sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        const hash = this.hash
        return hash.sumTo(this.state.p, dst, data)
    }

    /**
     * Append data to hash and returns the resulting.
     * Once this function is called, you must call reset to correctly recalculate the hash.
     */
    done(data?: string | Uint8Array): Uint8Array {
        return deps.done(this.hash.desc, this.state.p, data)
    }
    /**
     * Similar to done but writes the hash value to dst
     * @returns hashsize
     */
    doneTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.doneTo(this.hash.desc, this.state.p, dst, data)
    }
}
export class MD5 extends Hash {
    /**
     * The size of an MD5 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.md5.desc)
    }
    /**
     * The blocksize of MD5 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.md5.desc)
    }
    /**
     * return MD5 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.md5.hashsum(data)
    }
    /**
     * Write MD5 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.md5.hashsumTo(dst, data)
    }

    constructor() {
        super(deps.md5)
    }
}
