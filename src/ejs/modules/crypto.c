#include "modules_shared.h"
#include <tomcrypt.h>
#include "../js/crypto.h"
static duk_ret_t ecb_block(duk_context *ctx, int dec)
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
    duk_size_t input_len = 0;
    const uint8_t *input = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &input_len);
    input_len -= input_len % block_length;

    if (duk_is_undefined(ctx, 3))
    {
        uint8_t *output = duk_push_fixed_buffer(ctx, input_len);
        if (input_len > 0)
        {
            symmetric_ECB ecb;
            if (ecb_start(cipher, key, key_len, 0, &ecb) != CRYPT_OK)
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_start fail");
                duk_throw(ctx);
            }
            if (dec)
            {
                if (ecb_decrypt(input, output, input_len, &ecb) != CRYPT_OK)
                {
                    ecb_done(&ecb);
                    duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_decrypt fail");
                    duk_throw(ctx);
                }
            }
            else
            {
                if (ecb_encrypt(input, output, input_len, &ecb) != CRYPT_OK)
                {
                    ecb_done(&ecb);
                    duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_encrypt fail");
                    duk_throw(ctx);
                }
            }
            ecb_done(&ecb);
        }
        return 1;
    }

    duk_size_t output_len = 0;
    uint8_t *output = duk_require_buffer_data(ctx, 3, &output_len);
    output_len -= output_len % block_length;
    if (output_len < input_len)
    {
        input_len = output_len;
    }
    if (input_len > 0)
    {
        symmetric_ECB ecb;
        if (ecb_start(cipher, key, key_len, 0, &ecb) != CRYPT_OK)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_start fail");
            duk_throw(ctx);
        }
        if (dec)
        {
            if (ecb_decrypt(input, output, input_len, &ecb) != CRYPT_OK)
            {
                ecb_done(&ecb);
                duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_decrypt fail");
                duk_throw(ctx);
            }
        }
        else
        {
            if (ecb_encrypt(input, output, input_len, &ecb) != CRYPT_OK)
            {
                ecb_done(&ecb);
                duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_encrypt fail");
                duk_throw(ctx);
            }
        }
        ecb_done(&ecb);

        duk_pop_3(ctx);
        duk_push_number(ctx, input_len);
    }
    else
    {
        duk_pop_3(ctx);
        duk_push_number(ctx, 0);
    }
    return 1;
}
static duk_ret_t enc_ecb_block(duk_context *ctx)
{
    return ecb_block(ctx, 0);
}
static duk_ret_t dec_ecb_block(duk_context *ctx)
{
    return ecb_block(ctx, 1);
}
static duk_ret_t ecb_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    uint8_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        if (p[sizeof(symmetric_ECB)])
        {
            p[sizeof(symmetric_ECB)] = 0;
            ecb_done((symmetric_ECB *)p);
        }
        free(p);
    }
    return 0;
}
static duk_ret_t ecb(duk_context *ctx)
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

    uint8_t *p = ejs_push_finalizer_object(ctx, sizeof(symmetric_ECB) + 1, ecb_finalizer);
    if (ecb_start(cipher, key, key_len, 0, (symmetric_ECB *)p) != CRYPT_OK)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_start fail");
        duk_throw(ctx);
    }
    p[sizeof(symmetric_ECB)] = 1;

    duk_push_uint(ctx, block_length);
    duk_put_prop_lstring(ctx, -2, "blocksize", 9);
    return 1;
}
static duk_ret_t ecb_stream(duk_context *ctx, int dec)
{
    symmetric_ECB *state = duk_require_pointer(ctx, 0);
    duk_size_t block_length = duk_require_uint(ctx, 1);

    duk_size_t input_len = 0;
    const uint8_t *input = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &input_len);
    input_len -= input_len % block_length;

    if (duk_is_undefined(ctx, 3))
    {
        uint8_t *output = duk_push_fixed_buffer(ctx, input_len);
        if (input_len > 0)
        {
            if (dec)
            {
                if (ecb_decrypt(input, output, input_len, state) != CRYPT_OK)
                {
                    duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_decrypt fail");
                    duk_throw(ctx);
                }
            }
            else
            {
                if (ecb_encrypt(input, output, input_len, state) != CRYPT_OK)
                {
                    duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_encrypt fail");
                    duk_throw(ctx);
                }
            }
        }
        return 1;
    }

    duk_size_t output_len = 0;
    uint8_t *output = duk_require_buffer_data(ctx, 3, &output_len);
    output_len -= output_len % block_length;
    if (output_len < input_len)
    {
        input_len = output_len;
    }
    if (input_len > 0)
    {
        if (dec)
        {
            if (ecb_decrypt(input, output, input_len, state) != CRYPT_OK)
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_decrypt fail");
                duk_throw(ctx);
            }
        }
        else
        {
            if (ecb_encrypt(input, output, input_len, state) != CRYPT_OK)
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, "ecb_encrypt fail");
                duk_throw(ctx);
            }
        }

        duk_pop_3(ctx);
        duk_push_number(ctx, input_len);
    }
    else
    {
        duk_pop_3(ctx);
        duk_push_number(ctx, 0);
    }
    return 1;
}
static duk_ret_t enc_ecb(duk_context *ctx)
{
    return ecb_stream(ctx, 0);
}
static duk_ret_t dec_ecb(duk_context *ctx)
{
    return ecb_stream(ctx, 1);
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

        duk_push_c_lightfunc(ctx, enc_ecb_block, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "enc_ecb_block", 13);
        duk_push_c_lightfunc(ctx, dec_ecb_block, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "dec_ecb_block", 13);
        duk_push_c_lightfunc(ctx, ecb, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "ecb", 3);
        duk_push_c_lightfunc(ctx, enc_ecb, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "enc_ecb", 7);
        duk_push_c_lightfunc(ctx, dec_ecb, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "dec_ecb", 7);
    }

    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);

    return 0;
}