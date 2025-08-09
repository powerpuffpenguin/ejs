declare namespace deps {
    class Pointer {
        readonly __id = "pointer"
    }
    class Desc {
        readonly __id = "desc"
    }
    const AES: number

    function ecb_enc_block(cipher: number, key: string | Uint8Array, plaintext: string | Uint8Array): Uint8Array
    function ecb_enc_block(cipher: number, key: string | Uint8Array, plaintext: string | Uint8Array, ciphertext: Uint8Array): number
    function ecb_dec_block(cipher: number, key: string | Uint8Array, plaintext: Uint8Array, ciphertext: Uint8Array): void
}
export class AES {
    static ecbEncrypt(key: string | Uint8Array, plaintext: string | Uint8Array): Uint8Array {
        return deps.ecb_enc_block(deps.AES, key, plaintext)
    }
    static ecbEncryptTo(key: string | Uint8Array, ciphertext: Uint8Array, plaintext: string | Uint8Array): number {
        return deps.ecb_enc_block(deps.AES, key, plaintext, ciphertext)
    }
    static ecbDecrypt(key: string | Uint8Array, ciphertext: Uint8Array): Uint8Array {
        const plaintext = new Uint8Array(16)
        deps.ecb_dec_block(deps.AES, key, plaintext, ciphertext)
        return ciphertext
    }
    static ecbDecryptTo(key: string | Uint8Array, plaintext: Uint8Array, ciphertext: Uint8Array): void {
        deps.ecb_dec_block(deps.AES, key, plaintext, ciphertext)
    }

    // constructor(key: string | Uint8Array) { }
    // encrypt(plaintext?: string | Uint8Array): Uint8Array {
    // }
    // encryptTo(ciphertext: Uint8Array, plaintext?: string | Uint8Array) {
    // }
}