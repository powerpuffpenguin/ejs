declare namespace deps {
    class Pointer {
        readonly __id = "pointer"
    }

    const AES: number
    class ECB {
        readonly __id = "ECB"
        readonly p: Pointer
        readonly blocksize: number
    }
    class CBC {
        readonly __id = "CBC"
        readonly p: Pointer
        readonly blocksize: number
    }

    function enc_ecb_block(cipher: number, key: string | Uint8Array, plaintext: string | Uint8Array): Uint8Array
    function enc_ecb_block(cipher: number, key: string | Uint8Array, plaintext: string | Uint8Array, ciphertext: Uint8Array): number
    function dec_ecb_block(cipher: number, key: string | Uint8Array, ciphertext: Uint8Array): Uint8Array
    function dec_ecb_block(cipher: number, key: string | Uint8Array, ciphertext: Uint8Array, plaintext: Uint8Array): number
    function ecb(cipher: number, key: string | Uint8Array): ECB
    function enc_ecb(state: Pointer, blocksize: number, plaintext: string | Uint8Array): Uint8Array
    function enc_ecb(state: Pointer, blocksize: number, plaintext: string | Uint8Array, ciphertext: Uint8Array): number
    function dec_ecb(state: Pointer, blocksize: number, ciphertext: Uint8Array): Uint8Array
    function dec_ecb(state: Pointer, blocksize: number, ciphertext: Uint8Array, plaintext: Uint8Array): number

    function enc_cbc_block(cipher: number, key: string | Uint8Array, iv: string | Uint8Array, plaintext: string | Uint8Array): Uint8Array
    function enc_cbc_block(cipher: number, key: string | Uint8Array, iv: string | Uint8Array, plaintext: string | Uint8Array, ciphertext: Uint8Array): number
    function dec_cbc_block(cipher: number, key: string | Uint8Array, iv: string | Uint8Array, ciphertext: Uint8Array): Uint8Array
    function dec_cbc_block(cipher: number, key: string | Uint8Array, iv: string | Uint8Array, ciphertext: Uint8Array, plaintext: Uint8Array): number
    function cbc(cipher: number, key: string | Uint8Array, iv: string | Uint8Array): CBC
    function enc_cbc(state: Pointer, blocksize: number, plaintext: string | Uint8Array): Uint8Array
    function enc_cbc(state: Pointer, blocksize: number, plaintext: string | Uint8Array, ciphertext: Uint8Array): number
    function dec_cbc(state: Pointer, blocksize: number, ciphertext: Uint8Array): Uint8Array
    function dec_cbc(state: Pointer, blocksize: number, ciphertext: Uint8Array, plaintext: Uint8Array): number
}
/**
 * Implemented AES encryption and decryption algorithm
 * 
 * @remarks
 * Either key length 16, 24, or 32 bytes to select AES-128, AES-192, or AES-256
 */
export class AES {
    private constructor() { }
    /**
     * returns the cipher's block size.
     */
    readonly blocksize = 16
    /**
     * Encrypt plaintext using ECB mode
     * @param key AES key
     * @param plaintext data to be encrypted
     * @returns encrypted data
     */
    static encryptECB(key: string | Uint8Array, plaintext: string | Uint8Array): Uint8Array {
        return deps.enc_ecb_block(deps.AES, key, plaintext)
    }
    /**
     * Encrypt plaintext using ECB mode
     * @param key AES key
     * @param ciphertext encrypted data
     * @param plaintext data to be encrypted
     * @returns The length in bytes of the output ciphertext
     */
    static encryptECBTo(key: string | Uint8Array, ciphertext: Uint8Array, plaintext: string | Uint8Array): number {
        return deps.enc_ecb_block(deps.AES, key, plaintext, ciphertext)
    }
    /**
     * Decrypt ciphertext using ECB mode
     * @param key AES key
     * @param ciphertext data to be decrypted
     * @returns decrypted data
     */
    static decryptECB(key: string | Uint8Array, ciphertext: Uint8Array): Uint8Array {
        return deps.dec_ecb_block(deps.AES, key, ciphertext)
    }
    /**
     * Decrypt ciphertext using ECB mode
     * @param key AES key
     * @param plaintext decrypted data
     * @param ciphertext data to be decrypted
     * @returns The length in bytes of the output plaintext
     */
    static decryptECBTo(key: string | Uint8Array, plaintext: Uint8Array, ciphertext: Uint8Array): number {
        return deps.dec_ecb_block(deps.AES, key, ciphertext, plaintext)
    }
    /**
     * 
     * @param key AES key
     * @returns ECB
     */
    static ecb(key: string | Uint8Array): ECB {
        return new ECB(deps.ecb(deps.AES, key))
    }

    /**
     * Encrypt plaintext using ECB mode
     * @param key AES key
     * @param iv initialization vector
     * @param plaintext data to be encrypted
     * @returns encrypted data
     */
    static encryptCBC(key: string | Uint8Array, iv: string | Uint8Array, plaintext: string | Uint8Array): Uint8Array {
        return deps.enc_cbc_block(deps.AES, key, iv, plaintext)
    }
    /**
     * Encrypt plaintext using ECB mode
     * @param key AES key
     * @param iv initialization vector
     * @param ciphertext encrypted data
     * @param plaintext data to be encrypted
     * @returns The length in bytes of the output ciphertext
     */
    static encryptCBCTo(key: string | Uint8Array, iv: string | Uint8Array, ciphertext: Uint8Array, plaintext: string | Uint8Array): number {
        return deps.enc_cbc_block(deps.AES, key, iv, plaintext, ciphertext)
    }
    /**
     * Decrypt ciphertext using ECB mode
     * @param key AES key
     * @param iv initialization vector
     * @param ciphertext data to be decrypted
     * @returns decrypted data
     */
    static decryptCBC(key: string | Uint8Array, iv: string | Uint8Array, ciphertext: Uint8Array): Uint8Array {
        return deps.dec_cbc_block(deps.AES, key, iv, ciphertext)
    }
    /**
     * Decrypt ciphertext using ECB mode
     * @param key AES key
     * @param iv initialization vector
     * @param plaintext decrypted data
     * @param ciphertext data to be decrypted
     * @returns The length in bytes of the output plaintext
     */
    static decryptCBCTo(key: string | Uint8Array, iv: string | Uint8Array, plaintext: Uint8Array, ciphertext: Uint8Array): number {
        return deps.dec_cbc_block(deps.AES, key, iv, ciphertext, plaintext)
    }
    /**
     * 
     * @param key AES key
     * @param iv initialization vector
     * @returns ECB
     */
    static cbc(key: string | Uint8Array, iv: string | Uint8Array): CBC {
        return new CBC(deps.cbc(deps.AES, key, iv))
    }
}
/**
 * The most basic ECB encryption mode.
 * @remarks
 * In ECB mode, the plaintext and ciphertext must be integer multiples of blocksize.
 */
export class ECB {
    constructor(readonly state: deps.ECB) { }
    /**
     * returns the cipher's block size.
     */
    get blocksize(): number {
        return this.state.blocksize
    }
    /**
     * Encrypt plaintext using ECB mode
     * @param plaintext data to be encrypted
     * @returns encrypted data
     */
    encrypt(plaintext: string | Uint8Array): Uint8Array {
        const state = this.state
        return deps.enc_ecb(state.p, state.blocksize, plaintext)
    }
    /**
     * Encrypt plaintext using ECB mode
     * @param ciphertext encrypted data
     * @param plaintext data to be encrypted
     * @returns The length in bytes of the output ciphertext
     */
    encryptTo(ciphertext: Uint8Array, plaintext: string | Uint8Array): number {
        const state = this.state
        return deps.enc_ecb(state.p, state.blocksize, plaintext, ciphertext)
    }
    /**
     * Decrypt ciphertext using ECB mode
     * @param ciphertext data to be decrypted
     * @returns decrypted data
     */
    decrypt(ciphertext: Uint8Array): Uint8Array {
        const state = this.state
        return deps.dec_ecb(state.p, state.blocksize, ciphertext)
    }
    /**
     * Decrypt ciphertext using ECB mode
     * @param plaintext decrypted data
     * @param ciphertext data to be decrypted
     * @returns The length in bytes of the output plaintext
     */
    decryptTo(plaintext: Uint8Array, ciphertext: Uint8Array): number {
        const state = this.state
        return deps.dec_ecb(state.p, state.blocksize, ciphertext, plaintext)
    }
}

/**
 * The most basic CBC encryption mode.
 * @remarks
 * In CBC mode, the plaintext and ciphertext must be integer multiples of blocksize.
 * 
 * The same instance can only be used as an encryptor or a decryptor. Do not mix them up, otherwise you will not get the correct result.
 */
export class CBC {
    constructor(readonly state: deps.CBC) { }
    /**
     * returns the cipher's block size.
     */
    get blocksize(): number {
        return this.state.blocksize
    }
    /**
     * Encrypt plaintext using CBC mode
     * @param plaintext data to be encrypted
     * @returns encrypted data
     */
    encrypt(plaintext: string | Uint8Array): Uint8Array {
        const state = this.state
        return deps.enc_cbc(state.p, state.blocksize, plaintext)
    }
    /**
     * Encrypt plaintext using CBC mode
     * @param ciphertext encrypted data
     * @param plaintext data to be encrypted
     * @returns The length in bytes of the output ciphertext
     */
    encryptTo(ciphertext: Uint8Array, plaintext: string | Uint8Array): number {
        const state = this.state
        return deps.enc_cbc(state.p, state.blocksize, plaintext, ciphertext)
    }
    /**
     * Decrypt ciphertext using CBC mode
     * @param ciphertext data to be decrypted
     * @returns decrypted data
     */
    decrypt(ciphertext: Uint8Array): Uint8Array {
        const state = this.state
        return deps.dec_cbc(state.p, state.blocksize, ciphertext)
    }
    /**
     * Decrypt ciphertext using CBC mode
     * @param plaintext decrypted data
     * @param ciphertext data to be decrypted
     * @returns The length in bytes of the output plaintext
     */
    decryptTo(plaintext: Uint8Array, ciphertext: Uint8Array): number {
        const state = this.state
        return deps.dec_cbc(state.p, state.blocksize, ciphertext, plaintext)
    }
}