#include "modules_shared.h"
#include "../js/strconv.h"
#include "unicode_utf8.h"
#include "_append.h"
#include "../internal/strconv.h"
static duk_ret_t toString(duk_context *ctx)
{
    duk_size_t len;
    const void *src = duk_require_buffer_data(ctx, -1, &len);
    duk_pop(ctx);
    if (len)
    {
        duk_push_lstring(ctx, src, len);
    }
    else
    {
        duk_push_lstring(ctx, "", 0);
    }
    return 1;
}
static duk_ret_t toBuffer(duk_context *ctx)
{
    duk_size_t len;
    const void *src = duk_require_lstring(ctx, -1, &len);
    duk_pop(ctx);
    if (len)
    {
        void *dst = duk_push_fixed_buffer(ctx, len);
        memcpy(dst, src, len);
    }
    else
    {
        duk_push_fixed_buffer(ctx, 0);
    }
    return 1;
}
static void bool_get_at(duk_context *ctx, duk_idx_t idx, void *value)
{
    if (duk_is_null_or_undefined(ctx, idx))
    {
        return;
    }
    if (!duk_is_boolean(ctx, idx))
    {
        duk_to_boolean(ctx, idx);
    }
    if (duk_require_boolean(ctx, -1))
    {
        *(uint8_t *)value = 1;
    }
}
static int bool_encode(void *dst, size_t dst_len, void *value)
{
    ppp_strconv_encode_bool(dst, dst_len, *(uint8_t *)value ? 1 : 0);
}
static duk_ret_t appendBool(duk_context *ctx)
{
    uint8_t value = 0;
    __ejs__modules_append(
        ctx,
        &value, 4,
        bool_get_at, bool_encode);
}
static duk_ret_t formatFloat(duk_context *ctx)
{

    // f float64, fmt byte, prec, bitSize int
    return 1;
}
EJS_SHARED_MODULE__DECLARE(strconv)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_strconv_min_js, js_ejs_js_strconv_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {

        duk_push_c_lightfunc(ctx, toString, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "toString", 8);
        duk_push_c_lightfunc(ctx, toBuffer, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "toBuffer", 8);

        duk_push_c_lightfunc(ctx, __ejs__modules_append_value, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "append", 6);

        duk_push_c_lightfunc(ctx, __ejs__unicode_utf8__append_rune, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "appendRune", 10);

        duk_push_c_lightfunc(ctx, appendBool, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "appendBool", 10);

        duk_push_c_lightfunc(ctx, formatFloat, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "formatFloat", 11);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */

    duk_call(ctx, 3);
    return 0;
}