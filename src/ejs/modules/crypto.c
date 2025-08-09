#include "modules_shared.h"
#include <tomcrypt.h>
#include "../js/crypto.h"
static duk_ret_t ecb_enc_block(duk_context *ctx)
{
    int cipher = duk_require_uint(ctx, 0);
    if (cipher_is_valid(cipher) != CRYPT_OK)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "cipher invalid");
        duk_throw(ctx);
    }

    duk_size_t block_length = cipher_descriptor[cipher].block_length;

    duk_size_t key_len = 0;
    const uint8_t *key = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &key_len);
    duk_size_t plaintext_len = 0;
    const uint8_t *plaintext = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &plaintext_len);
    plaintext_len -= plaintext_len % block_length;

    if (duk_is_undefined(ctx, 3))
    {
        uint8_t *ciphertext = duk_push_fixed_buffer(ctx, plaintext_len);
        if (plaintext_len > 0)
        {
            symmetric_ECB ecb;
            if (ecb_start(cipher, key, key_len, 0, &ecb) != CRYPT_OK)
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_start fail");
                duk_throw(ctx);
            }
            if (ecb_encrypt(plaintext, ciphertext, plaintext_len, &ecb) != CRYPT_OK)
            {
                ecb_done(&ecb);
                duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_encrypt fail");
                duk_throw(ctx);
            }
            ecb_done(&ecb);
        }
        return 1;
    }

    duk_size_t ciphertext_len = 0;
    uint8_t *ciphertext = duk_require_buffer_data(ctx, 3, &ciphertext_len);
    ciphertext_len -= ciphertext_len % block_length;
    if (ciphertext_len < plaintext_len)
    {
        plaintext_len = ciphertext_len;
    }
    if (plaintext_len > 0)
    {
        symmetric_ECB ecb;
        if (ecb_start(cipher, key, key_len, 0, &ecb) != CRYPT_OK)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_start fail");
            duk_throw(ctx);
        }
        if (ecb_encrypt(plaintext, ciphertext, plaintext_len, &ecb) != CRYPT_OK)
        {
            ecb_done(&ecb);
            duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_encrypt fail");
            duk_throw(ctx);
        }
        ecb_done(&ecb);

        duk_pop_3(ctx);
        duk_push_number(ctx, plaintext_len);
    }
    else
    {
        duk_pop_3(ctx);
        duk_push_number(ctx, 0);
    }
    return 1;
}
EJS_SHARED_MODULE__DECLARE(crypto)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_crypto_min_js, js_ejs_js_crypto_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_number(ctx, register_cipher(&aes_desc));
        duk_put_prop_lstring(ctx, -2, "AES", 3);

        duk_push_c_lightfunc(ctx, ecb_enc_block, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "ecb_enc_block", 13);
    }

    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);

    return 0;
}