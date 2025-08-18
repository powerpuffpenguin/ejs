#include "modules_shared.h"
#include "../js/os.h"

#include <errno.h>
#include <sys/types.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>
#include <dirent.h>
#include <stdlib.h>

inline static const char *_ejs_os_get_define(const char *s, size_t n, size_t *p)
{
    if (p)
    {
        *p = n;
    }
    return s;
}

static const char *_ejs_os_temp_dir(size_t *outlen)
{
    const char *dir = getenv("TMPDIR");
    if (dir)
    {
        *outlen = strlen(dir);
        return dir;
    }
    else
    {
        size_t len;
        const char *os = _ejs_os_get_define(EJS_CONFIG_OS, &len);
        if (7 == len && !memcmp(os, "android", 7))
        {

            *outlen = 15;

            return "/data/local/tmp";
        }
        else
        {
            *outlen = 4;
            return "/tmp";
        }
    }
    *outlen = 0;
    return 0;
}

#define _ejs_define_os_uint(ctx, macro) _ejs_define_os_uint_impl(ctx, #macro, macro)
static void _ejs_define_os_uint_impl(duk_context *ctx, const char *name, duk_uint_t val)
{
    duk_push_string(ctx, name);
    duk_push_uint(ctx, val);
    duk_def_prop(ctx, -3, DUK_DEFPROP_HAVE_VALUE);
}

typedef struct
{
    int err;
    int fd;

    const char *name;
    size_t len;
    int flags;
    int perm;
} f_open_async_args_t;
static void f_open_async_impl(void *userdata)
{
    f_open_async_args_t *args = userdata;
    args->fd = open(args->name, args->flags, args->perm);
    args->err = EJS_IS_INVALID_FD(args->fd) ? errno : 0;
}
static void f_push_file_object(duk_context *ctx, int fd, const char *name, duk_size_t len)
{
    duk_push_object(ctx);
    DUK_PUSH_FD(ctx, fd);
    duk_put_prop_lstring(ctx, -2, "fd", 2);
    duk_push_lstring(ctx, name, len);
    duk_put_prop_lstring(ctx, -2, "name", 4);
    duk_push_c_lightfunc(ctx, ejs_fd_finalizer, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
}
static duk_ret_t f_open_async_return(duk_context *ctx)
{
    f_open_async_args_t *args = _ejs_async_return(ctx);
    if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else
    {
        f_push_file_object(ctx, args->fd, args->name, args->len);
        duk_call(ctx, 1);
    }
    return 0;
}
typedef struct
{
    int fd;
    const char *name;
    duk_size_t len;
    int flags;
    int perm;
} f_open_args_t;
static duk_ret_t f_open_impl(duk_context *ctx)
{
    f_open_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    args->fd = open(args->name, args->flags, args->perm);
    if (EJS_IS_INVALID_FD(args->fd))
    {
        ejs_throw_os_errno(ctx);
    }
    duk_push_object(ctx);
    DUK_PUSH_FD(ctx, args->fd);
    duk_put_prop_lstring(ctx, -2, "fd", 2);
    duk_push_lstring(ctx, args->name, args->len);
    duk_put_prop_lstring(ctx, -2, "name", 4);
    duk_push_c_lightfunc(ctx, ejs_fd_finalizer, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->fd = EJS_INVALID_FD;
    return 1;
}
static duk_ret_t f_open_file(duk_context *ctx, int flags_def, int perm_def)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    if (!duk_is_string(ctx, -1))
    {
        duk_push_error_object(ctx, DUK_ERR_TYPE_ERROR, "file name must be a string");
        duk_throw(ctx);
    }
    duk_size_t len;
    const char *name = duk_require_lstring(ctx, -1, &len);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "flags", 5);
    int flags = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, -1, flags_def);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "perm", 4);
    int perm = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, -1, perm_def);
    duk_pop(ctx);
    if (duk_is_undefined(ctx, 1))
    {
        f_open_args_t args = {
            .name = name,
            .len = len,
            .flags = flags,
            .perm = perm,
            .fd = EJS_INVALID_FD,
        };
        duk_pop(ctx);
        if (ejs_pcall_function(ctx, f_open_impl, &args))
        {
            EJS_CLOSE_FD(args.fd);
            duk_throw(ctx);
        }
        return 1;
    }

    f_open_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_open_async_args_t), ejs_default_finalizer);
    p->flags = flags;
    p->perm = perm;
    p->name = name;
    p->len = len;
    _ejs_async_post_or_send(ctx, f_open_async_impl, f_open_async_return);
    return 0;
}
static duk_ret_t f_open(duk_context *ctx)
{
    return f_open_file(ctx, O_RDONLY, 0);
}
static duk_ret_t f_create(duk_context *ctx)
{
    return f_open_file(ctx, O_RDWR | O_CREAT | O_TRUNC, 0666);
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

    duk_uint_t mode = 0;

    if (S_ISDIR(info->st_mode))
    {
        mode |= 0x1;
    }
    if (S_ISREG(info->st_mode))
    {
        mode |= 0x2;
    }
    if (S_ISLNK(info->st_mode))
    {
        mode |= 0x4;
    }
    duk_push_uint(ctx, mode);
    duk_put_prop_lstring(ctx, -2, "_mode", 5);
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
    f_fstat_async_args_t *args = _ejs_async_return(ctx);
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

    f_fstat_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_fstat_async_args_t), ejs_default_finalizer);
    p->name = name;
    p->fd = fd;
    _ejs_async_post_or_send(ctx, f_fstat_async_impl, f_fstat_async_return);
    return 0;
}
static duk_ret_t f_close(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_set_finalizer(ctx, -2);
    close(fd);
    return 0;
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

    f_fstat_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_fstat_async_args_t), ejs_default_finalizer);
    p->name = name;
    p->fd = EJS_INVALID_FD;

    _ejs_async_post_or_send(ctx, f_fstat_async_impl, f_fstat_async_return);
    return 0;
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

typedef struct
{
    int fd;
    off_t offset;
    duk_uint_t whence;

    int err;
} f_seek_async_args_t;

static void f_seek_async_impl(void *userdata)
{
    f_seek_async_args_t *args = userdata;
    args->offset = lseek(args->fd, args->offset, args->whence);
    args->err = EJS_SYSTEM_ERROR(args->offset) ? errno : 0;
}
static duk_ret_t f_seek_async_return(duk_context *ctx)
{
    f_seek_async_args_t *args = _ejs_async_return(ctx);
    if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else
    {
        duk_push_number(ctx, args->offset);
        duk_call(ctx, 1);
    }
    return 0;
}

static duk_ret_t f_seek(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "offset", 6);
    off_t offset = duk_require_number(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "whence", 6);
    duk_uint_t whence = duk_require_uint(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        offset = lseek(fd, offset, whence);
        if (EJS_SYSTEM_ERROR(offset))
        {
            ejs_throw_os_errno(ctx);
        }
        duk_push_number(ctx, offset);
        return 1;
    }
    f_seek_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_seek_async_args_t), ejs_default_finalizer);
    p->fd = fd;
    p->offset = offset;
    p->whence = whence;

    _ejs_async_post_or_send(ctx, f_seek_async_impl, f_seek_async_return);
    return 0;
}
static duk_ret_t f_isBufferData(duk_context *ctx)
{
    if (duk_is_buffer_data(ctx, 0))
    {
        duk_pop(ctx);
        duk_push_true(ctx);
    }
    else
    {
        duk_pop(ctx);
        duk_push_false(ctx);
    }
    return 1;
}
typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_NUMBER

    int fd;
    duk_size_t len;
    uint8_t *dst;

} f_read_async_args_t;
static void f_read_async_impl(void *userdata)
{
    f_read_async_args_t *args = userdata;
    ssize_t n = read(args->fd, args->dst, args->len);
    args->result.err = EJS_SYSTEM_ERROR(n) ? errno : 0;
    args->result.n = n;
}
static duk_ret_t f_read_args(duk_context *ctx)
{
    ejs_push_finalizer_object(ctx, sizeof(f_read_async_args_t), ejs_default_finalizer);
    return 1;
}
static duk_ret_t f_read(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "dst", 3);
    duk_size_t len;
    uint8_t *dst = duk_require_buffer_data(ctx, -1, &len);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        ssize_t n = read(fd, dst, len);
        if (EJS_SYSTEM_ERROR(n))
        {
            ejs_throw_os_errno(ctx);
        }
        duk_push_number(ctx, n);
        return 1;
    }
    f_read_async_args_t *p = _ejs_async_args(ctx, 0);
    p->fd = fd;
    p->dst = dst;
    p->len = len;

    EJS_ASYNC_POST_OR_SEND_NUMBER(ctx, f_read_async_impl);
    return 0;
}
typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_NUMBER
    int fd;
    off_t offset;
    duk_size_t len;
    uint8_t *dst;
} f_readAt_async_args_t;
static void f_readAt_async_impl(void *userdata)
{
    f_readAt_async_args_t *args = userdata;
    ssize_t n = pread(args->fd, args->dst, args->len, args->offset);
    args->result.err = EJS_SYSTEM_ERROR(n) ? errno : 0;
    args->result.n = n;
}
static duk_ret_t f_readAt_args(duk_context *ctx)
{
    ejs_push_finalizer_object(ctx, sizeof(f_readAt_async_args_t), ejs_default_finalizer);
    return 1;
}
static duk_ret_t f_readAt(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "dst", 3);
    duk_size_t len;
    uint8_t *dst = duk_require_buffer_data(ctx, -1, &len);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "offset", 6);
    off_t offset = duk_require_number(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        ssize_t n = pread(fd, dst, len, offset);
        if (EJS_SYSTEM_ERROR(n))
        {
            ejs_throw_os_errno(ctx);
        }
        duk_push_number(ctx, n);
        return 1;
    }
    f_readAt_async_args_t *p = _ejs_async_args(ctx, 0);
    p->fd = fd;
    p->offset = offset;
    p->dst = dst;
    p->len = len;

    EJS_ASYNC_POST_OR_SEND_NUMBER(ctx, f_readAt_async_impl);
    return 0;
}
typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_NUMBER

    int fd;
    duk_size_t len;
    const uint8_t *buf;
} f_write_async_args_t;
static void f_write_async_impl(void *userdata)
{
    f_write_async_args_t *args = userdata;
    ssize_t n = write(args->fd, args->buf, args->len);
    args->result.err = EJS_SYSTEM_ERROR(n) ? errno : 0;
    args->result.n = n;
}
static duk_ret_t f_write_args(duk_context *ctx)
{
    ejs_push_finalizer_object(ctx, sizeof(f_write_async_args_t), ejs_default_finalizer);
    return 1;
}
static duk_ret_t f_write(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "src", 3);
    duk_size_t len;
    const uint8_t *buf = duk_is_string(ctx, -1) ? duk_require_lstring(ctx, -1, &len) : duk_require_buffer_data(ctx, -1, &len);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        ssize_t n = write(fd, buf, len);
        if (EJS_SYSTEM_ERROR(n))
        {
            ejs_throw_os_errno(ctx);
        }
        duk_push_number(ctx, n);
        return 1;
    }
    f_write_async_args_t *p = _ejs_async_args(ctx, 0);
    p->fd = fd;
    p->buf = buf;
    p->len = len;

    EJS_ASYNC_POST_OR_SEND_NUMBER(ctx, f_write_async_impl);
    return 0;
}
typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_NUMBER

    int fd;
    off_t offset;
    duk_size_t len;
    const uint8_t *buf;
} f_writeAt_async_args_t;
static void f_writeAt_async_impl(void *userdata)
{
    f_writeAt_async_args_t *args = userdata;
    ssize_t n = pwrite(args->fd, args->buf, args->len, args->offset);
    args->result.err = EJS_SYSTEM_ERROR(n) ? errno : 0;
    args->result.n = n;
}
static duk_ret_t f_writeAt_args(duk_context *ctx)
{
    ejs_push_finalizer_object(ctx, sizeof(f_writeAt_async_args_t), ejs_default_finalizer);
    return 1;
}
static duk_ret_t f_writeAt(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "src", 3);
    duk_size_t len;
    const uint8_t *buf = duk_is_string(ctx, -1) ? duk_require_lstring(ctx, -1, &len) : duk_require_buffer_data(ctx, -1, &len);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "offset", 6);
    off_t offset = duk_require_number(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        ssize_t n = pwrite(fd, buf, len, offset);
        if (EJS_SYSTEM_ERROR(n))
        {
            ejs_throw_os_errno(ctx);
        }
        duk_push_number(ctx, n);
        return 1;
    }
    f_writeAt_async_args_t *p = _ejs_async_args(ctx, 0);
    p->fd = fd;
    p->offset = offset;
    p->buf = buf;
    p->len = len;

    EJS_ASYNC_POST_OR_SEND_NUMBER(ctx, f_writeAt_async_impl);
    return 0;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID

    int fd;
} f_sync_async_args_t;
static void f_sync_async_impl(void *userdata)
{
    f_sync_async_args_t *args = userdata;
    args->result.err = fsync(args->fd) ? errno : 0;
}
static duk_ret_t f_fsync(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);
    if (duk_is_undefined(ctx, 1))
    {
        if (fsync(fd))
        {
            ejs_throw_os_errno(ctx);
        }
        return 0;
    }

    f_sync_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_sync_async_args_t), ejs_default_finalizer);
    p->fd = fd;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_sync_async_impl);
    return 0;
}
static duk_ret_t f_fchdir(duk_context *ctx)
{
    int fd = DUK_REQUIRE_FD(ctx, 0);
    if (fchdir(fd))
    {
        ejs_throw_os_errno(ctx);
    }
    return 0;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID

    int fd;
    mode_t perm;
} f_fchmod_async_args_t;
static void f_fchmod_async_impl(void *userdata)
{
    f_fchmod_async_args_t *args = userdata;
    args->result.err = fchmod(args->fd, args->perm) ? errno : 0;
}
static duk_ret_t f_fchmod(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "perm", 4);
    mode_t perm = duk_require_number(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (fchmod(fd, perm))
        {
            ejs_throw_os_errno(ctx);
        }
        return 0;
    }

    f_fchmod_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_fchmod_async_args_t), ejs_default_finalizer);
    p->fd = fd;
    p->perm = perm;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_fchmod_async_impl);
    return 0;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID

    int fd;
    uid_t uid;
    gid_t gid;
} f_fchown_async_args_t;
static void f_fchown_async_impl(void *userdata)
{
    f_fchown_async_args_t *args = userdata;
    args->result.err = fchown(args->fd, args->uid, args->gid) ? errno : 0;
}

static duk_ret_t f_fchown(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "uid", 3);
    uid_t uid = duk_require_number(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "gid", 3);
    gid_t gid = duk_require_number(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (fchown(fd, uid, gid))
        {
            ejs_throw_os_errno(ctx);
        }
        return 0;
    }

    f_fchown_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_fchown_async_args_t), ejs_default_finalizer);
    p->fd = fd;
    p->uid = uid;
    p->gid = gid;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_fchown_async_impl);
    return 0;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID

    int fd;
    off_t size;
} f_ftruncate_async_args_t;
static void f_ftruncate_async_impl(void *userdata)
{
    f_ftruncate_async_args_t *args = userdata;
    args->result.err = ftruncate(args->fd, args->size) ? errno : 0;
}

static duk_ret_t f_ftruncate(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "size", 4);
    off_t size = duk_require_number(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (ftruncate(fd, size))
        {
            ejs_throw_os_errno(ctx);
        }
        return 0;
    }

    f_ftruncate_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_ftruncate_async_args_t), ejs_default_finalizer);
    p->fd = fd;
    p->size = size;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_ftruncate_async_impl);
    return 0;
}
static duk_ret_t _cwd(duk_context *ctx)
{
    char buf[MAXPATHLEN] = {0};
    char *s = getcwd(buf, MAXPATHLEN);
    if (!s)
    {
        ejs_throw_os_errno(ctx);
    }
    duk_push_string(ctx, s);
    return 1;
}
static duk_ret_t _chdir(duk_context *ctx)
{
    const char *path = duk_require_string(ctx, 0);
    if (chdir(path))
    {
        ejs_throw_os_errno(ctx);
    }
    return 0;
}
typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID

    const char *name;
    mode_t perm;
} f_chmod_async_args_t;
static void f_chmod_async_impl(void *userdata)
{
    f_chmod_async_args_t *args = userdata;
    args->result.err = chmod(args->name, args->perm) ? errno : 0;
}
static duk_ret_t f_chmod(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "perm", 4);
    mode_t perm = duk_require_number(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (chmod(name, perm))
        {
            ejs_throw_os_errno(ctx);
        }
        return 0;
    }

    f_chmod_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_chmod_async_args_t), ejs_default_finalizer);
    p->name = name;
    p->perm = perm;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_chmod_async_impl);
    return 0;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID

    const char *name;
    uid_t uid;
    gid_t gid;
} f_chown_async_args_t;
static void f_chown_async_impl(void *userdata)
{
    f_chown_async_args_t *args = userdata;
    args->result.err = chown(args->name, args->uid, args->gid) ? errno : 0;
}

static duk_ret_t f_chown(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "uid", 3);
    uid_t uid = duk_require_number(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "gid", 3);
    gid_t gid = duk_require_number(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (chown(name, uid, gid))
        {
            ejs_throw_os_errno(ctx);
        }
        return 0;
    }

    f_chown_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_chown_async_args_t), ejs_default_finalizer);
    p->name = name;
    p->uid = uid;
    p->gid = gid;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_chown_async_impl);
    return 0;
}
typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID

    const char *name;
    off_t size;
} f_truncate_async_args_t;
static void f_truncate_async_impl(void *userdata)
{
    f_truncate_async_args_t *args = userdata;
    args->result.err = truncate(args->name, args->size) ? errno : 0;
}

static duk_ret_t f_truncate(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "size", 4);
    off_t size = duk_require_number(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (truncate(name, size))
        {
            ejs_throw_os_errno(ctx);
        }
        return 0;
    }

    f_truncate_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_truncate_async_args_t), ejs_default_finalizer);
    p->name = name;
    p->size = size;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_truncate_async_impl);
    return 0;
}

static duk_ret_t read_file(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        return _ejs_read_file(ctx, name);
    }
    return _ejs_async_read_file(ctx, name);
}
static duk_ret_t read_text_file(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        return _ejs_read_text_file(ctx, name);
    }
    return _ejs_async_read_text_file(ctx, name);
}
typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID

    uint8_t *buf;
    duk_size_t size;
    int perm;
    const char *name;
    duk_bool_t sync;
} f_writeFile_async_args_t;

static void f_writeFile_async_impl(void *userdata)
{
    f_writeFile_async_args_t *opts = userdata;
    int f = open(opts->name, O_RDWR | O_CREAT | O_TRUNC, opts->perm);
    if (EJS_IS_INVALID_FD(f))
    {
        opts->result.err = errno;
        return;
    }
    if (opts->size)
    {
        if (write(f, opts->buf, opts->size) != opts->size)
        {
            opts->result.err = errno;
            close(f);
            return;
        }
    }
    if (opts->sync)
    {
        if (fsync(f))
        {
            opts->result.err = errno;
            close(f);
            return;
        }
    }
    close(f);
    opts->result.err = 0;
}

static duk_ret_t f_writeFile(duk_context *ctx)
{
    // ejs_dump_context_stdout(ctx);
    f_writeFile_async_args_t opts;
    duk_get_prop_lstring(ctx, 0, "name", 4);
    opts.name = duk_require_string(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "data", 4);
    if (duk_is_null_or_undefined(ctx, -1))
    {
        opts.size = 0;
        opts.buf = 0;
    }
    else
    {
        opts.buf = duk_require_buffer_data(ctx, -1, &opts.size);
    }
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "sync", 4);
    opts.sync = EJS_BOOL_VALUE(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "perm", 4);
    opts.perm = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, -1, 0666);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        f_writeFile_async_impl(&opts);
        if (opts.result.err)
        {
            ejs_throw_os(ctx, opts.result.err, 0);
        }
        return 0;
    }

    f_writeFile_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_writeFile_async_args_t), ejs_default_finalizer);
    *p = opts;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_writeFile_async_impl);
    return 0;
}
static void _read_dir_names_impl(duk_context *ctx, DIR *dir, int n)
{
    struct dirent *dirent;
    duk_push_array(ctx);
    duk_uarridx_t i = 0;
    while (n < 1 || n > i)
    {
        errno = 0;
        dirent = readdir(dir);
        if (!dirent)
        {
            if (errno)
            {
                ejs_throw_os(ctx, errno, 0);
            }
            break;
        }
        if (dirent->d_name[0] == '.')
        {
            if (dirent->d_name[1] == 0)
            {
                continue;
            }
            else if (dirent->d_name[2] == 0 && dirent->d_name[1] == '.')
            {
                continue;
            }
        }
        duk_push_string(ctx, dirent->d_name);
        duk_put_prop_index(ctx, -2, i++);
    }
}
static int _read_dir_names_async_impl(DIR *dir, int n, ppp_buffer_t *buf)
{
    struct dirent *dirent;
    int i = 0;
    duk_uint16_t len;
    while (n < 1 || n > i)
    {
        errno = 0;
        dirent = readdir(dir);
        if (!dirent)
        {
            if (errno)
            {
                return errno;
            }
            break;
        }
        if (dirent->d_name[0] == '.')
        {
            if (dirent->d_name[1] == 0)
            {
                continue;
            }
            else if (dirent->d_name[2] == 0 && dirent->d_name[1] == '.')
            {
                continue;
            }
        }
        len = strlen(dirent->d_name);

        if (ppp_buffer_write(buf, &len, 2, PPP_BUFFER_DEFAULT_ALLOC) != 2)
        {
            return errno;
        }
        if (ppp_buffer_write(buf, dirent->d_name, len, PPP_BUFFER_DEFAULT_ALLOC) != len)
        {
            return errno;
        }
        ++i;
    }
    return 0;
}
static duk_ret_t _read_dir_return_names(duk_context *ctx)
{
    _ejs_async_return_buffer_t *args = _ejs_async_return(ctx);
    if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else
    {
        duk_push_array(ctx);
        duk_uarridx_t i = 0;
        duk_uint16_t len;
        struct dirent dirent;
        while (ppp_buffer_read(&args->buffer, &len, 2))
        {
            ppp_buffer_read(&args->buffer, dirent.d_name, len);
            duk_push_lstring(ctx, dirent.d_name, len);
            duk_put_prop_index(ctx, -2, i++);
        }
        ppp_buffer_destroy(&args->buffer);
        duk_call(ctx, 1);
    }
    return 0;
}

static void _read_dir_impl(duk_context *ctx, DIR *dir, int fd, int n)
{
    struct dirent *dirent;
    duk_push_array(ctx);
    duk_uarridx_t i = 0;
    struct stat info;
    while (n < 1 || n > i)
    {
        errno = 0;
        dirent = readdir(dir);
        if (!dirent)
        {
            if (errno)
            {
                ejs_throw_os(ctx, errno, 0);
            }
            break;
        }
        if (dirent->d_name[0] == '.')
        {
            if (dirent->d_name[1] == 0)
            {
                continue;
            }
            else if (dirent->d_name[2] == 0 && dirent->d_name[1] == '.')
            {
                continue;
            }
        }
        if (fstatat(fd, dirent->d_name, &info, 0))
        {
            ejs_throw_os_errno(ctx);
        }
        f_push_fstat(ctx, dirent->d_name, &info);
        duk_put_prop_index(ctx, -2, i++);
    }
}
static int _read_dir_async_impl(DIR *dir, int fd, int n, ppp_buffer_t *buffer)
{
    struct dirent *dirent;
    int i = 0;
    duk_uint16_t len;
    struct stat info;
    while (n < 1 || n > i)
    {
        errno = 0;
        dirent = readdir(dir);
        if (!dirent)
        {
            if (errno)
            {
                return errno;
            }
            break;
        }
        if (dirent->d_name[0] == '.')
        {
            if (dirent->d_name[1] == 0)
            {
                continue;
            }
            else if (dirent->d_name[2] == 0 && dirent->d_name[1] == '.')
            {
                continue;
            }
        }
        if (fstatat(fd, dirent->d_name, &info, 0))
        {
            return errno;
        }

        len = strlen(dirent->d_name);
        if (!len)
        {
            continue;
        }
        if (ppp_buffer_write(buffer, &len, 2, PPP_BUFFER_DEFAULT_ALLOC) != 2)
        {
            return errno;
        }
        else if (ppp_buffer_write(buffer, dirent->d_name, len, PPP_BUFFER_DEFAULT_ALLOC) != len)
        {
            return errno;
        }
        else if (ppp_buffer_write(buffer, &info, sizeof(struct stat), PPP_BUFFER_DEFAULT_ALLOC) != sizeof(struct stat))
        {
            return errno;
        }

        ++i;
    }
    return 0;
}
static duk_ret_t f_read_dir_return_dirs(duk_context *ctx)
{
    _ejs_async_return_buffer_t *args = _ejs_async_return(ctx);
    if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else
    {
        duk_push_array(ctx);
        duk_uarridx_t i = 0;
        duk_uint16_t len;
        struct dirent dirent;
        struct stat info;
        while (ppp_buffer_read(&args->buffer, &len, 2))
        {
            ppp_buffer_read(&args->buffer, dirent.d_name, len);
            dirent.d_name[len] = 0;
            ppp_buffer_read(&args->buffer, &info, sizeof(struct stat));
            f_push_fstat(ctx, dirent.d_name, &info);
            duk_put_prop_index(ctx, -2, i++);
        }
        ppp_buffer_destroy(&args->buffer);
        duk_call(ctx, 1);
    }
    return 0;
}

typedef struct
{
    int fd;
    int n;
    DIR *dir;
} f_fread_dir_args_t;
typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_BUFFER;
    int fd;
    int n;
} f_fread_dir_async_args_t;

static duk_ret_t f_fread_dir_impl(duk_context *ctx)
{
    f_fread_dir_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    args->dir = fdopendir(args->fd);
    if (!args->dir)
    {
        ejs_throw_os_errno(ctx);
    }
    _read_dir_impl(ctx, args->dir, args->fd, args->n);
    closedir(args->dir);
    args->dir = 0;
    return 1;
}

static void f_fread_dir_async_impl(void *userdata)
{
    f_fread_dir_async_args_t *args = userdata;
    DIR *dir = fdopendir(args->fd);
    if (!dir)
    {
        args->result.err = errno;
        return;
    }
    args->result.err = _read_dir_async_impl(dir, args->fd, args->n, &args->result.buffer);
    closedir(dir);
    if (args->result.err)
    {
        ppp_buffer_destroy(&args->result.buffer);
    }
}

static duk_ret_t f_fread_dir(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "n", 1);
    int n = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_int(ctx, -1);
    duk_pop(ctx);
    if (duk_is_undefined(ctx, 1))
    {
        f_fread_dir_args_t args = {
            .fd = fd,
            .n = n,
            .dir = 0,
        };
        if (ejs_pcall_function(ctx, f_fread_dir_impl, &args))
        {
            if (args.dir)
            {
                closedir(args.dir);
            }
            duk_throw(ctx);
        }
        return 1;
    }
    f_fread_dir_async_args_t *p = EJS_ASYNC_PUSH_RETURN_BUFFER(ctx, sizeof(f_fread_dir_async_args_t));
    ppp_buffer_init(&p->result.buffer);
    p->fd = fd;
    p->n = n;
    _ejs_async_post_or_send(ctx, f_fread_dir_async_impl, f_read_dir_return_dirs);
    return 0;
}

static duk_ret_t f_fread_dir_names_impl(duk_context *ctx)
{
    f_fread_dir_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    args->dir = fdopendir(args->fd);
    if (!args->dir)
    {
        ejs_throw_os_errno(ctx);
    }
    _read_dir_names_impl(ctx, args->dir, args->n);
    closedir(args->dir);
    args->dir = 0;
    return 1;
}

static void f_fread_dir_names_async_impl(void *userdata)
{
    f_fread_dir_async_args_t *args = userdata;
    DIR *dir = fdopendir(args->fd);
    if (!dir)
    {
        args->result.err = errno;
        return;
    }
    args->result.err = _read_dir_names_async_impl(dir, args->n, &args->result.buffer);
    closedir(dir);
    if (args->result.err)
    {
        ppp_buffer_destroy(&args->result.buffer);
    }
}

static duk_ret_t f_fread_dir_names(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "fd", 2);
    int fd = DUK_REQUIRE_FD(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "n", 1);
    int n = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_int(ctx, -1);
    duk_pop(ctx);
    if (duk_is_undefined(ctx, 1))
    {
        f_fread_dir_args_t args = {
            .fd = fd,
            .n = n,
            .dir = 0,
        };
        if (ejs_pcall_function(ctx, f_fread_dir_names_impl, &args))
        {
            if (args.dir)
            {
                closedir(args.dir);
            }
            duk_throw(ctx);
        }
        return 1;
    }
    f_fread_dir_async_args_t *p = EJS_ASYNC_PUSH_RETURN_BUFFER(ctx, sizeof(f_fread_dir_async_args_t));
    ppp_buffer_init(&p->result.buffer);
    p->fd = fd;
    p->n = n;
    _ejs_async_post_or_send(ctx, f_fread_dir_names_async_impl, _read_dir_return_names);
    return 0;
}

typedef struct
{
    const char *name;
    int n;
    DIR *dir;
} f_read_dir_args_t;
typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_BUFFER;

    const char *name;
    int n;
} f_read_dir_async_args_t;

static duk_ret_t f_read_dir_names_impl(duk_context *ctx)
{
    f_read_dir_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    args->dir = opendir(args->name);
    if (!args->dir)
    {
        ejs_throw_os_errno(ctx);
    }
    _read_dir_names_impl(ctx, args->dir, args->n);
    closedir(args->dir);
    args->dir = 0;
    return 1;
}

static void f_read_dir_names_async_impl(void *userdata)
{
    f_read_dir_async_args_t *args = userdata;
    DIR *dir = opendir(args->name);
    if (!dir)
    {
        args->result.err = errno;
        return;
    }
    args->result.err = _read_dir_names_async_impl(dir, args->n, &args->result.buffer);
    closedir(dir);
    if (args->result.err)
    {
        ppp_buffer_destroy(&args->result.buffer);
    }
}

static duk_ret_t f_read_dir_names(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "n", 1);
    int n = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_int(ctx, -1);
    duk_pop(ctx);
    if (duk_is_undefined(ctx, 1))
    {
        f_read_dir_args_t args = {
            .name = name,
            .n = n,
            .dir = 0,
        };
        if (ejs_pcall_function(ctx, f_read_dir_names_impl, &args))
        {
            if (args.dir)
            {
                closedir(args.dir);
            }
            duk_throw(ctx);
        }
        return 1;
    }
    f_read_dir_async_args_t *p = EJS_ASYNC_PUSH_RETURN_BUFFER(ctx, sizeof(f_read_dir_async_args_t));
    ppp_buffer_init(&p->result.buffer);
    p->name = name;
    p->n = n;
    _ejs_async_post_or_send(ctx, f_read_dir_names_async_impl, _read_dir_return_names);
    return 0;
}

static duk_ret_t f_read_dir_impl(duk_context *ctx)
{
    f_read_dir_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    args->dir = opendir(args->name);
    if (!args->dir)
    {
        ejs_throw_os_errno(ctx);
    }
    int fd = dirfd(args->dir);
    if (EJS_IS_INVALID_FD(fd))
    {
        ejs_throw_os_errno(ctx);
    }
    _read_dir_impl(ctx, args->dir, fd, args->n);
    closedir(args->dir);
    args->dir = 0;
    return 1;
}

static void f_read_dir_async_impl(void *userdata)
{
    f_read_dir_async_args_t *args = userdata;
    DIR *dir = opendir(args->name);
    if (!dir)
    {
        args->result.err = errno;
        return;
    }
    int fd = dirfd(dir);
    if (EJS_IS_INVALID_FD(fd))
    {
        args->result.err = errno;
        closedir(dir);
        return;
    }

    args->result.err = _read_dir_async_impl(dir, fd, args->n, &args->result.buffer);
    closedir(dir);
    if (args->result.err)
    {
        ppp_buffer_destroy(&args->result.buffer);
    }
}

static duk_ret_t f_read_dir(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "n", 1);
    int n = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_int(ctx, -1);
    duk_pop(ctx);
    if (duk_is_undefined(ctx, 1))
    {
        f_read_dir_args_t args = {
            .name = name,
            .n = n,
            .dir = 0,
        };
        if (ejs_pcall_function(ctx, f_read_dir_impl, &args))
        {
            if (args.dir)
            {
                closedir(args.dir);
            }
            duk_throw(ctx);
        }
        return 1;
    }
    f_read_dir_async_args_t *p = EJS_ASYNC_PUSH_RETURN_BUFFER(ctx, sizeof(f_read_dir_async_args_t));
    ppp_buffer_init(&p->result.buffer);
    p->name = name;
    p->n = n;
    _ejs_async_post_or_send(ctx, f_read_dir_async_impl, f_read_dir_return_dirs);
    return 0;
}
typedef struct
{
    int err;
    char path[PATH_MAX];
    ssize_t n;
    const char *name;
} f_read_link_async_args_t;
static void f_read_link_impl(void *userdata)
{
    f_read_link_async_args_t *args = userdata;
    args->n = readlink(args->name, args->path, PATH_MAX);
    args->err = EJS_SYSTEM_ERROR(args->n) ? errno : 0;
}
static duk_ret_t f_read_link_return(duk_context *ctx)
{
    f_read_link_async_args_t *args = _ejs_async_return(ctx);
    if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else
    {
        duk_push_lstring(ctx, args->path, args->n);
        duk_call(ctx, 1);
    }
    return 0;
}
static duk_ret_t f_read_link(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        char path[PATH_MAX];
        ssize_t n = readlink(name, path, PATH_MAX);
        if (EJS_SYSTEM_ERROR(n))
        {
            ejs_throw_os_errno(ctx);
        }
        duk_pop_2(ctx);
        duk_push_lstring(ctx, path, n);
        return 1;
    }

    f_read_link_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_read_link_async_args_t), ejs_default_finalizer);
    p->name = name;

    _ejs_async_post_or_send(ctx, f_read_link_impl, f_read_link_return);
    return 0;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID;
    const char *from;
    const char *to;
} f_rename_async_args_t;
static void f_rename_impl(void *userdata)
{
    f_rename_async_args_t *args = userdata;
    args->result.err = rename(args->from, args->to) ? errno : 0;
}
static duk_ret_t f_rename(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "from", 4);
    const char *from = duk_require_string(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "to", 2);
    const char *to = duk_require_string(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (rename(from, to))
        {
            ejs_throw_os_errno(ctx);
        }
        return 0;
    }

    f_rename_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_rename_async_args_t), ejs_default_finalizer);
    p->from = from;
    p->to = to;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_rename_impl);
    return 0;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID;
    const char *from;
    const char *to;
    duk_bool_t hard;
} f_link_async_args_t;
static void f_link_impl(void *userdata)
{
    f_link_async_args_t *args = userdata;
    if (args->hard)
    {
        args->result.err = link(args->from, args->to) ? errno : 0;
    }
    else
    {
        args->result.err = symlink(args->from, args->to) ? errno : 0;
    }
}
static duk_ret_t f_link(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "from", 4);
    const char *from = duk_require_string(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "to", 2);
    const char *to = duk_require_string(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "hard", 4);
    duk_bool_t hard = EJS_BOOL_VALUE(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (hard)
        {
            if (link(from, to))
            {
                ejs_throw_os_errno(ctx);
            }
        }
        else
        {
            if (symlink(from, to))
            {
                ejs_throw_os_errno(ctx);
            }
        }
        return 0;
    }

    f_link_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_link_async_args_t), ejs_default_finalizer);
    p->from = from;
    p->to = to;
    p->hard = hard;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_link_impl);
    return 0;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID;
    const char *name;
    size_t len;
    duk_bool_t all;
} f_remove_async_args_t;

static void f_remove_impl(void *userdata)
{
    f_remove_async_args_t *args = userdata;
    if (args->all)
    {
        ppp_c_string_t path = {
            .cap = 0,
            .len = args->len,
            .str = (char *)args->name,
        };
        args->result.err = ppp_c_filepath_remove_all(&path) ? errno : 0;
    }
    else
    {
        args->result.err = remove(args->name) ? errno : 0;
    }
}
static duk_ret_t f_remove(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    duk_size_t len;
    const char *name = duk_require_lstring(ctx, -1, &len);
    if (len == 0)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "name must be not empty");
        duk_throw(ctx);
    }
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "all", 3);
    duk_bool_t all = EJS_BOOL_VALUE(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (all)
        {
            ppp_c_string_t path = {
                .cap = 0,
                .len = len,
                .str = (char *)name,
            };
            if (ppp_c_filepath_remove_all(&path))
            {
                ejs_throw_os_errno(ctx);
            }
        }
        else
        {
            if (remove(name))
            {
                ejs_throw_os_errno(ctx);
            }
        }
        return 0;
    }

    f_remove_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_remove_async_args_t), ejs_default_finalizer);
    p->name = name;
    p->len = len;
    p->all = all;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_remove_impl);
    return 0;
}

static void f_rmdir_impl(void *userdata)
{
    f_remove_async_args_t *args = userdata;
    if (args->all)
    {
        ppp_c_string_t path = {
            .cap = 0,
            .len = args->len,
            .str = (char *)args->name,
        };
        args->result.err = ppp_c_filepath_rmdir_all(&path) ? errno : 0;
    }
    else
    {
        args->result.err = rmdir(args->name) ? errno : 0;
    }
}
static duk_ret_t f_rmdir(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    duk_size_t len;
    const char *name = duk_require_lstring(ctx, -1, &len);
    if (len == 0)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "name must be not empty");
        duk_throw(ctx);
    }
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "all", 3);
    duk_bool_t all = EJS_BOOL_VALUE(ctx, -1);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (all)
        {
            ppp_c_string_t path = {
                .cap = 0,
                .len = len,
                .str = (char *)name,
            };
            if (ppp_c_filepath_rmdir_all(&path))
            {
                ejs_throw_os_errno(ctx);
            }
        }
        else
        {
            if (rmdir(name))
            {
                ejs_throw_os_errno(ctx);
            }
        }
        return 0;
    }

    f_remove_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_remove_async_args_t), ejs_default_finalizer);
    p->name = name;
    p->len = len;
    p->all = all;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_rmdir_impl);
    return 0;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_VOID;
    const char *name;
    size_t len;
    duk_bool_t all;
    int perm;
} f_mkdir_async_args_t;
static void f_mkdir_impl(void *userdata)
{
    f_mkdir_async_args_t *args = userdata;
    if (args->all)
    {
        ppp_c_string_t path = {
            .cap = 0,
            .len = args->len,
            .str = (char *)args->name,
        };
        args->result.err = ppp_c_filepath_mkdir_all(&path, args->perm) ? errno : 0;
    }
    else
    {
        args->result.err = mkdir(args->name, args->perm) ? errno : 0;
    }
}
static duk_ret_t f_mkdir(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "name", 4);
    duk_size_t len;
    const char *name = duk_require_lstring(ctx, -1, &len);
    if (len == 0)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "name must be not empty");
        duk_throw(ctx);
    }
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "all", 3);
    duk_bool_t all = EJS_BOOL_VALUE(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "perm", 3);
    int perm = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, -1, 0775);
    duk_pop(ctx);

    if (duk_is_undefined(ctx, 1))
    {
        if (all)
        {
            ppp_c_string_t path = {
                .cap = 0,
                .len = len,
                .str = (char *)name,
            };
            if (ppp_c_filepath_mkdir_all(&path, perm))
            {
                ejs_throw_os_errno(ctx);
            }
        }
        else
        {
            if (mkdir(name, perm))
            {
                ejs_throw_os_errno(ctx);
            }
        }
        return 0;
    }

    f_mkdir_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_mkdir_async_args_t), ejs_default_finalizer);
    p->name = name;
    p->len = len;
    p->all = all;
    p->perm = perm;

    EJS_ASYNC_POST_OR_SEND_VOID(ctx, f_mkdir_impl);
    return 0;
}

typedef struct
{
    ppp_c_filepath_create_temp_options_t *opts;
    int fd;
    char *name;
} f_createTemp_args_t;

static duk_ret_t f_createTemp_impl(duk_context *ctx)
{
    f_createTemp_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    if (!args->opts->dir)
    {
        args->opts->dir = _ejs_os_temp_dir(&args->opts->dir_len);
        if (!args->opts->dir_len)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "unknow temp dir");
            duk_throw(ctx);
        }
    }

    _ejs_srand(0);
    ppp_c_filepath_create_temp_result_t result;
    if (!ppp_c_filepath_create_temp(args->opts, &result))
    {
        if (result.err)
        {
            ejs_throw_os(ctx, result.err, 0);
        }
        else
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "pattern contains path separator");
            duk_throw(ctx);
        }
    }
    args->fd = result.fd;
    args->name = result.name.str;
    f_push_file_object(ctx, result.fd, result.name.str, result.name.len);
    free(args->name);
    args->name = 0;
    return 1;
}
typedef struct
{
    ppp_c_filepath_create_temp_options_t opts;
    int err;
    int fd;
    char *name;
    size_t name_len;
} f_createTemp_async_args_t;
static void f_createTemp_async_impl(void *userdata)
{
    f_createTemp_async_args_t *args = userdata;
    if (!args->opts.dir)
    {
        args->opts.dir = _ejs_os_temp_dir(&args->opts.dir_len);
        if (!args->opts.dir_len)
        {
            return;
        }
    }

    _ejs_srand(0);
    ppp_c_filepath_create_temp_result_t result;
    if (ppp_c_filepath_create_temp(&args->opts, &result))
    {
        args->fd = result.fd;
        args->name = result.name.str;
        args->name_len = result.name.len;
    }
    else
    {
        args->err = result.err;
    }
}
static duk_ret_t f_createTemp_async_return(duk_context *ctx)
{
    f_createTemp_async_args_t *args = _ejs_async_return(ctx);
    if (!args->opts.dir)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "unknow temp dir");
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else if (args->name)
    {
        f_push_file_object(ctx, args->fd, args->name, args->name_len);
        free(args->name);
        duk_call(ctx, 1);
    }
    else if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "pattern contains path separator");
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    return 0;
}
static duk_ret_t f_createTemp(duk_context *ctx)
{
    ppp_c_filepath_create_temp_options_t opts = {0};
    duk_get_prop_lstring(ctx, 0, "pattern", 7);
    opts.pattern = duk_require_lstring(ctx, -1, &opts.pattern_len);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "dir", 3);
    if (duk_is_null_or_undefined(ctx, -1))
    {
        opts.dir = 0;
        opts.dir_len = 0;
    }
    else
    {
        opts.dir = duk_require_lstring(ctx, -1, &opts.dir_len);
    }
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "perm", 3);
    opts.perm = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, -1, 0600);
    duk_pop(ctx);
    if (duk_is_undefined(ctx, 1))
    {
        f_createTemp_args_t args = {
            .opts = &opts,
            .fd = EJS_INVALID_FD,
            .name = 0,
        };
        if (ejs_pcall_function(ctx, f_createTemp_impl, &args))
        {
            if (EJS_IS_VALID_FD(args.fd))
            {
                close(args.fd);
                if (args.name)
                {
                    free(args.name);
                }
            }
            duk_throw(ctx);
        }
        return 1;
    }
    f_createTemp_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_createTemp_async_args_t), ejs_default_finalizer);
    p->opts = opts;

    _ejs_async_post_or_send(ctx, f_createTemp_async_impl, f_createTemp_async_return);
    return 0;
}

typedef struct
{
    ppp_c_filepath_create_temp_options_t *opts;
    char *name;
} f_mkdirTemp_args_t;

static duk_ret_t f_mkdirTemp_impl(duk_context *ctx)
{
    f_mkdirTemp_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    if (!args->opts->dir)
    {
        args->opts->dir = _ejs_os_temp_dir(&args->opts->dir_len);
        if (!args->opts->dir_len)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "unknow temp dir");
            duk_throw(ctx);
        }
    }

    _ejs_srand(0);
    ppp_c_filepath_mkdir_temp_result_t result;
    if (!ppp_c_filepath_mkdir_temp(args->opts, &result))
    {
        if (result.err)
        {
            ejs_throw_os(ctx, result.err, 0);
        }
        else
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "pattern contains path separator");
            duk_throw(ctx);
        }
    }
    args->name = result.name.str;
    duk_push_lstring(ctx, result.name.str, result.name.len);
    free(args->name);
    args->name = 0;
    return 1;
}
typedef struct
{
    ppp_c_filepath_create_temp_options_t opts;
    int err;
    char *name;
    size_t name_len;
} f_mkdirTemp_async_args_t;
static void f_mkdirTemp_async_impl(void *userdata)
{
    f_mkdirTemp_async_args_t *args = userdata;
    if (!args->opts.dir)
    {
        args->opts.dir = _ejs_os_temp_dir(&args->opts.dir_len);
        if (!args->opts.dir_len)
        {
            return;
        }
    }

    _ejs_srand(0);
    ppp_c_filepath_mkdir_temp_result_t result;
    if (ppp_c_filepath_mkdir_temp(&args->opts, &result))
    {
        args->name = result.name.str;
        args->name_len = result.name.len;
    }
    else
    {
        args->err = result.err;
    }
}
static duk_ret_t f_mkdirTemp_async_return(duk_context *ctx)
{
    f_mkdirTemp_async_args_t *args = _ejs_async_return(ctx);
    if (!args->opts.dir)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "unknow temp dir");
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else if (args->name)
    {
        duk_push_lstring(ctx, args->name, args->name_len);
        free(args->name);
        duk_call(ctx, 1);
    }
    else if (args->err)
    {
        ejs_new_os_error(ctx, args->err, 0);
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    else
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "pattern contains path separator");
        duk_push_undefined(ctx);
        duk_swap_top(ctx, -2);
        duk_call(ctx, 2);
    }
    return 0;
}
static duk_ret_t f_mkdirTemp(duk_context *ctx)
{
    ppp_c_filepath_create_temp_options_t opts = {0};
    duk_get_prop_lstring(ctx, 0, "pattern", 7);
    opts.pattern = duk_require_lstring(ctx, -1, &opts.pattern_len);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "dir", 3);
    if (duk_is_null_or_undefined(ctx, -1))
    {
        opts.dir = 0;
        opts.dir_len = 0;
    }
    else
    {
        opts.dir = duk_require_lstring(ctx, -1, &opts.dir_len);
    }
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "perm", 3);
    opts.perm = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, -1, 0700);
    duk_pop(ctx);
    if (duk_is_undefined(ctx, 1))
    {
        f_mkdirTemp_args_t args = {
            .opts = &opts,
            .name = 0,
        };
        if (ejs_pcall_function(ctx, f_mkdirTemp_impl, &args))
        {
            if (args.name)
            {
                free(args.name);
            }
            duk_throw(ctx);
        }
        return 1;
    }
    f_mkdirTemp_async_args_t *p = ejs_push_finalizer_object(ctx, sizeof(f_mkdirTemp_async_args_t), ejs_default_finalizer);
    p->opts = opts;

    _ejs_async_post_or_send(ctx, f_mkdirTemp_async_impl, f_mkdirTemp_async_return);
    return 0;
}

static duk_ret_t _tempDir(duk_context *ctx)
{
    size_t len;
    const char *dir = _ejs_os_temp_dir(&len);
    if (len)
    {
        duk_push_lstring(ctx, dir, len);
        return 1;
    }
    return 0;
}
static duk_ret_t _userHomeDir(duk_context *ctx)
{
    size_t len;
    const char *os = _ejs_os_get_define(EJS_CONFIG_OS, &len);
    const char *key = "HOME";
    switch (len)
    {
    case 7:
        if (!memcmp(os, "windows", 7))
        {
            key = "USERPROFILE";
        }
        break;
    case 5:
        if (!memcmp(os, "plan9", 5))
        {
            key = "home";
        }
        break;
    }
    const char *val = getenv(key);
    if (val)
    {
        len = strlen(val);
        if (len)
        {
            duk_push_lstring(ctx, val, len);
            return 1;
        }
    }
    switch (len)
    {
    case 7:
        if (!memcmp(os, "android", 7))
        {
            duk_push_lstring(ctx, "/sdcard", 7);
            return 1;
        }
        break;
    case 3:
        if (!memcmp(os, "ios", 3))
        {
            duk_push_lstring(ctx, "/", 1);
            return 1;
        }
        break;
    }
    return 0;
}
static duk_ret_t _userConfigDir(duk_context *ctx)
{
    size_t len;
    const char *os = _ejs_os_get_define(EJS_CONFIG_OS, &len);
    switch (len)
    {
    case 7:
        if (!memcmp(os, "windows", 7))
        {
            char *dir = getenv("AppData");
            if (dir)
            {
                len = strlen(dir);
                if (len)
                {
                    duk_push_lstring(ctx, dir, len);
                    return 1;
                }
            }
        }
        break;
    case 6:
        if (!memcmp(os, "darwin", 6))
        {
            char *dir = getenv("HOME");
            if (dir)
            {
                len = strlen(dir);
                if (len)
                {
                    duk_push_lstring(ctx, dir, len);
                    duk_push_lstring(ctx, "/Library/Application Support", 28);
                    duk_concat(ctx, 2);
                    return 1;
                }
            }
        }
        break;
    case 3:
        if (!memcmp(os, "ios", 3))
        {
            char *dir = getenv("HOME");
            if (dir)
            {
                len = strlen(dir);
                if (len)
                {
                    duk_push_lstring(ctx, dir, len);
                    duk_push_lstring(ctx, "/Library/Application Support", 28);
                    duk_concat(ctx, 2);
                    return 1;
                }
            }
        }
        break;
    case 5:
        if (!memcmp(os, "plan9", 5))
        {
            char *dir = getenv("home");
            if (dir)
            {
                len = strlen(dir);
                if (len)
                {
                    duk_push_lstring(ctx, dir, len);
                    duk_push_lstring(ctx, "/lib", 4);
                    duk_concat(ctx, 2);
                    return 1;
                }
            }
        }
        break;
    default:
    {

        char *dir = getenv("XDG_CONFIG_HOME");
        if (dir)
        {
            len = strlen(dir);
            if (len)
            {
                duk_push_lstring(ctx, dir, len);
                return 1;
            }
        }
        dir = getenv("HOME");
        if (dir)
        {
            len = strlen(dir);
            if (len)
            {
                duk_push_lstring(ctx, dir, len);
                duk_push_lstring(ctx, "/.config", 8);
                duk_concat(ctx, 2);
                return 1;
            }
        }
    }
    break;
    }
    return 0;
}
static duk_ret_t _userCacheDir(duk_context *ctx)
{
    size_t len;
    const char *os = _ejs_os_get_define(EJS_CONFIG_OS, &len);
    switch (len)
    {
    case 7:
        if (!memcmp(os, "windows", 7))
        {
            char *dir = getenv("LocalAppData");
            if (dir)
            {
                len = strlen(dir);
                if (len)
                {
                    duk_push_lstring(ctx, dir, len);
                    return 1;
                }
            }
        }
        break;
    case 6:
        if (!memcmp(os, "darwin", 6))
        {
            char *dir = getenv("HOME");
            if (dir)
            {
                len = strlen(dir);
                if (len)
                {
                    duk_push_lstring(ctx, dir, len);
                    duk_push_lstring(ctx, "/Library/Caches", 15);
                    duk_concat(ctx, 2);
                    return 1;
                }
            }
        }
        break;
    case 3:
        if (!memcmp(os, "ios", 3))
        {
            char *dir = getenv("HOME");
            if (dir)
            {
                len = strlen(dir);
                if (len)
                {
                    duk_push_lstring(ctx, dir, len);
                    duk_push_lstring(ctx, "/Library/Caches", 15);
                    duk_concat(ctx, 2);
                    return 1;
                }
            }
        }
        break;
    case 5:
        if (!memcmp(os, "plan9", 5))
        {
            char *dir = getenv("home");
            if (dir)
            {
                len = strlen(dir);
                if (len)
                {
                    duk_push_lstring(ctx, dir, len);
                    duk_push_lstring(ctx, "/lib/cache", 10);
                    duk_concat(ctx, 2);
                    return 1;
                }
            }
        }
        break;
    default:
    {

        char *dir = getenv("XDG_CACHE_HOME");
        if (dir)
        {
            len = strlen(dir);
            if (len)
            {
                duk_push_lstring(ctx, dir, len);
                return 1;
            }
        }
        dir = getenv("HOME");
        if (dir)
        {
            len = strlen(dir);
            if (len)
            {
                duk_push_lstring(ctx, dir, len);
                duk_push_lstring(ctx, "/.cache", 7);
                duk_concat(ctx, 2);
                return 1;
            }
        }
    }
    break;
    }
    return 0;
}

static duk_ret_t _getuid(duk_context *ctx)
{
#ifdef EJS_OS_LINUX
    duk_push_number(ctx, getuid());
#else
    duk_push_int(ctx, -1);
#endif
    return 1;
}
static duk_ret_t _geteuid(duk_context *ctx)
{
#ifdef EJS_OS_LINUX
    duk_push_number(ctx, geteuid());
#else
    duk_push_int(ctx, -1);
#endif
    return 1;
}
static duk_ret_t _getgid(duk_context *ctx)
{
#ifdef EJS_OS_LINUX
    duk_push_number(ctx, getgid());
#else
    duk_push_int(ctx, -1);
#endif
    return 1;
}
static duk_ret_t _getegid(duk_context *ctx)
{
#ifdef EJS_OS_LINUX
    duk_push_number(ctx, getegid());
#else
    duk_push_int(ctx, -1);
#endif
    return 1;
}
#ifdef EJS_OS_LINUX
typedef struct
{
    int n;
    gid_t *list;
} _getgroups_args_t;
static duk_ret_t _getgroups_impl(duk_context *ctx)
{
    _getgroups_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    args->list = malloc(sizeof(gid_t) * args->n);
    if (!args->list)
    {
        ejs_throw_os_errno(ctx);
    }

    int n = getgroups(args->n, args->list);
    if (n < 0)
    {
        ejs_throw_os_errno(ctx);
    }
    duk_push_array(ctx);
    for (int i = 0; i < n; i++)
    {
        duk_push_number(ctx, args->list[i]);
        duk_put_prop_index(ctx, -2, i);
    }
    free(args->list);
    args->list = 0;
    return 1;
}
#endif
static duk_ret_t _getgroups(duk_context *ctx)
{
#ifdef EJS_OS_LINUX
    int n = getgroups(0, 0);
    if (EJS_SYSTEM_ERROR(n))
    {
        ejs_throw_os_errno(ctx);
    }
    if (n > 32)
    {
        _getgroups_args_t args = {
            .list = 0,
            .n = n,
        };
        if (ejs_pcall_function(ctx, _getgroups_impl, &args))
        {
            if (args.list)
            {
                free(args.list);
            }
            duk_throw(ctx);
        }
    }
    else if (n > 0)
    {
        gid_t list[32] = {0};
        n = getgroups(32, list);
        if (EJS_SYSTEM_ERROR(n))
        {
            ejs_throw_os_errno(ctx);
        }

        duk_push_array(ctx);
        for (int i = 0; i < n; i++)
        {
            duk_push_number(ctx, list[i]);
            duk_put_prop_index(ctx, -2, i);
        }
    }
#else
    duk_push_array(ctx);
#endif
    return 1;
}
extern char **environ;
static duk_ret_t _environ(duk_context *ctx)
{
    duk_push_array(ctx);
    if (environ)
    {
        char **s = environ;
        duk_uarridx_t i = 0;
        while (*s)
        {
            duk_push_string(ctx, *s);
            duk_put_prop_index(ctx, -2, i++);
            s++;
        }
    }
    return 1;
}
static duk_ret_t _clearenv(duk_context *ctx)
{
    if (clearenv())
    {
        ejs_throw_os_errno(ctx);
    }
    return 0;
}
static duk_ret_t _setenv(duk_context *ctx)
{
    const char *key = duk_require_string(ctx, 0);
    const char *value = duk_require_string(ctx, 1);
    int replace = EJS_BOOL_VALUE_DEFAULT(ctx, 2, 1);
    if (setenv(key, value, replace))
    {
        ejs_throw_os_errno(ctx);
    }
    return 0;
}
static duk_ret_t _unsetenv(duk_context *ctx)
{
    const char *key = duk_require_string(ctx, 0);
    if (unsetenv(key))
    {
        ejs_throw_os_errno(ctx);
    }
    return 0;
}
static duk_ret_t _getenv(duk_context *ctx)
{
    const char *key = duk_require_string(ctx, 0);
    const char *s = getenv(key);
    if (s)
    {
        duk_pop(ctx);
        duk_push_string(ctx, s);
        return 1;
    }
    return 0;
}

EJS_SHARED_MODULE__DECLARE(os)
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
        duk_push_c_lightfunc(ctx, f_create, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "create", 6);
        duk_push_c_lightfunc(ctx, f_fstat, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "fstat", 5);
        duk_push_c_lightfunc(ctx, f_close, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "close", 5);

        duk_push_c_lightfunc(ctx, f_stat, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "stat", 4);

        duk_push_c_lightfunc(ctx, fileinfo_name, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "fileinfo_name", 13);

        duk_push_c_lightfunc(ctx, f_seek, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "seek", 4);

        duk_push_c_lightfunc(ctx, f_isBufferData, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "isBufferData", 12);

        duk_push_c_lightfunc(ctx, f_read_args, 0, 0, 0);
        duk_put_prop_lstring(ctx, -2, "read_args", 9);
        duk_push_c_lightfunc(ctx, f_read, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "read", 4);

        duk_push_c_lightfunc(ctx, f_readAt_args, 0, 0, 0);
        duk_put_prop_lstring(ctx, -2, "readAt_args", 11);
        duk_push_c_lightfunc(ctx, f_readAt, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "readAt", 6);

        duk_push_c_lightfunc(ctx, f_write_args, 0, 0, 0);
        duk_put_prop_lstring(ctx, -2, "write_args", 10);
        duk_push_c_lightfunc(ctx, f_write, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "write", 5);

        duk_push_c_lightfunc(ctx, f_writeAt_args, 0, 0, 0);
        duk_put_prop_lstring(ctx, -2, "writeAt_args", 12);
        duk_push_c_lightfunc(ctx, f_writeAt, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "writeAt", 7);

        duk_push_c_lightfunc(ctx, f_fsync, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "fsync", 5);

        duk_push_c_lightfunc(ctx, f_fchdir, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "fchdir", 6);

        duk_push_c_lightfunc(ctx, f_fchmod, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "fchmod", 6);
        duk_push_c_lightfunc(ctx, f_fchown, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "fchown", 6);
        duk_push_c_lightfunc(ctx, f_ftruncate, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "ftruncate", 9);

        duk_push_c_lightfunc(ctx, f_chmod, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "chmod", 5);
        duk_push_c_lightfunc(ctx, f_chown, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "chown", 5);
        duk_push_c_lightfunc(ctx, f_truncate, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "truncate", 8);

        duk_push_c_lightfunc(ctx, read_file, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "read_file", 9);
        duk_push_c_lightfunc(ctx, read_text_file, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "read_text_file", 14);

        duk_push_c_lightfunc(ctx, f_writeFile, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "writeFile", 9);

        duk_push_c_lightfunc(ctx, f_fread_dir_names, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "fread_dir_names", 15);
        duk_push_c_lightfunc(ctx, f_fread_dir, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "fread_dir", 9);

        duk_push_c_lightfunc(ctx, f_read_dir_names, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "read_dir_names", 14);
        duk_push_c_lightfunc(ctx, f_read_dir, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "read_dir", 8);

        duk_push_c_lightfunc(ctx, f_read_link, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "read_link", 9);
        duk_push_c_lightfunc(ctx, f_rename, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "rename", 6);
        duk_push_c_lightfunc(ctx, f_link, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "link", 4);

        duk_push_c_lightfunc(ctx, f_remove, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "remove", 6);
        duk_push_c_lightfunc(ctx, f_rmdir, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "rmdir", 5);
        duk_push_c_lightfunc(ctx, f_mkdir, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "mkdir", 5);

        duk_push_c_lightfunc(ctx, f_createTemp, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "createTemp", 10);
        duk_push_c_lightfunc(ctx, f_mkdirTemp, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "mkdirTemp", 9);

        duk_push_c_lightfunc(ctx, _chdir, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "chdir", 5);
    }
    // getenv
    // setenv

    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);

    duk_push_c_lightfunc(ctx, _cwd, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "cwd", 3);

    duk_push_c_lightfunc(ctx, _tempDir, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "tempDir", 7);
    duk_push_c_lightfunc(ctx, _userHomeDir, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "userHomeDir", 11);
    duk_push_c_lightfunc(ctx, _userConfigDir, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "userConfigDir", 13);
    duk_push_c_lightfunc(ctx, _userCacheDir, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "userCacheDir", 13);

    duk_push_c_lightfunc(ctx, _getuid, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "getuid", 6);
    duk_push_c_lightfunc(ctx, _geteuid, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "geteuid", 7);
    duk_push_c_lightfunc(ctx, _getgid, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "getgid", 6);
    duk_push_c_lightfunc(ctx, _getegid, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "getegid", 7);
    duk_push_c_lightfunc(ctx, _getgroups, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "getgroups", 9);

    duk_push_c_lightfunc(ctx, _environ, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "environ", 7);
    duk_push_c_lightfunc(ctx, _clearenv, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "clearenv", 8);
    duk_push_c_lightfunc(ctx, _setenv, 3, 3, 0);
    duk_put_prop_lstring(ctx, -2, "setenv", 6);
    duk_push_c_lightfunc(ctx, _unsetenv, 1, 1, 0);
    duk_put_prop_lstring(ctx, -2, "unsetenv", 8);
    duk_push_c_lightfunc(ctx, _getenv, 1, 1, 0);
    duk_put_prop_lstring(ctx, -2, "getenv", 6);

    // open
    _ejs_define_os_uint(ctx, O_RDONLY);
    _ejs_define_os_uint(ctx, O_WRONLY);
    _ejs_define_os_uint(ctx, O_RDWR);

    _ejs_define_os_uint(ctx, O_APPEND);
    _ejs_define_os_uint_impl(ctx, "O_CREATE", O_CREAT);
    _ejs_define_os_uint(ctx, O_EXCL);
    _ejs_define_os_uint(ctx, O_SYNC);
    _ejs_define_os_uint(ctx, O_TRUNC);

    // seek
    _ejs_define_os_uint(ctx, SEEK_CUR);
    _ejs_define_os_uint(ctx, SEEK_END);
    _ejs_define_os_uint(ctx, SEEK_SET);

    // errno [1,34]
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

    // errno [35,133]
    _ejs_define_os_uint(ctx, EDEADLK);
    _ejs_define_os_uint(ctx, ENAMETOOLONG);
    _ejs_define_os_uint(ctx, ENOLCK);
    _ejs_define_os_uint(ctx, ENOSYS);

    _ejs_define_os_uint(ctx, ENOTEMPTY);
    _ejs_define_os_uint(ctx, ELOOP);
    // _ejs_define_os_uint(ctx, EWOULDBLOCK);
    _ejs_define_os_uint(ctx, ENOMSG);
    _ejs_define_os_uint(ctx, EIDRM);
    _ejs_define_os_uint(ctx, ECHRNG);
    _ejs_define_os_uint(ctx, EL2NSYNC);
    _ejs_define_os_uint(ctx, EL3HLT);
    _ejs_define_os_uint(ctx, EL3RST);
    _ejs_define_os_uint(ctx, ELNRNG);
    _ejs_define_os_uint(ctx, EUNATCH);
    _ejs_define_os_uint(ctx, ENOCSI);
    _ejs_define_os_uint(ctx, EL2HLT);
    _ejs_define_os_uint(ctx, EBADE);
    _ejs_define_os_uint(ctx, EBADR);
    _ejs_define_os_uint(ctx, EXFULL);
    _ejs_define_os_uint(ctx, ENOANO);
    _ejs_define_os_uint(ctx, EBADRQC);
    _ejs_define_os_uint(ctx, EBADSLT);
    _ejs_define_os_uint(ctx, EDEADLOCK);

    _ejs_define_os_uint(ctx, EBFONT);
    _ejs_define_os_uint(ctx, ENOSTR);
    _ejs_define_os_uint(ctx, ENODATA);
    _ejs_define_os_uint(ctx, ETIME);
    _ejs_define_os_uint(ctx, ENOSR);
    _ejs_define_os_uint(ctx, ENONET);
    _ejs_define_os_uint(ctx, ENOPKG);
    _ejs_define_os_uint(ctx, EREMOTE);
    _ejs_define_os_uint(ctx, ENOLINK);
    _ejs_define_os_uint(ctx, EADV);
    _ejs_define_os_uint(ctx, ESRMNT);
    _ejs_define_os_uint(ctx, ECOMM);
    _ejs_define_os_uint(ctx, EPROTO);
    _ejs_define_os_uint(ctx, EMULTIHOP);
    _ejs_define_os_uint(ctx, EDOTDOT);
    _ejs_define_os_uint(ctx, EBADMSG);
    _ejs_define_os_uint(ctx, EOVERFLOW);
    _ejs_define_os_uint(ctx, ENOTUNIQ);
    _ejs_define_os_uint(ctx, EBADFD);
    _ejs_define_os_uint(ctx, EREMCHG);
    _ejs_define_os_uint(ctx, ELIBACC);
    _ejs_define_os_uint(ctx, ELIBBAD);
    _ejs_define_os_uint(ctx, ELIBSCN);
    _ejs_define_os_uint(ctx, ELIBMAX);
    _ejs_define_os_uint(ctx, ELIBEXEC);
    _ejs_define_os_uint(ctx, EILSEQ);
    _ejs_define_os_uint(ctx, ERESTART);
    _ejs_define_os_uint(ctx, ESTRPIPE);
    _ejs_define_os_uint(ctx, EUSERS);
    _ejs_define_os_uint(ctx, ENOTSOCK);
    _ejs_define_os_uint(ctx, EDESTADDRREQ);
    _ejs_define_os_uint(ctx, EMSGSIZE);
    _ejs_define_os_uint(ctx, EPROTOTYPE);
    _ejs_define_os_uint(ctx, ENOPROTOOPT);
    _ejs_define_os_uint(ctx, EPROTONOSUPPORT);
    _ejs_define_os_uint(ctx, ESOCKTNOSUPPORT);
    _ejs_define_os_uint(ctx, EOPNOTSUPP);
    _ejs_define_os_uint(ctx, EPFNOSUPPORT);
    _ejs_define_os_uint(ctx, EAFNOSUPPORT);
    _ejs_define_os_uint(ctx, EADDRINUSE);
    _ejs_define_os_uint(ctx, EADDRNOTAVAIL);
    _ejs_define_os_uint(ctx, ENETDOWN);
    _ejs_define_os_uint(ctx, ENETUNREACH);
    _ejs_define_os_uint(ctx, ENETRESET);
    _ejs_define_os_uint(ctx, ECONNABORTED);
    _ejs_define_os_uint(ctx, ECONNRESET);
    _ejs_define_os_uint(ctx, ENOBUFS);
    _ejs_define_os_uint(ctx, EISCONN);
    _ejs_define_os_uint(ctx, ENOTCONN);
    _ejs_define_os_uint(ctx, ESHUTDOWN);
    _ejs_define_os_uint(ctx, ETOOMANYREFS);
    _ejs_define_os_uint(ctx, ETIMEDOUT);
    _ejs_define_os_uint(ctx, ECONNREFUSED);
    _ejs_define_os_uint(ctx, EHOSTDOWN);
    _ejs_define_os_uint(ctx, EHOSTUNREACH);
    _ejs_define_os_uint(ctx, EALREADY);
    _ejs_define_os_uint(ctx, EINPROGRESS);
    _ejs_define_os_uint(ctx, ESTALE);
    _ejs_define_os_uint(ctx, EUCLEAN);
    _ejs_define_os_uint(ctx, ENOTNAM);
    _ejs_define_os_uint(ctx, ENAVAIL);
    _ejs_define_os_uint(ctx, EISNAM);
    _ejs_define_os_uint(ctx, EREMOTEIO);
    _ejs_define_os_uint(ctx, EDQUOT);

    _ejs_define_os_uint(ctx, ENOMEDIUM);
    _ejs_define_os_uint(ctx, EMEDIUMTYPE);
    _ejs_define_os_uint(ctx, ECANCELED);
    _ejs_define_os_uint(ctx, ENOKEY);
    _ejs_define_os_uint(ctx, EKEYEXPIRED);
    _ejs_define_os_uint(ctx, EKEYREVOKED);
    _ejs_define_os_uint(ctx, EKEYREJECTED);

    _ejs_define_os_uint(ctx, EOWNERDEAD);
    _ejs_define_os_uint(ctx, ENOTRECOVERABLE);

    _ejs_define_os_uint(ctx, ERFKILL);

    _ejs_define_os_uint(ctx, EHWPOISON);

    return 0;
}