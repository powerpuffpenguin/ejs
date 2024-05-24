#include "_duk_os.h"
#include "js/os.h"
#include "stash.h"
#include "duk.h"
#include "defines.h"

#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

typedef struct
{
    const char *name;
    int flags;
    int perm;
} f_open_options_t;
typedef struct
{
    f_open_options_t opts;
    int fd;
    int err;
} f_open_async_args_t;
static void f_open_async_impl(void *userdata)
{
    f_open_async_args_t *args = userdata;
    args->fd = open(args->opts.name, args->opts.flags, args->opts.perm);
    args->err = EJS_INVALID_FD(args->fd) ? errno : 0;
}
static duk_ret_t f_open_async_return(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    f_open_async_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "cb", 2);
    if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else
    {
        duk_push_object(ctx);
        duk_push_number(ctx, args->fd);
        duk_put_prop_lstring(ctx, -2, "fd", 2);
        duk_push_c_lightfunc(ctx, ejs_fd_finalizer, 1, 1, 0);
        duk_set_finalizer(ctx, -2);
        duk_call(ctx, 1);
    }
    return 0;
}
typedef struct
{
    int fd;
} f_open_args_t;
static duk_ret_t f_open_impl(duk_context *ctx)
{
    f_open_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    f_open_options_t opts;
    duk_get_prop_lstring(ctx, 0, "name", 4);
    if (!duk_is_string(ctx, -1))
    {
        duk_push_error_object(ctx, DUK_ERR_TYPE_ERROR, "file name must be a string");
        duk_throw(ctx);
    }
    duk_size_t len;
    if (duk_is_undefined(ctx, 1))
    {
        opts.name = duk_require_string(ctx, -1);
    }
    else
    {
        opts.name = duk_require_lstring(ctx, -1, &len);
    }
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "flags", 5);
    opts.flags = duk_get_uint_default(ctx, -1, 0);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "perm", 4);
    opts.perm = duk_get_uint_default(ctx, -1, 0);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        args->fd = open(opts.name, opts.flags, opts.perm);
        if (EJS_INVALID_FD(args->fd))
        {
            duk_pop_2(ctx);
            ejs_throw_os_errno(ctx);
        }
        duk_pop_2(ctx);
        duk_push_object(ctx);
        duk_push_number(ctx, args->fd);
        duk_put_prop_lstring(ctx, -2, "fd", 2);
        duk_push_c_lightfunc(ctx, ejs_fd_finalizer, 1, 1, 0);
        duk_set_finalizer(ctx, -2);
        args->fd = -1;
        return 1;
    }
    else
    {
        f_open_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_open_async_args_t), ejs_default_finalizer);
        p->opts = opts;

        duk_swap_top(ctx, -2);
        duk_put_prop_lstring(ctx, -2, "cb", 2);
        duk_swap_top(ctx, -2);
        duk_put_prop_lstring(ctx, -2, "opts", 4);

        ejs_async_cb_post(ctx, f_open_async_impl, f_open_async_return);
    }
    return 0;
}
static duk_ret_t f_open(duk_context *ctx)
{
    f_open_args_t args = {
        .fd = -1,
    };
    if (ejs_pcall_function_n(ctx, f_open_impl, &args, 3))
    {
        if (!EJS_INVALID_FD(args.fd))
        {
            close(args.fd);
        }
        duk_throw(ctx);
    }
    return 1;
}

duk_ret_t _ejs_native_os_init(duk_context *ctx)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_os_min_js, js_ejs_js_os_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_uint(ctx, O_RDONLY);
        duk_put_prop_lstring(ctx, -2, "O_RDONLY", 8);
        duk_push_uint(ctx, O_WRONLY);
        duk_put_prop_lstring(ctx, -2, "O_WRONLY", 8);
        duk_push_uint(ctx, O_RDWR);
        duk_put_prop_lstring(ctx, -2, "O_RDWR", 6);

        duk_push_uint(ctx, O_APPEND);
        duk_put_prop_lstring(ctx, -2, "O_APPEND", 8);
        duk_push_uint(ctx, O_CREAT);
        duk_put_prop_lstring(ctx, -2, "O_CREATE", 8);
        duk_push_uint(ctx, O_EXCL);
        duk_put_prop_lstring(ctx, -2, "O_EXCL", 6);
        duk_push_uint(ctx, O_SYNC);
        duk_put_prop_lstring(ctx, -2, "O_SYNC", 6);
        duk_push_uint(ctx, O_TRUNC);
        duk_put_prop_lstring(ctx, -2, "O_TRUNC", 7);

        duk_push_c_lightfunc(ctx, f_open, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "open", 4);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);

    return 0;
}