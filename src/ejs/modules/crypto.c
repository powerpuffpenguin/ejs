#include "modules_shared.h"
#include <tomcrypt.h>
#include "../js/crypto.h"
typedef int (*state_block_func)(const unsigned char *input, unsigned char *output, unsigned long len, void *state);
static duk_ret_t state_stream(
    duk_context *ctx,
    duk_bool_t fill,
    state_block_func f,
    const char *errtag)
{
    void *state = duk_require_pointer(ctx, 0);
    duk_size_t block_length = duk_require_uint(ctx, 1);

    duk_size_t input_len = 0;
    const uint8_t *input = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &input_len);
    if (!fill && input_len % block_length)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "input not full blocks");
        duk_throw(ctx);
    }

    if (duk_is_undefined(ctx, 3))
    {
        uint8_t *output = duk_push_fixed_buffer(ctx, input_len);
        if (input_len > 0)
        {

            if (f(input, output, input_len, state) != CRYPT_OK)
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, errtag);
                duk_throw(ctx);
            }
        }
        return 1;
    }

    duk_size_t output_len = 0;
    uint8_t *output = duk_require_buffer_data(ctx, 3, &output_len);
    if (output_len < input_len)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "output smaller than input");
        duk_throw(ctx);
    }
    if (input_len > 0)
    {

        if (f(input, output, input_len, state) != CRYPT_OK)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, errtag);
            duk_throw(ctx);
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

typedef int (*state_start_func)(int cipher, const unsigned char *key, int keylen, int num_rounds, void *state);
typedef int (*state_start_iv_func)(int cipher, const unsigned char *IV, const unsigned char *key, int keylen, int num_rounds, void *state);
typedef int (*state_done_func)(void *state);

static duk_ret_t state_block(
    duk_context *ctx,
    const char *tag,
    duk_bool_t fill,
    state_start_func start,
    state_start_iv_func start_iv,
    state_block_func f,
    state_done_func done,
    void *state)
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
    duk_idx_t idx = 2;
    const uint8_t *iv;
    if (start_iv)
    {
        duk_size_t iv_len = 0;
        iv = EJS_REQUIRE_CONST_LSOURCE(ctx, idx, &iv_len);
        if (iv_len < block_length)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "iv length must equal block size");
            duk_throw(ctx);
        }
        ++idx;
    }

    duk_size_t input_len = 0;
    const uint8_t *input = EJS_REQUIRE_CONST_LSOURCE(ctx, idx, &input_len);
    if (!fill && input_len % block_length)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "input not full blocks");
        duk_throw(ctx);
    }
    ++idx;
    if (duk_is_undefined(ctx, idx))
    {
        uint8_t *output = duk_push_fixed_buffer(ctx, input_len);
        if (input_len > 0)
        {
            if ((start ? start(cipher, key, key_len, 0, state) : start_iv(cipher, iv, key, key_len, 0, state)) != CRYPT_OK)
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, "%s_start fail", tag);
                duk_throw(ctx);
            }

            if (f(input, output, input_len, state) != CRYPT_OK)
            {
                done(state);
                duk_push_error_object(ctx, DUK_ERR_ERROR, "%s_decrypt fail", tag);
                duk_throw(ctx);
            }

            done(state);
        }
        return 1;
    }
    duk_size_t output_len = 0;
    uint8_t *output = duk_require_buffer_data(ctx, idx, &output_len);
    if (output_len < input_len)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "output smaller than input");
        duk_throw(ctx);
    }
    if (input_len > 0)
    {
        if ((start ? start(cipher, key, key_len, 0, state) : start_iv(cipher, iv, key, key_len, 0, state)) != CRYPT_OK)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "%s_start fail", tag);
            duk_throw(ctx);
        }

        if (f(input, output, input_len, state) != CRYPT_OK)
        {
            done(state);
            duk_push_error_object(ctx, DUK_ERR_ERROR, "%s_decrypt fail", tag);
            duk_throw(ctx);
        }

        done(state);

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
static duk_ret_t state_new(
    duk_context *ctx,
    state_start_func start,
    state_start_iv_func start_iv,
    duk_size_t sz,
    duk_c_function finalizer,
    const char *errtag)
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

    uint8_t *p;
    if (start_iv)
    {
        duk_size_t iv_len = 0;
        const uint8_t *iv = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &iv_len);
        if (iv_len < block_length)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "iv length must equal block size");
            duk_throw(ctx);
        }

        p = ejs_push_finalizer_object(ctx, sz + 1, finalizer);
        if (start_iv(cipher, iv, key, key_len, 0, p) != CRYPT_OK)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, errtag);
            duk_throw(ctx);
        }
    }
    else
    {
        p = ejs_push_finalizer_object(ctx, sz + 1, finalizer);
        if (start(cipher, key, key_len, 0, p) != CRYPT_OK)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, errtag);
            duk_throw(ctx);
        }
    }
    p[sz] = 1;

    duk_push_uint(ctx, block_length);
    duk_put_prop_lstring(ctx, -2, "blocksize", 9);
    return 1;
}

static duk_ret_t enc_ecb_block(duk_context *ctx)
{
    symmetric_ECB state;
    return state_block(ctx, "ecb", 0, (state_start_func)ecb_start, 0, (state_block_func)ecb_encrypt, (state_done_func)ecb_done, &state);
}
static duk_ret_t dec_ecb_block(duk_context *ctx)
{
    symmetric_ECB state;
    return state_block(ctx, "ecb", 0, (state_start_func)ecb_start, 0, (state_block_func)ecb_decrypt, (state_done_func)ecb_done, &state);
}
static duk_ret_t ecb_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    uint8_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        if (p[sizeof(symmetric_ECB)])
        {
            ecb_done((symmetric_ECB *)p);
        }
        free(p);
    }
    return 0;
}
static duk_ret_t ecb(duk_context *ctx)
{
    return state_new(ctx, (state_start_func)ecb_start, 0, sizeof(symmetric_ECB), ecb_finalizer, "ecb_start fail");
}

static duk_ret_t enc_ecb(duk_context *ctx)
{
    return state_stream(ctx, 0, (state_block_func)ecb_encrypt, "ecb_encrypt fail");
}
static duk_ret_t dec_ecb(duk_context *ctx)
{
    return state_stream(ctx, 0, (state_block_func)ecb_decrypt, "ecb_decrypt fail");
}

static duk_ret_t enc_cbc_block(duk_context *ctx)
{
    symmetric_CBC state;
    return state_block(ctx, "cbc", 0, 0, (state_start_iv_func)cbc_start, (state_block_func)cbc_encrypt, (state_done_func)cbc_done, &state);
}
static duk_ret_t dec_cbc_block(duk_context *ctx)
{
    symmetric_CBC state;
    return state_block(ctx, "cbc", 0, 0, (state_start_iv_func)cbc_start, (state_block_func)cbc_decrypt, (state_done_func)cbc_done, &state);
}
static duk_ret_t cbc_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    uint8_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        if (p[sizeof(symmetric_CBC)])
        {
            cbc_done((symmetric_CBC *)p);
        }
        free(p);
    }
    return 0;
}
static duk_ret_t cbc(duk_context *ctx)
{
    return state_new(ctx, 0, (state_start_iv_func)cbc_start, sizeof(symmetric_CBC), cbc_finalizer, "cbc_start fail");
}

static duk_ret_t enc_cbc(duk_context *ctx)
{
    return state_stream(ctx, 0, (state_block_func)cbc_encrypt, "cbc_encrypt fail");
}
static duk_ret_t dec_cbc(duk_context *ctx)
{
    return state_stream(ctx, 0, (state_block_func)cbc_decrypt, "cbc_decrypt fail");
}

static duk_ret_t enc_cfb_block(duk_context *ctx)
{
    symmetric_CFB state;
    return state_block(ctx, "cfb", 1, 0, (state_start_iv_func)cfb_start, (state_block_func)cfb_encrypt, (state_done_func)cfb_done, &state);
}
static duk_ret_t dec_cfb_block(duk_context *ctx)
{
    symmetric_CFB state;
    return state_block(ctx, "cfb", 1, 0, (state_start_iv_func)cfb_start, (state_block_func)cfb_decrypt, (state_done_func)cfb_done, &state);
}
static duk_ret_t cfb_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    uint8_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        if (p[sizeof(symmetric_CFB)])
        {
            cfb_done((symmetric_CFB *)p);
        }
        free(p);
    }
    return 0;
}
static duk_ret_t cfb(duk_context *ctx)
{
    return state_new(ctx, 0, (state_start_iv_func)cfb_start, sizeof(symmetric_CFB), cfb_finalizer, "cfb_start fail");
}

static duk_ret_t enc_cfb(duk_context *ctx)
{
    return state_stream(ctx, 1, (state_block_func)cfb_encrypt, "cfb_encrypt fail");
}
static duk_ret_t dec_cfb(duk_context *ctx)
{
    return state_stream(ctx, 1, (state_block_func)cfb_decrypt, "cfb_decrypt fail");
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

        duk_push_c_lightfunc(ctx, enc_cbc_block, 5, 5, 0);
        duk_put_prop_lstring(ctx, -2, "enc_cbc_block", 13);
        duk_push_c_lightfunc(ctx, dec_cbc_block, 5, 5, 0);
        duk_put_prop_lstring(ctx, -2, "dec_cbc_block", 13);
        duk_push_c_lightfunc(ctx, cbc, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "cbc", 3);
        duk_push_c_lightfunc(ctx, enc_cbc, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "enc_cbc", 7);
        duk_push_c_lightfunc(ctx, dec_cbc, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "dec_cbc", 7);

        duk_push_c_lightfunc(ctx, enc_cfb_block, 5, 5, 0);
        duk_put_prop_lstring(ctx, -2, "enc_cfb_block", 13);
        duk_push_c_lightfunc(ctx, dec_cfb_block, 5, 5, 0);
        duk_put_prop_lstring(ctx, -2, "dec_cfb_block", 13);
        duk_push_c_lightfunc(ctx, cfb, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "cfb", 3);
        duk_push_c_lightfunc(ctx, enc_cfb, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "enc_cfb", 7);
        duk_push_c_lightfunc(ctx, dec_cfb, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "dec_cfb", 7);
    }

    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);
    return 0;
}