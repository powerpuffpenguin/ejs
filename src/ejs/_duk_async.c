#include "_duk_async.h"

/**
 * ... opts cb finalizer -> ... finalizer{cb:cb,opts:opts}
 */
void _ejs_async_post_or_send(duk_context *ctx, ejs_async_function_t worker_cb, duk_c_function return_cb)
{
    duk_get_prop_lstring(ctx, -3, "post", 4);
    duk_bool_t post = duk_get_boolean_default(ctx, -1, 0);
    duk_pop(ctx);

    duk_swap_top(ctx, -2);
    duk_put_prop_lstring(ctx, -2, "cb", 2);
    duk_swap_top(ctx, -2);
    duk_put_prop_lstring(ctx, -2, "opts", 4);

    if (post)
    {
        ejs_async_cb_post(ctx, worker_cb, return_cb);
    }
    else
    {
        ejs_async_cb_send(ctx, worker_cb, return_cb);
    }
}
void *_ejs_async_return(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    void *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, -1, "cb", 2);
    return args;
}
void *_ejs_async_args(duk_context *ctx, duk_idx_t idx)
{
    duk_get_prop_lstring(ctx, idx, "args", 4);
    // if (idx < 0)
    // {
    //     --idx;
    // }
    // duk_del_prop_lstring(ctx, idx, "args", 4);

    duk_get_prop_lstring(ctx, -1, "p", 1);
    void *p = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    return p;
}
