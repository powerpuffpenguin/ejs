#include "modules_shared.h"
#include "../js/strconv.h"

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
        duk_push_c_lightfunc(ctx, toBuffer, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "toBuffer", 8);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */

    duk_call(ctx, 3);
    return 0;
}