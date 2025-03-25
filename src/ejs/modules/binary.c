#include "modules_shared.h"
#include "../js/binary.h"
#include "../binary.h"
#include "../internal/strconv.h"
#include "./strconv.h"

static duk_ret_t nget16(duk_context *ctx)
{
    duk_bool_t big = duk_require_boolean(ctx, 0);
    duk_bool_t isint = duk_require_boolean(ctx, 1);
    duk_size_t s_len;
    const uint8_t *s = duk_require_buffer_data(ctx, 2, &s_len);
    duk_size_t offset = duk_require_number(ctx, 3);
    if (s_len < offset || s_len - offset < 2)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of buffer range");
        duk_throw(ctx);
    }
    s += offset;

    uint16_t val = (big ? ejs_get_binary()->big : ejs_get_binary()->little).uint16(s);
    if (isint)
    {
        duk_push_number(ctx, (int16_t)val);
    }
    else
    {
        duk_push_number(ctx, val);
    }
    return 1;
}
static duk_ret_t nget32(duk_context *ctx)
{
    duk_bool_t big = duk_require_boolean(ctx, 0);
    duk_bool_t isint = duk_require_boolean(ctx, 1);
    duk_size_t s_len;
    const uint8_t *s = duk_require_buffer_data(ctx, 2, &s_len);
    duk_size_t offset = duk_require_number(ctx, 3);
    if (s_len < offset || s_len - offset < 4)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of buffer range");
        duk_throw(ctx);
    }
    s += offset;

    uint32_t val = (big ? ejs_get_binary()->big : ejs_get_binary()->little).uint32(s);
    if (isint)
    {
        duk_push_number(ctx, (int32_t)val);
    }
    else
    {
        duk_push_number(ctx, val);
    }
    return 1;
}
static duk_ret_t nget64(duk_context *ctx)
{
    duk_bool_t big = duk_require_boolean(ctx, 0);
    duk_bool_t isint = duk_require_boolean(ctx, 1);
    duk_size_t s_len;
    const uint8_t *s = duk_require_buffer_data(ctx, 2, &s_len);
    duk_size_t offset = duk_require_number(ctx, 3);
    if (s_len < offset || s_len - offset < 8)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of buffer range");
        duk_throw(ctx);
    }
    s += offset;

    uint64_t val = (big ? ejs_get_binary()->big : ejs_get_binary()->little).uint64(s);
    if (isint)
    {
        int64_t v = val;
        if (val >= EJS_MIN_SAFE_INTEGER && val <= EJS_MAX_SAFE_INTEGER)
        {
            duk_push_number(ctx, v);
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
                duk_push_lstring(ctx, "", 0);
            }
        }
    }
    else
    {
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
                duk_push_lstring(ctx, "", 0);
            }
        }
    }
    return 1;
}
static duk_ret_t nput16(duk_context *ctx)
{
    duk_bool_t big = duk_require_boolean(ctx, 0);
    duk_bool_t isint = duk_require_boolean(ctx, 1);
    duk_size_t s_len;
    uint8_t *s = duk_require_buffer_data(ctx, 2, &s_len);
    duk_size_t offset = duk_require_number(ctx, 3);
    if (s_len < offset || s_len - offset < 2)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of buffer range");
        duk_throw(ctx);
    }
    s += offset;

    uint16_t val16;
    if (isint)
    {
        int64_t v = duk_require_number(ctx, 4);
        if (v < EJS_MIN_INT16 || v > EJS_MAX_INT16)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of int16 range");
            duk_throw(ctx);
        }
        val16 = (uint16_t)v;
    }
    else
    {
        uint64_t v = duk_require_number(ctx, 4);
        if (v > EJS_MAX_UINT16)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of uint16 range");
            duk_throw(ctx);
        }
        val16 = (uint16_t)v;
    }
    (big ? ejs_get_binary()->big : ejs_get_binary()->little).put_uint16(s, val16);
    return 0;
}
static duk_ret_t nput32(duk_context *ctx)
{
    duk_bool_t big = duk_require_boolean(ctx, 0);
    duk_bool_t isint = duk_require_boolean(ctx, 1);
    duk_size_t s_len;
    uint8_t *s = duk_require_buffer_data(ctx, 2, &s_len);
    duk_size_t offset = duk_require_number(ctx, 3);
    if (s_len < offset || s_len - offset < 4)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of buffer range");
        duk_throw(ctx);
    }
    s += offset;

    uint32_t val32;
    if (isint)
    {
        int64_t v = duk_require_number(ctx, 4);
        if (v < EJS_MIN_INT32 || v > EJS_MAX_INT32)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of int32 range");
            duk_throw(ctx);
        }
        val32 = (uint32_t)v;
    }
    else
    {
        uint64_t v = duk_require_number(ctx, 4);
        if (v > EJS_MAX_UINT32)
        {
            duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of uint32 range");
            duk_throw(ctx);
        }
        val32 = (uint32_t)v;
    }
    (big ? ejs_get_binary()->big : ejs_get_binary()->little).put_uint32(s, val32);
    return 0;
}
static duk_ret_t nput64(duk_context *ctx)
{
    duk_bool_t big = duk_require_boolean(ctx, 0);
    duk_bool_t isint = duk_require_boolean(ctx, 1);
    duk_size_t s_len;
    uint8_t *s = duk_require_buffer_data(ctx, 2, &s_len);
    duk_size_t offset = duk_require_number(ctx, 3);
    if (s_len < offset || s_len - offset < 8)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "out of buffer range");
        duk_throw(ctx);
    }
    s += offset;

    uint32_t val64;
    if (duk_is_string(ctx, 3))
    {
        duk_size_t str_len;
        const uint8_t *str = duk_require_lstring(ctx, 4, &str_len);
        if (isint)
        {
            val64 = __ejs_private_parse_int(ctx, str, str_len, 10, 64);
        }
        else
        {
            val64 = __ejs_private_parse_uint(ctx, str, str_len, 10, 64, 1);
        }
    }
    else
    {
        val64 = duk_require_number(ctx, 4);
    }
    (big ? ejs_get_binary()->big : ejs_get_binary()->little).put_uint32(s, val64);
    return 0;
}

EJS_SHARED_MODULE__DECLARE(binary)
{
    /*
     *  Entry stack: [ require exports ]
     */

    duk_eval_lstring(ctx, js_ejs_js_binary_min_js, js_ejs_js_binary_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, nget16, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "nget16", 6);
        duk_push_c_lightfunc(ctx, nget32, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "nget32", 6);
        duk_push_c_lightfunc(ctx, nget64, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "nget64", 6);
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