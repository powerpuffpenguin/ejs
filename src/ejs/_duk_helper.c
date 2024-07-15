#include "_duk_helper.h"
#include "_duk.h"
#include "duk.h"
#include "defines.h"
#include "config.h"
#include "_duk_async.h"

#include <event2/bufferevent.h>
#include <event2/buffer.h>
#include <sys/stat.h>
#include <fcntl.h>
#include <unistd.h>

duk_ret_t _ejs_helper_bytes_equal(duk_context *ctx)
{
    duk_size_t l0;
    const char *s0 = duk_require_buffer_data(ctx, 0, &l0);
    duk_size_t l1;
    const char *s1 = duk_require_buffer_data(ctx, 1, &l1);
    if (l0 == l1)
    {
        if (!memcmp(s0, s1, l0))
        {
            duk_pop(ctx);
            duk_push_true(ctx);
            return 1;
        }
    }
    duk_pop(ctx);
    duk_push_false(ctx);
    return 1;
}
duk_ret_t _ejs_helper_bytes_copy(duk_context *ctx)
{
    duk_size_t l0;
    char *s0 = duk_require_buffer_data(ctx, 0, &l0);
    duk_size_t l1;
    const char *s1 = duk_require_buffer_data(ctx, 1, &l1);
    duk_size_t n = l0 < l1 ? l0 : l1;
    if (n)
    {
        memmove(s0, s1, n);
    }
    duk_pop_2(ctx);
    duk_push_number(ctx, n);
    return 1;
}
void _ejs_helper_c_hex_string(duk_context *ctx, const uint8_t *b, const duk_size_t length)
{
    if (length)
    {
        char *hexDigit = EJS_HEX_DIGIT;
        uint8_t tn;
        char *s = duk_push_fixed_buffer(ctx, length * 2);
        for (duk_size_t i = 0; i < length; i++)
        {
            tn = b[i];
            s[i * 2] = hexDigit[tn >> 4];
            s[i * 2 + 1] = hexDigit[tn & 0xf];
        }
        duk_buffer_to_string(ctx, -1);
    }
    else
    {
        duk_pop(ctx);
        duk_push_lstring(ctx, "", 0);
    }
}
duk_ret_t _ejs_helper_hex_string(duk_context *ctx)
{
    duk_size_t length;
    uint8_t *b = duk_require_buffer_data(ctx, 0, &length);
    _ejs_helper_c_hex_string(ctx, b, length);
    return 1;
}
duk_ret_t _ejs_evbuffer_len(duk_context *ctx)
{
    struct evbuffer *buf = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    size_t len = evbuffer_get_length(buf);
    duk_push_uint(ctx, len);
    return 1;
}
duk_ret_t _ejs_evbuffer_read(duk_context *ctx)
{
    struct evbuffer *buf = duk_require_pointer(ctx, 0);
    duk_size_t len;
    uint8_t *data = duk_require_buffer_data(ctx, 1, &len);
    int n = evbuffer_remove(buf, data, len);
    if (n < 0)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "evbuffer_remove fail");
        duk_throw(ctx);
    }
    duk_push_int(ctx, n);
    return 1;
}
duk_ret_t _ejs_evbuffer_copy(duk_context *ctx)
{
    struct evbuffer *buf = duk_require_pointer(ctx, 0);
    duk_size_t len;
    uint8_t *data = duk_require_buffer_data(ctx, 1, &len);
    ssize_t n;
    if (duk_is_undefined(ctx, 2))
    {
        n = evbuffer_copyout(buf, data, len);
    }
    else
    {
        size_t end = evbuffer_get_length(buf);
        size_t offset = duk_require_number(ctx, 2);
        if (offset >= end)
        {
            duk_push_int(ctx, 0);
            return 1;
        }
        else
        {
            struct evbuffer_ptr pos;
            evbuffer_ptr_set(buf, &pos, offset, EVBUFFER_PTR_SET);
            n = evbuffer_copyout_from(buf, &pos, data, len);
        }
    }
    if (n < 0)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "evbuffer_remove fail");
        duk_throw(ctx);
    }
    duk_push_int(ctx, n);
    return 1;
}
duk_ret_t _ejs_evbuffer_drain(duk_context *ctx)
{
    struct evbuffer *buf = duk_require_pointer(ctx, 0);
    size_t len = duk_require_number(ctx, 1);
    if (len == 0)
    {
        duk_push_int(ctx, 0);
        return 1;
    }
    size_t max = evbuffer_get_length(buf);
    if (len > max)
    {
        len = max;
    }
    int n = evbuffer_drain(buf, len);
    if (n < 0)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "evbuffer_drain fail");
        duk_throw(ctx);
    }
    duk_push_int(ctx, n);
    return 1;
}

int _ejs_open_file(const char *path, struct stat *info)
{
    int fd = open(path, O_RDONLY, 0);
    if (fd == -1)
    {
        return -1;
    }

    while (1)
    {
        if (fstat(fd, info))
        {
            int err = errno;
            close(fd);
            errno = err;
            return -1;
        }

        if (S_ISDIR(info->st_mode))
        {
            close(fd);
            errno = EISDIR;
            return -1;
        }
        else if (S_ISLNK(info->st_mode))
        {
            char s[MAXPATHLEN + 1];
            ssize_t n = readlink(path, s, MAXPATHLEN);
            if (n == -1)
            {
                int err = errno;
                close(fd);
                errno = err;
                return -1;
            }
            close(fd);
            s[n] = 0;
            fd = open(s, O_RDONLY, 0);
            if (fd == -1)
            {
                return -1;
            }
            continue;
        }
        break;
    }
    return fd;
}

int _ejs_read_fd(int fd, void *buf, size_t n)
{
    ssize_t readed;
    while (n)
    {
        readed = read(fd, buf, n);
        if (readed == -1)
        {
            return -1;
        }
        n -= readed;
    }
    return 0;
}
typedef struct
{
    int fd;
    const char *name;
} _ejs_read_file_args_t;
static void _ejs_read_file_or_text(duk_context *ctx, duk_bool_t text)
{
    _ejs_read_file_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    struct stat info;
    int fd = _ejs_open_file(args->name, &info);
    if (EJS_IS_INVALID_FD(fd))
    {
        ejs_throw_os_errno(ctx);
    }
    else if (S_ISDIR(info.st_mode))
    {
        ejs_throw_os(ctx, EISDIR, 0);
    }
    else if (!S_ISREG(info.st_mode))
    {
        ejs_throw_os(ctx, ENOENT, "regular file not exists");
    }
    else if (!info.st_size)
    {
        if (text)
        {
            duk_push_lstring(ctx, "", 0);
        }
        else
        {
            duk_push_fixed_buffer(ctx, 0);
        }
    }
    else
    {
        duk_size_t size = info.st_size;
        void *buf = duk_push_fixed_buffer(ctx, size);
        if (_ejs_read_fd(fd, buf, size))
        {
            int err = errno;
            ejs_throw_os_errno(ctx);
        }
        if (text)
        {
            duk_buffer_to_string(ctx, -1);
        }
    }
}
static duk_ret_t _ejs_read_file_impl(duk_context *ctx)
{
    _ejs_read_file_or_text(ctx, 0);
    return 1;
}
duk_ret_t _ejs_read_file(duk_context *ctx, const char *name)
{
    _ejs_read_file_args_t args = {
        .fd = EJS_INVALID_FD,
        .name = name,
    };
    if (ejs_pcall_function(ctx, _ejs_read_file_impl, &args))
    {
        EJS_CLOSE_FD(args.fd);
        duk_throw(ctx);
    }
    EJS_CLOSE_FD(args.fd);
    return 1;
}
static duk_ret_t _ejs_read_text_file_impl(duk_context *ctx)
{
    _ejs_read_file_or_text(ctx, 1);
    return 1;
}
duk_ret_t _ejs_read_text_file(duk_context *ctx, const char *name)
{
    _ejs_read_file_args_t args = {
        .fd = EJS_INVALID_FD,
        .name = name,
    };
    if (ejs_pcall_function(ctx, _ejs_read_text_file_impl, &args))
    {
        EJS_CLOSE_FD(args.fd);
        duk_throw(ctx);
    }
    EJS_CLOSE_FD(args.fd);
    return 1;
}

typedef struct
{
    EJS_ASYNC_DEFINE_RETURN_UINT8ARRAY
    const char *name;
} _ejs_async_read_file_args_t;

static void _ejs_async_read_file_impl(void *userdata)
{
    _ejs_async_read_file_args_t *opts = userdata;
    struct stat info;
    int fd = _ejs_open_file(opts->name, &info);
    if (EJS_IS_INVALID_FD(fd))
    {
        opts->result.err = errno;
        return;
    }
    else if (S_ISDIR(info.st_mode))
    {
        opts->result.err = EISDIR;
        close(fd);
        return;
    }
    else if (!S_ISREG(info.st_mode))
    {
        opts->result.err = ENOENT;
        close(fd);
        return;
    }

    if (info.st_size)
    {
        opts->result.buffer_len = info.st_size;
        opts->result.buffer = malloc(opts->result.buffer_len);
        if (!opts->result.buffer)
        {
            opts->result.err = errno;
            close(fd);
            return;
        }

        if (_ejs_read_fd(fd, opts->result.buffer, opts->result.buffer_len))
        {
            opts->result.err = errno;
            free(opts->result.buffer);
            opts->result.buffer = 0;
            close(fd);
            return;
        }
    }
    else
    {
        opts->result.buffer = 0;
        opts->result.buffer_len = 0;
    }
    close(fd);
    opts->result.err = 0;
}

duk_ret_t _ejs_async_read_file(duk_context *ctx, const char *name)
{
    _ejs_async_read_file_args_t *p = ejs_push_finalizer_object(ctx, sizeof(_ejs_async_read_file_args_t), _ejs_async_return_uint8array_finalizer);
    p->name = name;

    EJS_ASYNC_POST_OR_SEND_UINT8ARRAY(ctx, _ejs_async_read_file_impl);
    return 0;
}

duk_ret_t _ejs_async_read_text_file(duk_context *ctx, const char *name)
{
    _ejs_async_read_file_args_t *p = ejs_push_finalizer_object(ctx, sizeof(_ejs_async_read_file_args_t), _ejs_async_return_uint8array_finalizer);
    p->name = name;
    EJS_ASYNC_POST_OR_SEND_UINT8ARRAY_TEXT(ctx, _ejs_async_read_file_impl);
    return 0;
}
const char *_ejs_require_lprop_lstring(
    duk_context *ctx, duk_idx_t idx,
    const char *key, duk_size_t key_len,
    duk_size_t *out_len)
{
    duk_get_prop_lstring(ctx, idx, key, key_len);
    const char *v = duk_require_lstring(ctx, -1, out_len);
    duk_pop(ctx);
    return v;
}
duk_double_t _ejs_require_lprop_number(
    duk_context *ctx, duk_idx_t idx,
    const char *key, duk_size_t key_len)
{
    duk_get_prop_lstring(ctx, idx, key, key_len);
    duk_double_t v = duk_require_number(ctx, -1);
    duk_pop(ctx);
    return v;
}
duk_bool_t _ejs_require_lprop_bool(
    duk_context *ctx, duk_idx_t idx,
    const char *key, duk_size_t key_len)
{
    duk_get_prop_lstring(ctx, idx, key, key_len);
    duk_bool_t v = duk_require_boolean(ctx, -1);
    duk_pop(ctx);
    return v;
}