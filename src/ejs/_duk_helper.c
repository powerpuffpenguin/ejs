#include "_duk_helper.h"

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