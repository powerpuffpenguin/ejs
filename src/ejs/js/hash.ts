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
        create(state?: Pointer): HashState
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

interface AnyHash {
    clone(): AnyHash
    readonly hashsize: number
    readonly blocksize: number
    reset(): void
    write(data?: string | Uint8Array): void
    sum(data?: string | Uint8Array): Uint8Array
    sumTo(dst: Uint8Array, data?: string | Uint8Array): number
    done(data?: string | Uint8Array): Uint8Array
    doneTo(dst: Uint8Array, data?: string | Uint8Array): number
}

export class Hash {
    protected constructor(private readonly hash: AnyHash) { }
    /**
     * Create a copy of the current state hash
     * @returns A copy of the current state hash
     */
    clone(): Hash {
        return new Hash(this.hash.clone())
    }
    /**
     * Bytes of digest
     */
    get hashsize(): number {
        return this.hash.hashsize
    }
    /**
     * The hash's underlying block size.
     * The Write method must be able to accept any amount
     * of data, but it may operate more efficiently if all writes
     * are a multiple of the block size
     */
    get blocksize(): number {
        return this.hash.blocksize
    }
    /**
     *  Resets the hash to its initial state.
     */
    reset(): void {
        this.hash.reset()
    }
    /**
     * Append data to hash
     */
    write(data?: string | Uint8Array): void {
        this.hash.write(data)
    }
    /**
     * Append data to hash and returns the resulting.
     * It does not change the underlying hash state.
     */
    sum(data?: string | Uint8Array): Uint8Array {
        return this.hash.sum(data)
    }

    /**
     * Similar to sum but writes the hash value to dst
     * @returns hashsize
     */
    sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return this.hash.sumTo(dst, data)
    }

    /**
     * Append data to hash and returns the resulting.
     * Once this function is called, you must call reset to correctly recalculate the hash.
     */
    done(data?: string | Uint8Array): Uint8Array {
        return this.hash.done(data)
    }
    /**
     * Similar to done but writes the hash value to dst
     * @returns hashsize
     */
    doneTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return this.hash.doneTo(dst, data)
    }
}
interface HashDescOptions {
    state?: deps.Pointer
    hashsize: number
    blocksize: number
}
export class HashDesc implements AnyHash {
    private state: deps.HashState
    constructor(private readonly hash: deps.Hash, opts?: HashDescOptions) {
        if (opts) {
            this.state = hash.create(opts.state)
            this.hashsize = opts.hashsize
            this.blocksize = opts.blocksize
        } else {
            this.state = hash.create()
            this.hashsize = deps.hashsize(hash.desc)
            this.blocksize = deps.blocksize(hash.desc)
        }
    }
    /**
     * Create a copy of the current state hash
     * @returns A copy of the current state hash
     */
    clone(): HashDesc {
        return new HashDesc(this.hash, {
            blocksize: this.blocksize,
            hashsize: this.hashsize,
            state: this.state.p,
        })
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
        super(new HashDesc(deps.md5))
    }
}
export class SHA1 extends Hash {
    /**
     * The size of an SHA1 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha1.desc)
    }
    /**
     * The blocksize of SHA1 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha1.desc)
    }
    /**
     * return SHA1 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha1.hashsum(data)
    }
    /**
     * Write SHA1 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha1.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha1))
    }
}
export class SHA256_224 extends Hash {
    /**
     * The size of an SHA256_224 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha224.desc)
    }
    /**
     * The blocksize of SHA256_224 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha224.desc)
    }
    /**
     * return SHA256_224 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha224.hashsum(data)
    }
    /**
     * Write SHA256_224 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha224.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha224))
    }
}
export class SHA256 extends Hash {
    /**
     * The size of an SHA256 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha256.desc)
    }
    /**
     * The blocksize of SHA256 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha256.desc)
    }
    /**
     * return SHA256 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha256.hashsum(data)
    }
    /**
     * Write SHA256 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha256.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha256))
    }
}
export class SHA512_224 extends Hash {
    /**
     * The size of an SHA512_224 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha512_224.desc)
    }
    /**
     * The blocksize of SHA512_224 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha512_224.desc)
    }
    /**
     * return SHA512_224 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha512_224.hashsum(data)
    }
    /**
     * Write SHA512_224 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha512_224.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha512_224))
    }
}
export class SHA512_256 extends Hash {
    /**
     * The size of an SHA512_256 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha512_256.desc)
    }
    /**
     * The blocksize of SHA512_256 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha512_256.desc)
    }
    /**
     * return SHA512_256 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha512_256.hashsum(data)
    }
    /**
     * Write SHA512_256 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha512_256.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha512_256))
    }
}
export class SHA512_384 extends Hash {
    /**
     * The size of an SHA512_384 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha384.desc)
    }
    /**
     * The blocksize of SHA512_384 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha384.desc)
    }
    /**
     * return SHA512_384 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha384.hashsum(data)
    }
    /**
     * Write SHA512_384 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha384.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha384))
    }
}
export class SHA512 extends Hash {
    /**
     * The size of an SHA512 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha512.desc)
    }
    /**
     * The blocksize of SHA512 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha512.desc)
    }
    /**
     * return SHA512 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha512.hashsum(data)
    }
    /**
     * Write SHA512 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha512.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha512))
    }
}
export class SHA3_224 extends Hash {
    /**
     * The size of an SHA3_224 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha3_224.desc)
    }
    /**
     * The blocksize of SHA3_224 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha3_224.desc)
    }
    /**
     * return SHA3_224 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha3_224.hashsum(data)
    }
    /**
     * Write SHA3_224 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha3_224.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha3_224))
    }
}
export class SHA3_256 extends Hash {
    /**
     * The size of an SHA3_256 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha3_256.desc)
    }
    /**
     * The blocksize of SHA3_256 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha3_256.desc)
    }
    /**
     * return SHA3_256 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha3_256.hashsum(data)
    }
    /**
     * Write SHA3_256 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha3_256.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha3_256))
    }
}
export class SHA3_384 extends Hash {
    /**
     * The size of an SHA3_384 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha3_384.desc)
    }
    /**
     * The blocksize of SHA3_384 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha3_384.desc)
    }
    /**
     * return SHA3_384 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha3_384.hashsum(data)
    }
    /**
     * Write SHA3_384 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha3_384.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha3_384))
    }
}
export class SHA3_512 extends Hash {
    /**
     * The size of an SHA3_512 checksum in bytes.
     */
    static get hashsize(): number {
        return deps.hashsize(deps.sha3_512.desc)
    }
    /**
     * The blocksize of SHA3_512 in bytes.
     */
    static get blocksize(): number {
        return deps.blocksize(deps.sha3_512.desc)
    }
    /**
     * return SHA3_512 checksum of the data
     */
    static sum(data?: string | Uint8Array): Uint8Array {
        return deps.sha3_512.hashsum(data)
    }
    /**
     * Write SHA3_512 checksum of the data to dst
     * @returns hashsize
     */
    static sumTo(dst: Uint8Array, data?: string | Uint8Array): number {
        return deps.sha3_512.hashsumTo(dst, data)
    }

    constructor() {
        super(new HashDesc(deps.sha3_512))
    }
}