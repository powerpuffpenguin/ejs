declare namespace deps {
    class desc {
        readonly __id = "desc"
    }
    const chc_desc: desc
    const whirlpool_desc: desc

    const sha3_512_desc: desc
    const sha3_384_desc: desc
    const sha3_256_desc: desc
    const sha3_224_desc: desc

    const keccak_512_desc: desc
    const keccak_384_desc: desc
    const keccak_256_desc: desc
    const keccak_224_desc: desc

    const sha512_desc: desc
    const sha384_desc: desc
    const sha512_256_desc: desc
    const sha512_224_desc: desc
    const sha256_desc: desc
    const sha224_desc: desc
    const sha1_desc: desc

    const blake2s_256_desc: desc
    const blake2s_224_desc: desc
    const blake2s_160_desc: desc
    const blake2s_128_desc: desc
    const blake2b_512_desc: desc
    const blake2b_384_desc: desc
    const blake2b_256_desc: desc
    const blake2b_160_desc: desc

    const md5_desc: desc
    const md4_desc: desc
    const md2_desc: desc

    const tiger_desc: desc
    const tiger2_desc: desc

    const rmd128_desc: desc
    const rmd160_desc: desc
    const rmd256_desc: desc
    const rmd320_desc: desc
}
// export const size = deps.size
// export const block = deps.block
// export function hash(): hashany {
//     return new hashany(deps.clone())
// }
// class hashany {
//     readonly size = deps.size
//     readonly block = deps.block
//     constructor(private readonly n: deps.native) { }
//     reset() {
//         deps.reset(this.n)
//     }
//     sum(b?: Uint8Array | string): Uint8Array {
//         const n = deps.clone(this.n)
//         if (b && b.length) {
//             deps.write(n, b)
//         }
//         return deps.done(n)
//     }
//     write(b: Uint8Array | string): number {
//         return deps.write(this.n, b)
//     }
// }