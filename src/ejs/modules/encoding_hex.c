#include "modules_shared.h"
#include "../js/encoding_hex.h"
#include <errno.h>

static duk_ret_t isHex(duk_context *ctx)
{
    if (duk_is_number(ctx, 0))
    {
        duk_double_t d = duk_require_number(ctx, 0);
        duk_pop(ctx);
        uint8_t c = d;
        if (d == (duk_double_t)c && ppp_encoding_hex_is_valid_char(c))
        {
            duk_push_true(ctx);
        }
        else
        {
            duk_push_false(ctx);
        }
    }
    else
    {
        duk_size_t s_len;
        const uint8_t *s;
        if (duk_is_string(ctx, 0))
        {
            s = duk_require_lstring(ctx, 0, &s_len);
        }
        else
        {
            s = duk_require_buffer_data(ctx, 0, &s_len);
        }
        if (ppp_encoding_hex_is_valid(s, s_len))
        {
            duk_pop(ctx);
            duk_push_true(ctx);
        }
        else
        {

            duk_pop(ctx);
            duk_push_false(ctx);
        }
    }
    return 1;
}
static duk_ret_t encodedLen(duk_context *ctx)
{
    if (duk_is_number(ctx, 0))
    {
        duk_size_t d = duk_require_number(ctx, 0);
        duk_pop(ctx);

        duk_push_number(ctx, PPP_ENCODING_HEX_ENCODED_LEN(d));
    }
    else
    {
        duk_size_t d;
        const uint8_t *s;
        if (duk_is_string(ctx, 0))
        {
            duk_require_lstring(ctx, 0, &d);
        }
        else
        {
            duk_require_buffer_data(ctx, 0, &d);
        }
        duk_pop(ctx);

        duk_push_number(ctx, PPP_ENCODING_HEX_ENCODED_LEN(d));
    }
    return 1;
}
static duk_ret_t decodedLen(duk_context *ctx)
{
    if (duk_is_number(ctx, 0))
    {
        duk_size_t d = duk_require_number(ctx, 0);
        duk_pop(ctx);

        duk_push_number(ctx, PPP_ENCODING_HEX_DECODED_LEN(d));
    }
    else
    {
        duk_size_t d;
        const uint8_t *s;
        if (duk_is_string(ctx, 0))
        {
            duk_require_lstring(ctx, 0, &d);
        }
        else
        {
            duk_require_buffer_data(ctx, 0, &d);
        }
        duk_pop(ctx);

        duk_push_number(ctx, PPP_ENCODING_HEX_DECODED_LEN(d));
    }
    return 1;
}
typedef struct
{
    const uint8_t *s;
    duk_size_t s_len;

    uint8_t *p;
    duk_size_t p_len;

    duk_bool_t uppercase;
} encodeToString_args_t;
static duk_ret_t encodeToString_impl(duk_context *ctx)
{
    encodeToString_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    args->p = malloc(args->p_len);
    if (!args->p)
    {
        ejs_throw_os_errno(ctx);
    }

    ppp_encoding_hex_encode(args->p, args->s, args->s_len, args->uppercase ? 1 : 0);
    duk_push_lstring(ctx, args->p, args->p_len);

    free(args->p);
    args->p = 0;

    return 1;
}
static duk_ret_t encodeToString(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s;
    if (duk_is_string(ctx, 0))
    {
        s = duk_require_lstring(ctx, 0, &s_len);
    }
    else
    {
        s = duk_require_buffer_data(ctx, 0, &s_len);
    }
    duk_bool_t uppercase = duk_require_boolean(ctx, 1);
    duk_pop_2(ctx);
    duk_size_t n = PPP_ENCODING_HEX_ENCODED_LEN(s_len);
    if (!n)
    {
        duk_push_lstring(ctx, "", 0);
        return 1;
    }
    if (n / 2 != s_len)
    {
        ejs_throw_os(ctx, ENOMEM, 0);
    }

    encodeToString_args_t args = {
        .s = s,
        .s_len = s_len,
        .p = 0,
        .p_len = n,
        .uppercase = uppercase,
    };
    if (ejs_pcall_function(ctx, encodeToString_impl, &args))
    {
        if (args.p)
        {
            free(args.p);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t encode(duk_context *ctx)
{
    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 0, &dst_len);
    if (dst_len < 2)
    {
        duk_push_number(ctx, 0);
        return 1;
    }
    duk_size_t src_len;
    const uint8_t *src = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &src_len);
    if (!src_len)
    {
        duk_push_number(ctx, 0);
        return 1;
    }
    duk_bool_t uppercase = duk_require_boolean(ctx, 2);
    duk_pop_3(ctx);

    duk_size_t n = PPP_ENCODING_HEX_DECODED_LEN(dst_len);
    if (n > src_len)
    {
        n = src_len;
    }
    ppp_encoding_hex_encode(dst, src, n, uppercase);
    duk_push_number(ctx, n * 2);
    return 1;
}
static duk_ret_t decode(duk_context *ctx)
{
    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 0, &dst_len);
    if (!dst_len)
    {
        duk_push_number(ctx, 0);
        return 1;
    }
    duk_size_t src_len;
    const uint8_t *src = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &src_len);
    if (src_len < 2)
    {
        duk_push_number(ctx, 0);
        return 1;
    }
    duk_pop_2(ctx);

    duk_size_t n = PPP_ENCODING_HEX_DECODED_LEN(src_len);
    if (n > dst_len)
    {
        n = dst_len;
    }
    ppp_encoding_hex_decode(dst, src, n * 2);
    duk_push_number(ctx, n);
    return 1;
}
EJS_SHARED_MODULE__DECLARE(encoding_hex)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_encoding_hex_min_js, js_ejs_js_encoding_hex_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, isHex, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "isHex", 5);
        duk_push_c_lightfunc(ctx, encodedLen, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "encodedLen", 10);
        duk_push_c_lightfunc(ctx, decodedLen, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "decodedLen", 10);
        duk_push_c_lightfunc(ctx, encodeToString, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "encodeToString", 14);
        duk_push_c_lightfunc(ctx, encode, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "encode", 6);
        duk_push_c_lightfunc(ctx, decode, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "decode", 6);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */

    duk_call(ctx, 3);
    return 0;
}