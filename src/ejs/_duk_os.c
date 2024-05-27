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


#define _ejs_define_os_uint(ctx, macro) _ejs_define_os_uint_impl(ctx, #macro, macro)
static void _ejs_define_os_uint_impl(duk_context *ctx, const char *name, duk_uint_t val)
{
    duk_push_string(ctx, name);
    duk_push_uint(ctx, val);
    duk_def_prop(ctx, -3, DUK_DEFPROP_HAVE_VALUE);
}

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
        DUK_PUSH_FD(ctx, args->fd);
        duk_put_prop_lstring(ctx, -2, "fd", 2);
        duk_push_string(ctx, args->opts.name);
        duk_put_prop_lstring(ctx, -2, "name", 4);
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
        DUK_PUSH_FD(ctx, args->fd);
        duk_put_prop_lstring(ctx, -2, "fd", 2);
        duk_push_string(ctx, opts.name);
        duk_put_prop_lstring(ctx, -2, "name", 4);
        duk_push_c_lightfunc(ctx, ejs_fd_finalizer, 1, 1, 0);
        duk_set_finalizer(ctx, -2);
        args->fd = -1;
        return 1;
    }
    else
    {
        duk_get_prop_lstring(ctx, 0, "post", 4);
        duk_bool_t post = duk_get_boolean_default(ctx, -1, 0);
        duk_pop(ctx);

        f_open_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_open_async_args_t), ejs_default_finalizer);
        p->opts = opts;

        duk_swap_top(ctx, -2);
        duk_put_prop_lstring(ctx, -2, "cb", 2);
        duk_swap_top(ctx, -2);
        duk_put_prop_lstring(ctx, -2, "opts", 4);

        if (post)
        {
            ejs_async_cb_post(ctx, f_open_async_impl, f_open_async_return);
        }
        else
        {
            ejs_async_cb_send(ctx, f_open_async_impl, f_open_async_return);
        }
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
static void f_push_fstat(duk_context *ctx, const char *name, struct stat *info)
{
    duk_push_object(ctx);
    duk_push_string(ctx, name);
    duk_put_prop_lstring(ctx, -2, "_p", 2);
    duk_push_number(ctx, info->st_size);
    duk_put_prop_lstring(ctx, -2, "size", 4);
    duk_push_number(ctx, info->st_mode);
    duk_put_prop_lstring(ctx, -2, "mode", 4);
    duk_push_number(ctx, info->st_mtime);
    duk_put_prop_lstring(ctx, -2, "_m", 2);
    if (S_ISDIR(info->st_mode))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    duk_put_prop_lstring(ctx, -2, "dir", 3);
    if (S_ISREG(info->st_mode))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    duk_put_prop_lstring(ctx, -2, "regular", 7);
}
typedef struct
{
    const char *name;
    int fd;
    struct stat info;
    int err;
} f_fstat_async_args_t;
static void f_fstat_async_impl(void *userdata)
{
    f_fstat_async_args_t *args = userdata;
    if (args->fd == -1)
    {
        args->err = stat(args->name, &args->info) ? errno : 0;
    }
    else
    {
        args->err = fstat(args->fd, &args->info) ? errno : 0;
    }
}
static duk_ret_t f_fstat_async_return(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    f_fstat_async_args_t *args = duk_require_pointer(ctx, -1);
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
        f_push_fstat(ctx, args->name, &args->info);
        duk_call(ctx, 1);
    }
    return 0;
}
static duk_ret_t f_fstat(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "file", 4);

    duk_get_prop_lstring(ctx, -1, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, -1, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop_2(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        struct stat info;
        if (fstat(fd, &info))
        {
            ejs_throw_os_errno(ctx);
        }
        f_push_fstat(ctx, name, &info);
        return 1;
    }
    else
    {
        duk_get_prop_lstring(ctx, 0, "post", 4);
        duk_bool_t post = duk_get_boolean_default(ctx, -1, 0);
        duk_pop(ctx);

        f_fstat_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_fstat_async_args_t), ejs_default_finalizer);
        p->name = name;
        p->fd = fd;
        duk_swap_top(ctx, -2);
        duk_put_prop_lstring(ctx, -2, "cb", 2);
        duk_swap_top(ctx, -2);
        duk_put_prop_lstring(ctx, -2, "opts", 4);

        if (post)
        {
            ejs_async_cb_post(ctx, f_fstat_async_impl, f_fstat_async_return);
        }
        else
        {
            ejs_async_cb_send(ctx, f_fstat_async_impl, f_fstat_async_return);
        }
        return 0;
    }
}
static duk_ret_t f_stat(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);
    if (duk_is_undefined(ctx, 1))
    {
        struct stat info;
        if (stat(name, &info))
        {
            ejs_throw_os_errno(ctx);
        }
        f_push_fstat(ctx, name, &info);
        return 1;
    }
    else
    {
        duk_get_prop_lstring(ctx, 0, "post", 4);
        duk_bool_t post = duk_get_boolean_default(ctx, -1, 0);
        duk_pop(ctx);

        f_fstat_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_fstat_async_args_t), ejs_default_finalizer);
        p->name = name;
        p->fd = -1;
        duk_swap_top(ctx, -2);
        duk_put_prop_lstring(ctx, -2, "cb", 2);
        duk_swap_top(ctx, -2);
        duk_put_prop_lstring(ctx, -2, "opts", 4);

        if (post)
        {
            ejs_async_cb_post(ctx, f_fstat_async_impl, f_fstat_async_return);
        }
        else
        {
            ejs_async_cb_send(ctx, f_fstat_async_impl, f_fstat_async_return);
        }
        return 0;
    }
}
static duk_ret_t fileinfo_name(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "_p", 2);
    duk_size_t len;
    const uint8_t *s = duk_require_lstring(ctx, -1, &len);
    duk_size_t offset;
    for (duk_size_t i = 0; i < len; i++)
    {
        offset = len - i - 1;
#ifdef EJS_OS_WINDOWS
        if (s[offset] == '/' || s[offset] == '\\')
#else
        if (s[offset] == '/')
#endif
        {
            duk_swap_top(ctx, -2);
            duk_pop(ctx);
            duk_push_lstring(ctx, s + offset + 1, len - offset - 1);
            return 1;
        }
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
        // duk_push_uint(ctx, O_WRONLY);
        // duk_put_prop_lstring(ctx, -2, "O_WRONLY", 8);
        duk_push_uint(ctx, O_RDWR);
        duk_put_prop_lstring(ctx, -2, "O_RDWR", 6);

        // duk_push_uint(ctx, O_APPEND);
        // duk_put_prop_lstring(ctx, -2, "O_APPEND", 8);
        duk_push_uint(ctx, O_CREAT);
        duk_put_prop_lstring(ctx, -2, "O_CREATE", 8);
        // duk_push_uint(ctx, O_EXCL);
        // duk_put_prop_lstring(ctx, -2, "O_EXCL", 6);
        // duk_push_uint(ctx, O_SYNC);
        // duk_put_prop_lstring(ctx, -2, "O_SYNC", 6);
        duk_push_uint(ctx, O_TRUNC);
        duk_put_prop_lstring(ctx, -2, "O_TRUNC", 7);

        duk_push_uint(ctx, EBADF);
        duk_put_prop_lstring(ctx, -2, "EBADF", 5);

        duk_push_c_lightfunc(ctx, f_open, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "open", 4);
        duk_push_c_lightfunc(ctx, f_fstat, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "fstat", 5);
        duk_push_c_lightfunc(ctx, f_stat, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "stat", 4);

        duk_push_c_lightfunc(ctx, fileinfo_name, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "fileinfo_name", 13);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);
    // open
    _ejs_define_os_uint(ctx, O_RDONLY);
    _ejs_define_os_uint(ctx, O_WRONLY);
    _ejs_define_os_uint(ctx, O_RDWR);

    _ejs_define_os_uint(ctx, O_APPEND);
    _ejs_define_os_uint_impl(ctx, "O_CREATE", O_CREAT);
    _ejs_define_os_uint(ctx, O_EXCL);
    _ejs_define_os_uint(ctx, O_SYNC);
    _ejs_define_os_uint(ctx, O_TRUNC);

    // errno
    _ejs_define_os_uint(ctx, EPERM);
    _ejs_define_os_uint(ctx, ENOENT);
    _ejs_define_os_uint(ctx, ESRCH);
    _ejs_define_os_uint(ctx, EINTR);
    _ejs_define_os_uint(ctx, EIO);
    _ejs_define_os_uint(ctx, ENXIO);
    _ejs_define_os_uint(ctx, E2BIG);
    _ejs_define_os_uint(ctx, ENOEXEC);
    _ejs_define_os_uint(ctx, EBADF);
    _ejs_define_os_uint(ctx, ECHILD);
    _ejs_define_os_uint(ctx, EAGAIN);
    _ejs_define_os_uint(ctx, ENOMEM);
    _ejs_define_os_uint(ctx, EACCES);
    _ejs_define_os_uint(ctx, EFAULT);
    _ejs_define_os_uint(ctx, ENOTBLK);
    _ejs_define_os_uint(ctx, EBUSY);
    _ejs_define_os_uint(ctx, EEXIST);
    _ejs_define_os_uint(ctx, EXDEV);
    _ejs_define_os_uint(ctx, ENODEV);
    _ejs_define_os_uint(ctx, ENOTDIR);
    _ejs_define_os_uint(ctx, EISDIR);
    _ejs_define_os_uint(ctx, EINVAL);
    _ejs_define_os_uint(ctx, ENFILE);
    _ejs_define_os_uint(ctx, EMFILE);
    _ejs_define_os_uint(ctx, ENOTTY);
    _ejs_define_os_uint(ctx, ETXTBSY);
    _ejs_define_os_uint(ctx, EFBIG);
    _ejs_define_os_uint(ctx, ENOSPC);
    _ejs_define_os_uint(ctx, ESPIPE);
    _ejs_define_os_uint(ctx, EROFS);
    _ejs_define_os_uint(ctx, EMLINK);
    _ejs_define_os_uint(ctx, EPIPE);
    _ejs_define_os_uint(ctx, EDOM);
    _ejs_define_os_uint(ctx, ERANGE);

    return 0;
}