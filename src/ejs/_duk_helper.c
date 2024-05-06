#include "_duk_helper.h"
#include <event2/bufferevent.h>
#include <event2/buffer.h>
#include "duk.h"

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

    int n = evbuffer_drain(buf, len);
    if (n < 0)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "evbuffer_drain fail");
        duk_throw(ctx);
    }
    duk_push_int(ctx, n);
    return 1;
}