#include "modules_shared.h"
#include "../js/hash.h"
#include <tomcrypt.h>

// EJS_MODULE_HASH(md4)
// EJS_MODULE_HASH(md5)
// EJS_MODULE_HASH(sha1)
// EJS_MODULE_HASH(sha224)
// EJS_MODULE_HASH(sha256)
// EJS_MODULE_HASH(sha384)
// EJS_MODULE_HASH(sha512)
// EJS_MODULE_HASH(sha512_224)
// EJS_MODULE_HASH(sha512_256)

#define EJS_MODULE_HASH_PUSH(name)        \
    duk_push_pointer(ctx, (void *)&name); \
    duk_put_prop_string(ctx, -2, #name)

EJS_SHARED_MODULE__DECLARE(hash)
{
    // md4_desc.init();
    /*
     *  Entry stack: [ require exports ]
     */

    duk_eval_lstring(ctx, js_ejs_js_hash_min_js, js_ejs_js_hash_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        // EJS_MODULE_HASH_PUSH(chc_desc);
        // EJS_MODULE_HASH_PUSH(whirlpool_desc);

        // EJS_MODULE_HASH_PUSH(sha3_512_desc);
        // EJS_MODULE_HASH_PUSH(sha3_384_desc);
        // EJS_MODULE_HASH_PUSH(sha3_256_desc);
        // EJS_MODULE_HASH_PUSH(sha3_224_desc);

        // EJS_MODULE_HASH_PUSH(keccak_512_desc);
        // EJS_MODULE_HASH_PUSH(keccak_384_desc);
        // EJS_MODULE_HASH_PUSH(keccak_256_desc);
        // EJS_MODULE_HASH_PUSH(keccak_224_desc);

        // EJS_MODULE_HASH_PUSH(sha512_desc);
        // EJS_MODULE_HASH_PUSH(sha384_desc);
        // EJS_MODULE_HASH_PUSH(sha512_256_desc);
        // EJS_MODULE_HASH_PUSH(sha512_224_desc);
        // EJS_MODULE_HASH_PUSH(sha256_desc);
        // EJS_MODULE_HASH_PUSH(sha224_desc);
        // EJS_MODULE_HASH_PUSH(sha1_desc);

        // EJS_MODULE_HASH_PUSH(blake2s_256_desc);
        // EJS_MODULE_HASH_PUSH(blake2s_224_desc);
        // EJS_MODULE_HASH_PUSH(blake2s_160_desc);
        // EJS_MODULE_HASH_PUSH(blake2s_128_desc);
        // EJS_MODULE_HASH_PUSH(blake2b_512_desc);
        // EJS_MODULE_HASH_PUSH(blake2b_384_desc);
        // EJS_MODULE_HASH_PUSH(blake2b_256_desc);
        // EJS_MODULE_HASH_PUSH(blake2b_160_desc);

        // EJS_MODULE_HASH_PUSH(md5_desc);
        // EJS_MODULE_HASH_PUSH(md4_desc);
        // EJS_MODULE_HASH_PUSH(md2_desc);

        // EJS_MODULE_HASH_PUSH(tiger_desc);
        // EJS_MODULE_HASH_PUSH(tiger2_desc);

        // EJS_MODULE_HASH_PUSH(rmd128_desc);
        // EJS_MODULE_HASH_PUSH(rmd160_desc);
        // EJS_MODULE_HASH_PUSH(rmd256_desc);
        // EJS_MODULE_HASH_PUSH(rmd320_desc);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);

    ejs_stash_set_module_destroy(ctx);
    return 0;
}