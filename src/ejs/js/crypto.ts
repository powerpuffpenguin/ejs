declare namespace deps {
    class Pointer {
        readonly __id = "pointer"
    }

    const AES: number
    class ECB {
        readonly __id = "desc"
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
}
/**
 * Implemented AES encryption and decryption algorithm
 * 
 * @remarks
 * Either key length 16, 24, or 32 bytes to select AES-128, AES-192, or AES-256
 */
export class AES {
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
}
/**
 * The most basic ECB encryption mode.
 * @remarks
 * In ECB mode, the plaintext and ciphertext must be integer multiples of blocksize.
 * In this implementation, data that is not an integer multiple will be ignored, and the length of encryption and decryption will automatically take the smaller length of the input to avoid memory overflow.
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