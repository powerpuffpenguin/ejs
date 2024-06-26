#include "_duk_async.h"

/**
 * ... opts cb finalizer -> ... finalizer{cb:cb,opts:opts}
 */
void _ejs_async_post_or_send(duk_context *ctx, ejs_async_function_t worker_cb, duk_c_function return_cb)
{
    duk_get_prop_lstring(ctx, -3, "post", 4);
    duk_bool_t post = 0;
    if (!duk_is_null_or_undefined(ctx, -1))
    {
        if (!duk_is_boolean(ctx, -1))
        {
            duk_to_boolean(ctx, -1);
        }
        post = duk_require_boolean(ctx, -1);
    }
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
duk_ret_t _ejs_async_return_void_impl(duk_context *ctx)
{
    _ejs_async_return_void_t *args = _ejs_async_return(ctx);
    if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_call(ctx, 1);
    }
    else
    {
        duk_call(ctx, 0);
    }
    return 0;
}
duk_ret_t _ejs_async_return_number_impl(duk_context *ctx)
{
    _ejs_async_return_number_t *args = _ejs_async_return(ctx);
    if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else
    {
        duk_push_number(ctx, args->n);
        duk_call(ctx, 1);
    }
    return 0;
}
duk_ret_t _ejs_async_return_uint8array_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    _ejs_async_return_uint8array_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        if (p->buffer)
        {
            free(p->buffer);
        }
        free(p);
    }
    return 0;
}
static duk_ret_t _ejs_async_return_uint8array__impl(duk_context *ctx)
{
    _ejs_async_return_uint8array_t *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    void *dst = duk_push_fixed_buffer(ctx, args->buffer_len);
    if (args->buffer_len)
    {
        memcpy(dst, args->buffer, args->buffer_len);
    }
    return 1;
}
static duk_ret_t _ejs_async_return_uint8array_text__impl(duk_context *ctx)
{
    _ejs_async_return_uint8array_t *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    if (args->buffer_len)
    {
        void *dst = duk_push_fixed_buffer(ctx, args->buffer_len);
        memcpy(dst, args->buffer, args->buffer_len);
        duk_buffer_to_string(ctx, -1);
    }
    else
    {
        duk_push_lstring(ctx, "", 0);
    }
    return 1;
}
void _ejs_async_return_uint8array_or_text_impl(duk_context *ctx, duk_bool_t text)
{
    _ejs_async_return_uint8array_t *args = _ejs_async_return(ctx);

    if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
    }
    else if (!ejs_pcall_function(ctx, text ? _ejs_async_return_uint8array_text__impl : _ejs_async_return_uint8array__impl, args))
    {
        duk_call(ctx, 1);
        return;
    }
    duk_push_undefined(ctx);
    duk_swap_top(ctx, -2);
    duk_call(ctx, 2);
}
duk_ret_t _ejs_async_return_uint8array_impl(duk_context *ctx)
{
    _ejs_async_return_uint8array_or_text_impl(ctx, 0);
    return 0;
}
duk_ret_t _ejs_async_return_uint8array_text_impl(duk_context *ctx)
{
    _ejs_async_return_uint8array_or_text_impl(ctx, 1);
    return 0;
}
duk_ret_t _ejs_async_return_buffer_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    _ejs_async_return_buffer_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        ppp_buffer_destroy(&p->buffer);
        free(p);
    }
    return 0;
}
