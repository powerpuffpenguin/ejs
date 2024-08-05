#include "_append.h"
#include "../internal/c_string.h"
duk_ret_t __ejs__modules_append(
    duk_context *ctx,
    void *value, size_t min_element,
    __ejs__modules_append_get get_at,
    __ejs__modules_encode encode)
{
    duk_size_t buf_cap;
    uint8_t *buf = duk_get_buffer_data_default(ctx, 1, &buf_cap, 0, 0);
    duk_size_t buf_len;

    duk_size_t length = duk_get_length(ctx, 0);
    if (buf_cap)
    {
        buf_len = duk_require_number(ctx, 2);
        duk_pop(ctx);

        duk_push_array(ctx);
        duk_swap_top(ctx, -2);
    }
    else
    {
        buf_len = 0;
        duk_pop_2(ctx);
        duk_push_array(ctx);
        buf_cap = ppp_c_string_grow_calculate(0, 0, min_element * length * 3 / 2);
        buf = duk_push_fixed_buffer(ctx, buf_cap);
    }

    duk_size_t count = 0;
    int n;
    uint8_t *p;
    for (duk_size_t i = 0; i < length; i++)
    {
        duk_get_prop_index(ctx, 0, i);
        get_at(ctx, -1, value);
        duk_pop(ctx);

        n = encode(buf + buf_len, buf_cap - buf_len, value);
        if (n >= 0)
        {
            buf_len += n;
            continue;
        }
        buf_cap = ppp_c_string_grow_calculate(buf_cap, buf_len, min_element * (length - i - 1) - n);
        p = duk_push_fixed_buffer(ctx, buf_cap);
        memcpy(p, buf, buf_len);
        buf_len += encode(p + buf_len, buf_cap - buf_len, value);
        buf = p;
        duk_swap_top(ctx, -2);
        duk_pop(ctx);
    }
    duk_put_prop_index(ctx, -2, 0);
    duk_push_number(ctx, buf_len);
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}
duk_ret_t __ejs__modules_append_value(duk_context *ctx)
{
    duk_size_t src_len;
    const uint8_t *src;
    if (duk_is_string(ctx, 0))
    {
        src = duk_require_lstring(ctx, 0, &src_len);
    }
    else
    {
        src = duk_require_buffer_data(ctx, 0, &src_len);
    }

    duk_size_t buf_cap;
    uint8_t *buf = duk_get_buffer_data_default(ctx, 1, &buf_cap, 0, 0);
    if (!buf_cap)
    {
        duk_pop_3(ctx);
        duk_push_array(ctx);
        buf = duk_push_fixed_buffer(ctx, src_len);
        memcpy(buf, src, src_len);
        duk_put_prop_index(ctx, -2, 0);
        duk_push_number(ctx, src_len);
        duk_put_prop_index(ctx, -2, 1);
        return 1;
    }

    duk_size_t buf_len = duk_require_number(ctx, 2);
    buf_cap = ppp_c_string_grow_calculate(buf_cap, buf_len, src_len);
    if (!buf_cap)
    {

        duk_swap(ctx, 0, 1);
        duk_pop_2(ctx);
        duk_push_array(ctx);
        duk_swap_top(ctx, -2);

        memmove(buf + buf_len, src, src_len);
        duk_put_prop_index(ctx, -2, 0);
        duk_push_number(ctx, buf_len + src_len);
        duk_put_prop_index(ctx, -2, 1);
        return 1;
    }

    duk_pop_3(ctx);
    duk_push_array(ctx);
    uint8_t *p = duk_push_fixed_buffer(ctx, buf_cap);

    memcpy(p, buf, buf_len);
    memcpy(p + buf_len, src, src_len);

    duk_put_prop_index(ctx, -2, 0);
    duk_push_number(ctx, buf_len + src_len);
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}