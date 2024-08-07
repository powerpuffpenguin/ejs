#include "modules_shared.h"
#include "../js/sync.h"

EJS_SHARED_MODULE__DECLARE(sync)
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

    return 0;
}