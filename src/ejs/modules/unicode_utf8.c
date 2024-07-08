#include "modules_shared.h"
#include "../js/unicode_utf8.h"
#include "../internal/utf8.h"

static duk_ret_t append_rune(duk_context *ctx)
{
    duk_size_t buf_len = duk_require_number(ctx, 2);
    duk_pop(ctx);

    duk_size_t buf_cap;
    uint8_t *buf = duk_get_buffer_data_default(ctx, 1, &buf_cap, 0, 0);

    duk_size_t count = 0;

    duk_size_t i;
    duk_size_t length = duk_get_length(ctx, 0);
    ppp_utf8_rune_t r;

    for (i = 0; i < length; i++)
    {
        duk_get_prop_index(ctx, 0, i);
        r = duk_require_number(ctx, -1);
        duk_pop(ctx);
        count += ppp_utf8_encode(0, 0, r);
    }

    size_t cap = ppp_c_string_grow_calculate(buf_cap, buf_len, count);
    if (cap)
    {
        duk_pop(ctx);
        duk_push_array(ctx);
        void *p = duk_push_fixed_buffer(ctx, cap);
        if (buf_len)
        {
            memcpy(p, buf, buf_len);
        }
        buf = p;
    }
    else
    {
        duk_push_array(ctx);
        duk_swap_top(ctx, -2);
    }
    duk_put_prop_index(ctx, -2, 0);
    duk_push_number(ctx, count);
    duk_put_prop_index(ctx, -2, 1);

    if (buf_len)
    {
        buf += buf_len;
        cap -= buf_len;
    }
    for (i = 0; i < length; i++)
    {
        duk_get_prop_index(ctx, 0, i);
        r = duk_require_number(ctx, -1);
        duk_pop(ctx);
        count += ppp_utf8_encode(buf, cap, r);
    }
    return 1;
}
static duk_ret_t encode_rune(duk_context *ctx)
{
    duk_size_t p_len;
    uint8_t *p = duk_require_buffer_data(ctx, 0, &p_len);
    ppp_utf8_rune_t r = duk_require_number(ctx, 1);
    int n = ppp_utf8_encode(p, p_len, r);
    duk_pop_2(ctx);
    if (n < 0)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "beyond the range of p");
        duk_throw(ctx);
    }
    duk_push_int(ctx, n);

    return 1;
}
static duk_ret_t encode_rune_len(duk_context *ctx)
{
    ppp_utf8_rune_t r = duk_require_number(ctx, 0);
    int n = ppp_utf8_encode(0, 0, r);
    duk_pop(ctx);
    duk_push_int(ctx, n);
    return 1;
}
static duk_ret_t rune_len(duk_context *ctx)
{
    ppp_utf8_rune_t r = duk_require_number(ctx, 0);
    int n = ppp_utf8_len(r);
    duk_pop(ctx);
    duk_push_int(ctx, n);
    return 1;
}
static duk_ret_t decode_rune_last(duk_context *ctx)
{
    duk_size_t p_len;
    const uint8_t *p = duk_is_string(ctx, 0) ? duk_require_lstring(ctx, 0, &p_len) : duk_require_buffer_data(ctx, 0, &p_len);

    int size;
    ppp_utf8_rune_t r = ppp_utf8_decode_last(p, p_len, &size);

    duk_pop(ctx);
    duk_push_array(ctx);

    duk_push_number(ctx, r);
    duk_put_prop_index(ctx, -2, 0);
    duk_push_number(ctx, size);
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}
static duk_ret_t decode_rune(duk_context *ctx)
{
    duk_size_t p_len;
    const uint8_t *p = duk_is_string(ctx, 0) ? duk_require_lstring(ctx, 0, &p_len) : duk_require_buffer_data(ctx, 0, &p_len);

    int size;
    ppp_utf8_rune_t r = ppp_utf8_decode(p, p_len, &size);

    duk_pop(ctx);
    duk_push_array(ctx);

    duk_push_number(ctx, r);
    duk_put_prop_index(ctx, -2, 0);
    duk_push_number(ctx, size);
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}
static duk_ret_t full_rune(duk_context *ctx)
{
    duk_size_t p_len;
    const uint8_t *p;
    if (duk_is_string(ctx, 0))
    {
        p = duk_require_lstring(ctx, 0, &p_len);
    }
    else if (duk_is_buffer_data(ctx, 0))
    {
        p = duk_require_buffer_data(ctx, 0, &p_len);
    }
    else
    {
        duk_pop(ctx);
        duk_push_false(ctx);
        return 1;
    }

    duk_pop(ctx);

    if (ppp_utf8_full(p, p_len))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
static duk_ret_t rune_count(duk_context *ctx)
{
    duk_size_t p_len;
    const uint8_t *p = duk_is_string(ctx, 0) ? duk_require_lstring(ctx, 0, &p_len) : duk_require_buffer_data(ctx, 0, &p_len);

    duk_pop(ctx);

    duk_push_number(ctx, ppp_utf8_count(p, p_len));
    return 1;
}
static duk_ret_t is_valid(duk_context *ctx)
{
    duk_size_t p_len;
    const uint8_t *p;
    if (duk_is_string(ctx, 0))
    {
        p = duk_require_lstring(ctx, 0, &p_len);
    }
    else if (duk_is_buffer_data(ctx, 0))
    {
        p = duk_require_buffer_data(ctx, 0, &p_len);
    }
    else
    {
        duk_pop(ctx);
        duk_push_false(ctx);
        return 1;
    }
    duk_pop(ctx);

    if (ppp_utf8_is_valid(p, p_len))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
static duk_ret_t is_rune(duk_context *ctx)
{
    if (!duk_is_number(ctx, 0))
    {
        duk_pop(ctx);
        duk_push_false(ctx);
        return 1;
    }
    ppp_utf8_rune_t r = duk_require_number(ctx, 0);
    duk_pop(ctx);

    if (ppp_utf8_is_rune(r))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
EJS_SHARED_MODULE__DECLARE(unicode_utf8)
{
    duk_eval_lstring(ctx, js_ejs_js_unicode_utf8_min_js, js_ejs_js_unicode_utf8_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, append_rune, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "append_rune", 11);

        duk_push_c_lightfunc(ctx, encode_rune, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "encode", 6);
        duk_push_c_lightfunc(ctx, encode_rune_len, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "encode_len", 10);
        duk_push_c_lightfunc(ctx, rune_len, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "len", 3);
        duk_push_c_lightfunc(ctx, decode_rune_last, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "decode_last", 11);
        duk_push_c_lightfunc(ctx, decode_rune, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "decode", 6);
        duk_push_c_lightfunc(ctx, full_rune, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "full", 4);
        duk_push_c_lightfunc(ctx, rune_count, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "count", 5);
        duk_push_c_lightfunc(ctx, rune_count, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "count", 5);
        duk_push_c_lightfunc(ctx, is_valid, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "is_valid", 8);
        duk_push_c_lightfunc(ctx, is_rune, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "is_rune", 7);
    }
    duk_call(ctx, 3);

    return 0;
}