#include "modules_shared.h"
#include "../js/encoding_binary.h"
#include "../binary.h"
#include "../internal/strconv.h"
#include "./strconv.h"

static duk_ret_t byteLen(duk_context *ctx)
{
    duk_size_t l;
    duk_require_buffer_data(ctx, 0, &l);
    duk_push_number(ctx, l);
    return 1;
}
static duk_ret_t nget_impl(duk_context *ctx, duk_idx_t idx, duk_size_t bitsize)
{
    duk_bool_t isint = duk_require_boolean(ctx, idx++);
    duk_size_t s_len;
    const uint8_t *s = duk_require_buffer_data(ctx, idx++, &s_len);
    duk_size_t offset = duk_require_number(ctx, idx++);
    if (s_len < offset || s_len - offset < bitsize / 8)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of buffer range");
        duk_throw(ctx);
    }
    switch (bitsize)
    {
    case 8:
        if (isint)
        {
            duk_push_number(ctx, (int8_t)s[offset]);
        }
        else
        {
            duk_push_number(ctx, s[offset]);
        }
        break;
    case 16:
        if (isint)
        {
            duk_push_number(ctx, (int16_t)(duk_require_boolean(ctx, 0) ? ejs_get_binary()->big.uint16(s + offset) : ejs_get_binary()->little.uint16(s + offset)));
        }
        else
        {
            duk_push_number(ctx, duk_require_boolean(ctx, 0) ? ejs_get_binary()->big.uint16(s + offset) : ejs_get_binary()->little.uint16(s + offset));
        }
        break;
    case 32:
        if (isint)
        {
            duk_push_number(ctx, (int32_t)(duk_require_boolean(ctx, 0) ? ejs_get_binary()->big.uint32(s + offset) : ejs_get_binary()->little.uint32(s + offset)));
        }
        else
        {
            duk_push_number(ctx, duk_require_boolean(ctx, 0) ? ejs_get_binary()->big.uint32(s + offset) : ejs_get_binary()->little.uint32(s + offset));
        }
        break;
    default:
        if (isint)
        {
            int64_t val = duk_require_boolean(ctx, 0) ? ejs_get_binary()->big.uint64(s + offset) : ejs_get_binary()->little.uint64(s + offset);
            if (val >= EJS_MIN_SAFE_INTEGER && val <= EJS_MAX_SAFE_INTEGER)
            {
                duk_push_number(ctx, val);
            }
            else
            {
                ppp_strconv_format_bits_a_t a;
                size_t n = sizeof(a.a);
                ppp_strconv_format_bits(0, &a, val, 10, val < 0 ? 1 : 0, 0);
                if (a.i < n)
                {
                    duk_push_lstring(ctx, a.a + a.i, n - a.i);
                }
                else
                {
                    duk_push_lstring(ctx, "0", 1);
                }
            }
        }
        else
        {
            uint64_t val = duk_require_boolean(ctx, 0) ? ejs_get_binary()->big.uint64(s + offset) : ejs_get_binary()->little.uint64(s + offset);
            if (val <= EJS_MAX_SAFE_INTEGER)
            {
                duk_push_number(ctx, val);
            }
            else
            {
                ppp_strconv_format_bits_a_t a;
                size_t n = sizeof(a.a);
                ppp_strconv_format_bits(0, &a, val, 10, 0, 0);
                if (a.i < n)
                {
                    duk_push_lstring(ctx, a.a + a.i, n - a.i);
                }
                else
                {
                    duk_push_lstring(ctx, "0", 1);
                }
            }
        }
        break;
    }
    return 1;
}
static duk_ret_t nget8(duk_context *ctx)
{
    return nget_impl(ctx, 0, 8);
}
static duk_ret_t nget16(duk_context *ctx)
{
    return nget_impl(ctx, 1, 16);
}
static duk_ret_t nget32(duk_context *ctx)
{
    return nget_impl(ctx, 1, 32);
}
static duk_ret_t nget64(duk_context *ctx)
{
    return nget_impl(ctx, 1, 64);
}
static int64_t nrequire_int(duk_context *ctx, duk_idx_t idx, duk_size_t bitsize)
{
    int64_t v;
    if (duk_is_string(ctx, idx))
    {
        duk_size_t str_len;
        const uint8_t *str = duk_require_lstring(ctx, idx, &str_len);
        v = __ejs_private_parse_int(ctx, str, str_len, 0, 0);
    }
    else
    {
        v = duk_require_number(ctx, idx);
    }

    switch (bitsize)
    {
    case 8:
        if (v < EJS_MIN_INT8 || v > EJS_MAX_INT8)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of int8 range");
            duk_throw(ctx);
        }
        break;
    case 16:
        if (v < EJS_MIN_INT16 || v > EJS_MAX_INT16)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of int16 range");
            duk_throw(ctx);
        }
        break;
    case 32:
        if (v < EJS_MIN_INT32 || v > EJS_MAX_INT32)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of int32 range");
            duk_throw(ctx);
        }
        break;
    }
    return v;
}
static uint64_t nrequire_uint(duk_context *ctx, duk_idx_t idx, duk_size_t bitsize)
{
    uint64_t v;
    if (duk_is_string(ctx, idx))
    {
        duk_size_t str_len;
        const uint8_t *str = duk_require_lstring(ctx, idx, &str_len);
        v = __ejs_private_parse_uint(ctx, str, str_len, 0, 0, 1);
    }
    else
    {
        v = duk_require_number(ctx, idx);
    }

    switch (bitsize)
    {
    case 8:
        if (v > EJS_MAX_UINT8)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of uint8 range");
            duk_throw(ctx);
        }
        break;
    case 16:
        if (v > EJS_MAX_UINT16)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of uint16 range");
            duk_throw(ctx);
        }
        break;
    case 32:
        if (v > EJS_MAX_UINT32)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of uint32 range");
            duk_throw(ctx);
        }
        break;
    }
    return v;
}
static duk_ret_t nput_impl(duk_context *ctx, duk_idx_t idx, duk_size_t bitsize)
{
    duk_bool_t isint = duk_require_boolean(ctx, idx++);
    duk_size_t s_len;
    uint8_t *s = duk_require_buffer_data(ctx, idx++, &s_len);
    duk_size_t offset = duk_require_number(ctx, idx++);
    if (s_len < offset || s_len - offset < bitsize / 8)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of buffer range");
        duk_throw(ctx);
    }
    switch (bitsize)
    {
    case 8:
        s[offset] = isint ? nrequire_int(ctx, idx, bitsize) : nrequire_uint(ctx, idx, bitsize);
        break;
    case 16:
        if (duk_require_boolean(ctx, 0))
        {
            ejs_get_binary()->big.put_uint16(s + offset, isint ? nrequire_int(ctx, idx, bitsize) : nrequire_uint(ctx, idx, bitsize));
        }
        else
        {
            ejs_get_binary()->little.put_uint16(s + offset, isint ? nrequire_int(ctx, idx, bitsize) : nrequire_uint(ctx, idx, bitsize));
        }
        break;
    case 32:
        if (duk_require_boolean(ctx, 0))
        {
            ejs_get_binary()->big.put_uint32(s + offset, isint ? nrequire_int(ctx, idx, bitsize) : nrequire_uint(ctx, idx, bitsize));
        }
        else
        {
            ejs_get_binary()->little.put_uint32(s + offset, isint ? nrequire_int(ctx, idx, bitsize) : nrequire_uint(ctx, idx, bitsize));
        }
        break;
    default:
        if (duk_require_boolean(ctx, 0))
        {
            ejs_get_binary()->big.put_uint64(s + offset, isint ? nrequire_int(ctx, idx, bitsize) : nrequire_uint(ctx, idx, bitsize));
        }
        else
        {
            ejs_get_binary()->little.put_uint64(s + offset, isint ? nrequire_int(ctx, idx, bitsize) : nrequire_uint(ctx, idx, bitsize));
        }
        break;
    }
    return 0;
}
static duk_ret_t nput8(duk_context *ctx)
{
    return nput_impl(ctx, 0, 8);
}
static duk_ret_t nput16(duk_context *ctx)
{
    return nput_impl(ctx, 1, 16);
}
static duk_ret_t nput32(duk_context *ctx)
{
    return nput_impl(ctx, 1, 32);
}
static duk_ret_t nput64(duk_context *ctx)
{
    return nput_impl(ctx, 1, 64);
}

EJS_SHARED_MODULE__DECLARE(encoding_binary)
{
    /*
     *  Entry stack: [ require exports ]
     */

    duk_eval_lstring(ctx, js_ejs_js_encoding_binary_min_js, js_ejs_js_encoding_binary_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, byteLen, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "byteLen", 7);

        duk_push_c_lightfunc(ctx, nget8, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "nget8", 5);
        duk_push_c_lightfunc(ctx, nget16, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "nget16", 6);
        duk_push_c_lightfunc(ctx, nget32, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "nget32", 6);
        duk_push_c_lightfunc(ctx, nget64, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "nget64", 6);
        duk_push_c_lightfunc(ctx, nput8, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "nput8", 5);
        duk_push_c_lightfunc(ctx, nput16, 5, 5, 0);
        duk_put_prop_lstring(ctx, -2, "nput16", 6);
        duk_push_c_lightfunc(ctx, nput32, 5, 5, 0);
        duk_put_prop_lstring(ctx, -2, "nput32", 6);
        duk_push_c_lightfunc(ctx, nput64, 5, 5, 0);
        duk_put_prop_lstring(ctx, -2, "nput64", 6);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);

    return 0;
}