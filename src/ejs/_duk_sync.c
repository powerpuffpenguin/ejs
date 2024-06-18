#include "_duk_sync.h"
#include "js/sync.h"
#include "stash.h"
static duk_ret_t in_thread(duk_context *ctx)
{
    duk_push_current_thread(ctx);
    duk_bool_t ok = duk_is_undefined(ctx, -1);
    duk_pop(ctx);
    if (ok)
    {
        duk_push_false(ctx);
    }
    else
    {
        duk_push_true(ctx);
    }
    return 1;
}
duk_ret_t _ejs_native_sync_init(duk_context *ctx)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_sync_min_js, js_ejs_js_sync_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */

    duk_call(ctx, 3);

    duk_push_c_lightfunc(ctx, in_thread, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "in_thread", 9);
    return 0;
}