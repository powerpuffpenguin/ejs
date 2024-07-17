#include "modules_shared.h"
#include "../js/strconv.h"
#include "unicode_utf8.h"
#include "_append.h"
#include "../internal/strconv.h"

#define EJS_STRCONV_ERROR_NUM 1
#define EJS_STRCONV_ERROR_SYNTAX 2
#define EJS_STRCONV_ERROR_RANGE 3
#define EJS_STRCONV_ERROR_BASE 4
#define EJS_STRCONV_ERROR_BIT_SIZE 5

static duk_ret_t strconv_throw_name(duk_context *ctx,
                                    duk_idx_t idx,
                                    int what,
                                    const char *name, duk_size_t len)
{
    if (idx < 0)
    {
        idx = duk_require_normalize_index(ctx, idx);
    }

    duk_push_int(ctx, what);
    duk_put_prop_lstring(ctx, idx, "_what", 5);
    if (len && name)
    {
        duk_push_lstring(ctx, name, len);
        duk_put_prop_lstring(ctx, idx, "_fn", 3);
    }
    if (idx)
    {
        duk_swap(ctx, 0, idx);
    }
    duk_idx_t pop = duk_get_top_index(ctx);
    if (pop)
    {
        duk_pop_n(ctx, pop);
    }
    duk_get_prop_lstring(ctx, 0, "_throw", 6);
    duk_swap_top(ctx, -2);
    duk_call(ctx, 1);
}

static duk_ret_t toString(duk_context *ctx)
{
    duk_size_t len;
    const void *src = duk_require_buffer_data(ctx, -1, &len);
    duk_pop(ctx);
    if (len)
    {
        duk_push_lstring(ctx, src, len);
    }
    else
    {
        duk_push_lstring(ctx, "", 0);
    }
    return 1;
}
static duk_ret_t toBuffer(duk_context *ctx)
{
    duk_size_t len;
    const void *src = duk_require_lstring(ctx, -1, &len);
    duk_pop(ctx);
    if (len)
    {
        void *dst = duk_push_fixed_buffer(ctx, len);
        memcpy(dst, src, len);
    }
    else
    {
        duk_push_fixed_buffer(ctx, 0);
    }
    return 1;
}
static void bool_get_at(duk_context *ctx, duk_idx_t idx, void *value)
{
    *(uint8_t *)value = 0;
    if (duk_is_null_or_undefined(ctx, idx))
    {
        return;
    }
    if (!duk_is_boolean(ctx, idx))
    {
        duk_to_boolean(ctx, idx);
    }
    if (duk_require_boolean(ctx, -1))
    {
        *(uint8_t *)value = 1;
    }
}
static int bool_encode(void *dst, size_t dst_len, void *value)
{
    return ppp_strconv_encode_bool(dst, dst_len, *(uint8_t *)value ? 1 : 0);
}
static duk_ret_t appendBool(duk_context *ctx)
{
    uint8_t value;
    return __ejs__modules_append(
        ctx,
        &value, 4,
        bool_get_at, bool_encode);
}
static duk_ret_t parseBool(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "input", 5);
    duk_size_t len;
    const uint8_t *s = duk_require_lstring(ctx, -1, &len);
    // duk_pop(ctx);

    int v = ppp_strconv_parse_bool(s, len);
    if (v < 0)
    {
        strconv_throw_name(
            ctx, -2,
            EJS_STRCONV_ERROR_SYNTAX,
            "parseBool", 9);
    }
    duk_pop(ctx);
    if (v)
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
static duk_ret_t formatUint(duk_context *ctx)
{
    int base = _ejs_require_lprop_number(ctx, 0, "base", 4);
    if (base < PPP_STRCONV_MIN_BASE || base > PPP_STRCONV_MAX_BASE)
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_BASE,
            "formatUint", 10);
    }

    uint64_t i = _ejs_require_lprop_number(ctx, 0, "input", 5);
    if (i < PPP_STRCONV_N_SMALLS && base == 10)
    {
        ppp_strconv_small_t small = ppp_strconv_small(i);
        duk_push_lstring(ctx, small.s, small.n);
        return 1;
    }

    ppp_strconv_format_bits_a_t a;
    size_t n = sizeof(a.a);
    ppp_strconv_format_bits(0, &a, i, base, 0, 0);
    if (a.i < n)
    {
        duk_push_lstring(ctx, a.a + a.i, n - a.i);
    }
    else
    {
        duk_push_lstring(ctx, "", 0);
    }
    return 1;
}
static duk_ret_t formatInt(duk_context *ctx)
{
    int base = _ejs_require_lprop_number(ctx, 0, "base", 4);
    if (base < PPP_STRCONV_MIN_BASE || base > PPP_STRCONV_MAX_BASE)
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_BASE,
            "formatInt", 10);
    }
    int64_t i = _ejs_require_lprop_number(ctx, 0, "input", 5);
    if (i < PPP_STRCONV_N_SMALLS && base == 10)
    {
        ppp_strconv_small_t small = ppp_strconv_small(i);
        duk_push_lstring(ctx, small.s, small.n);
        return 1;
    }
    ppp_strconv_format_bits_a_t a;
    size_t n = sizeof(a.a);
    ppp_strconv_format_bits(0, &a, i, base, i < 0, 0);
    if (a.i < n)
    {
        duk_push_lstring(ctx, a.a + a.i, n - a.i);
    }
    else
    {
        duk_push_lstring(ctx, "", 0);
    }
    return 1;
}
// ([],buf:uint8Array?):[Uint8Array,number]
static duk_ret_t append_raw(
    duk_context *ctx,
    uint8_t *buf, size_t buf_len, size_t buf_cap,
    const uint8_t *src, size_t n)
{
    if (buf)
    {
        size_t cap = ppp_c_string_grow_calculate(buf_cap, buf_len, n);
        if (cap)
        {
            duk_pop(ctx);
            void *p = duk_push_fixed_buffer(ctx, cap);
            if (buf_len)
            {
                memcpy(p, buf, buf_len);
            }
            buf = p;
        }
        memcpy(buf + buf_len, src, n);

        buf_len += n;
    }
    else
    {
        buf_cap = ppp_c_string_grow_calculate(0, 0, n);
        buf = duk_push_fixed_buffer(ctx, buf_cap);
        memcpy(buf, src, n);
        buf_len = n;
    }

    duk_put_prop_index(ctx, -2, 0);
    duk_push_number(ctx, buf_len);
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}
static duk_ret_t appendUint(duk_context *ctx)
{
    int base = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, 3, 10);
    // if (base < PPP_STRCONV_MIN_BASE || base > PPP_STRCONV_MAX_BASE)
    // {
    //     duk_pop_n(ctx, 4);
    //     duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "strconv: illegal appendUint base");
    //     duk_throw(ctx);
    // }
    uint64_t i = duk_require_number(ctx, 2);
    duk_size_t buf_cap;
    uint8_t *buf = duk_get_buffer_data_default(ctx, 1, &buf_cap, 0, 0);
    duk_size_t buf_len;
    if (buf)
    {
        buf_len = duk_require_number(ctx, 1);
        duk_pop_3(ctx);

        duk_push_array(ctx);
        duk_swap_top(ctx, -2);
    }
    else
    {
        buf_len = 0;
        duk_pop_n(ctx, 4);
        duk_push_array(ctx);
    }

    if (i < PPP_STRCONV_N_SMALLS && base == 10)
    {
        ppp_strconv_small_t small = ppp_strconv_small(i);
        return append_raw(ctx, buf, buf_len, buf_cap, small.s, small.n);
    }
    ppp_strconv_format_bits_a_t a;
    size_t n = sizeof(a.a);
    ppp_strconv_format_bits(0, &a, i, base, 0, 0);
    if (a.i < n)
    {
        return append_raw(ctx, buf, buf_len, buf_cap, a.a + a.i, n - a.i);
    }
    return append_raw(ctx, buf, buf_len, buf_cap, "", 0);
}
static duk_ret_t appendInt(duk_context *ctx)
{
    int base = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, 3, 10);
    // if (base < PPP_STRCONV_MIN_BASE || base > PPP_STRCONV_MAX_BASE)
    // {
    //     duk_pop_n(ctx, 4);
    //     duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "strconv: illegal appendInt base");
    //     duk_throw(ctx);
    // }
    uint64_t i = duk_require_number(ctx, 2);
    duk_size_t buf_cap;
    uint8_t *buf = duk_get_buffer_data_default(ctx, 1, &buf_cap, 0, 0);
    duk_size_t buf_len;
    if (buf)
    {
        buf_len = duk_require_number(ctx, 1);
        duk_pop_3(ctx);

        duk_push_array(ctx);
        duk_swap_top(ctx, -2);
    }
    else
    {
        buf_len = 0;
        duk_pop_n(ctx, 4);
        duk_push_array(ctx);
    }

    if (i < PPP_STRCONV_N_SMALLS && base == 10)
    {
        ppp_strconv_small_t small = ppp_strconv_small(i);
        return append_raw(ctx, buf, buf_len, buf_cap, small.s, small.n);
    }
    ppp_strconv_format_bits_a_t a;
    size_t n = sizeof(a.a);
    ppp_strconv_format_bits(0, &a, i, base, i < 0, 0);
    if (a.i < n)
    {
        return append_raw(ctx, buf, buf_len, buf_cap, a.a + a.i, n - a.i);
    }
    return append_raw(ctx, buf, buf_len, buf_cap, "", 0);
}

// underscoreOK reports whether the underscores in s are allowed.
// Checking them in this one function lets all the parsers skip over them simply.
// Underscore must appear only between digits or between a base prefix and a digit.
static duk_bool_t underscoreOK(const uint8_t *s, size_t s_len)
{
    // saw tracks the last character (class) we saw:
    // ^ for beginning of number,
    // 0 for a digit or base prefix,
    // _ for an underscore,
    // ! for none of the above.
    uint8_t saw = '^';
    size_t i = 0;

    // Optional sign.
    if (s_len >= 1 && (s[0] == '-' || s[0] == '+'))
    {
        s++;
        s_len--;
    }

    // Optional base prefix.
    duk_bool_t hex = 0;
    if (s_len >= 2 && s[0] == '0')
    {
        switch (PPP_STRCONV_LOWER(s[1]))
        {
        case 'x':
            hex = 1;
        case 'b':
        case 'o':
            i = 2;
            saw = '0'; // base prefix counts as a digit for "underscore as digit separator"
            break;
        }
    }

    // Number proper.
    for (; i < s_len; i++)
    {
        // Digits are always okay.
        if ('0' <= s[i] && s[i] <= '9' || hex && 'a' <= PPP_STRCONV_LOWER(s[i]) && PPP_STRCONV_LOWER(s[i]) <= 'f')
        {
            saw = '0';
            continue;
        }
        // Underscore must follow digit.
        if (s[i] == '_')
        {
            if (saw != '0')
            {
                return 0;
            }
            saw = '_';
            continue;
        }
        // Underscore must also be followed by digit.
        if (saw == '_')
        {
            return 0;
        }
        // Saw non-digit, non-underscore.
        saw = '!';
    }
    return saw != '_' ? 1 : 0;
}

static uint64_t _parseUint(
    duk_context *ctx,
    const uint8_t *s, size_t s_len,
    int base, int bitSize,
    duk_bool_t isuint)
{
    duk_bool_t base0 = base == 0 ? 1 : 0;

    const uint8_t *s0 = s;
    size_t s0_len = s_len;
    if (2 <= base && base <= 36)
    {
        // valid base; nothing to do
    }
    else if (base0)
    {
        // Look for octal, hex prefix.
        base = 10;
        if (s[0] == '0')
        {
            if (s_len >= 3)
            {
                switch (PPP_STRCONV_LOWER(s[1]))
                {
                case 'b':
                    base = 2;
                    s += 2;
                    s_len -= 2;
                    break;
                case 'o':
                    base = 8;
                    s += 2;
                    s_len -= 2;
                    break;
                case 'x':
                    base = 16;
                    s += 2;
                    s_len -= 2;
                    break;
                default:
                    base = 8;
                    s += 1;
                    s_len--;
                    break;
                }
            }
            else
            {
                base = 8;
                s += 1;
                s_len--;
            }
        }
    }
    else
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_BASE,
            0, 0);
    }
    if (bitSize == 0)
    {
        bitSize = 64;
    }
    else if (bitSize < 0 || bitSize > 64)
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_BIT_SIZE,
            0, 0);
    }
    // Cutoff is the smallest number such that cutoff*base > maxUint64.
    // Use compile-time constants for common cases.
    uint64_t cutoff = 18446744073709551615UL;
    switch (base)
    {
    case 10:
        cutoff /= 10;
        break;
    case 16:
        cutoff /= 16;
        break;
    default:
        cutoff /= (uint64_t)base;
        break;
    }
    cutoff++;

    uint64_t maxVal = (uint64_t)(1) << bitSize - 1;
    duk_bool_t underscores = 0;
    uint64_t n = 0, n1;
    uint8_t c, d;
    for (size_t i = 0; i < s_len; i++)
    {
        c = s[i];
        if (c == '_' && base0)
        {
            continue;
        }
        else if ('0' <= c && c <= '9')
        {
            d = c - '0';
        }
        else
        {
            d = PPP_STRCONV_LOWER(c);
            if ('a' <= d && d <= 'z')
            {
                d -= 'a';
                d += 10;
            }
            else
            {
                strconv_throw_name(
                    ctx, 0,
                    EJS_STRCONV_ERROR_SYNTAX,
                    0, 0);
            }
        }

        if (d >= base)
        {
            strconv_throw_name(
                ctx, 0,
                EJS_STRCONV_ERROR_SYNTAX,
                0, 0);
        }
        if (n >= cutoff)
        {
            // n*base overflows
            strconv_throw_name(
                ctx, 0,
                EJS_STRCONV_ERROR_RANGE,
                0, 0);
        }
        n *= (uint64_t)(base);

        n1 = n + (uint64_t)(d);
        if (n1 < n || n1 > maxVal)
        {
            // n+d overflows
            strconv_throw_name(
                ctx, 0,
                EJS_STRCONV_ERROR_RANGE,
                0, 0);
        }
        n = n1;
    }

    if (underscores && !underscoreOK(s0, s0_len))
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_SYNTAX,
            0, 0);
    }
    return n;
}
static int64_t _parseInt(
    duk_context *ctx,
    const uint8_t *s, size_t s_len,
    int base, int bitSize)
{
    // Pick off leading sign.
    const uint8_t *s0 = s;
    size_t s0_len = s_len;
    duk_bool_t neg = 0;
    switch (s[0])
    {
    case '-':
        neg = 1;
    case '+':
        s++;
        s_len--;
        break;
    }

    // Convert unsigned and check range.
    uint64_t un = _parseUint(ctx, s, s_len, base, bitSize, 0);
    if (bitSize == 0)
    {
        bitSize = 64;
    }
    uint64_t cutoff = 1;
    cutoff <<= (bitSize - 1);
    if (un >= cutoff)
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_RANGE,
            0, 0);
    }
    int64_t n = un;
    if (neg)
    {
        n = -n;
    }
    return n;
}
static duk_ret_t parseInt(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = _ejs_require_lprop_lstring(
        ctx, 0,
        "input", 5,
        &s_len);
    int base = _ejs_require_lprop_number(
        ctx, 0,
        "base", 4);
    int bitSize = _ejs_require_lprop_number(
        ctx, 0,
        "bitSize", 7);
    if (s_len == 0)
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_SYNTAX,
            0, 0);
    }

    int64_t v = _parseInt(ctx, s, s_len, base, bitSize);
    if (v > EJS_SHARED_MODULE__MAX_SAFE_INTEGER)
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_RANGE,
            0, 0);
    }
    else if (v < EJS_SHARED_MODULE__MIN_SAFE_INTEGER)
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_RANGE,
            0, 0);
    }
    duk_push_number(ctx, v);
    return 1;
}
static duk_ret_t parseUint(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = _ejs_require_lprop_lstring(
        ctx, 0,
        "input", 5,
        &s_len);
    int base = _ejs_require_lprop_number(
        ctx, 0,
        "base", 4);
    int bitSize = _ejs_require_lprop_number(
        ctx, 0,
        "bitSize", 7);
    if (s_len == 0)
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_SYNTAX,
            0, 0);
    }

    uint64_t v = _parseUint(ctx, s, s_len, base, bitSize, 1);
    if (v > EJS_SHARED_MODULE__MAX_SAFE_INTEGER)
    {
        strconv_throw_name(
            ctx, 0,
            EJS_STRCONV_ERROR_RANGE,
            0, 0);
    }
    duk_push_number(ctx, v);
    return 1;
}
static duk_ret_t fast_atoi(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = _ejs_require_lprop_lstring(
        ctx, 0,
        "input", 5,
        &s_len);

    const uint8_t *s0 = s;
    duk_size_t s0_len = s_len;
    duk_bool_t neg = 0;
    switch (s[0])
    {
    case '-':
        neg = 1;
    case '+':
        if (s_len < 2)
        {
            strconv_throw_name(
                ctx, 0,
                EJS_STRCONV_ERROR_SYNTAX,
                "atoi", 4);
        }
        s++;
        s_len--;
        break;
    }

    int64_t n = 0;
    uint8_t ch;
    for (size_t i = 0; i < s_len; i++)
    {
        ch = s[i] - '0';
        if (ch > 9)
        {
            strconv_throw_name(
                ctx, 0,
                EJS_STRCONV_ERROR_SYNTAX,
                "atoi", 4);
        }
        n = n * 10 + ch;
    }
    if (neg)
    {
        n = -n;
    }
    duk_push_number(ctx, n);
    return 1;
}
static duk_ret_t isGraphic(duk_context *ctx)
{
    int32_t r = duk_require_number(ctx, 0);
    duk_pop(ctx);
    if (ppp_strconv_is_graphic(r))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
static duk_ret_t isPrint(duk_context *ctx)
{
    int32_t r = duk_require_number(ctx, 0);
    duk_pop(ctx);
    if (ppp_strconv_is_print(r))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
static duk_ret_t canBackquote(duk_context *ctx)
{
    duk_size_t len;
    const uint8_t *s = duk_require_lstring(ctx, 0, &len);
    duk_pop(ctx);

    if (ppp_strconv_can_backquote(s, len))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
static duk_ret_t _len(duk_context *ctx)
{
    duk_size_t len;
    if (duk_is_string(ctx, 0))
    {
        duk_require_lstring(ctx, 0, &len);
    }
    else
    {
        duk_require_buffer_data(ctx, 0, &len);
    }
    duk_pop(ctx);
    duk_push_number(ctx, len);
    return 1;
}
// ... Uint8Array => ... Uint8Array
static uint8_t *appendByte(
    duk_context *ctx,
    uint8_t *buf, duk_size_t *p_len, duk_size_t *p_cap,
    uint8_t c)
{
    duk_size_t len = *p_len;
    duk_size_t cap = ppp_c_string_grow_calculate(*p_cap, len, 1);
    if (cap)
    {
        void *p = duk_push_fixed_buffer(ctx, cap);
        memcpy(p, buf, len);
        buf = p;
        *p_cap = cap;
        duk_swap_top(ctx, -2);
        duk_pop(ctx);
    }
    buf[len++] = c;
    *p_len = len;
    return buf;
}
// ... Uint8Array => ... Uint8Array
static uint8_t *appendBytes(
    duk_context *ctx,
    uint8_t *buf, duk_size_t *p_len, duk_size_t *p_cap,
    const uint8_t *s, duk_size_t s_len)
{
    duk_size_t len = *p_len;
    duk_size_t cap = ppp_c_string_grow_calculate(*p_cap, len, 2);
    if (cap)
    {
        void *p = duk_push_fixed_buffer(ctx, cap);
        memcpy(p, buf, len);
        buf = p;
        *p_cap = cap;
        duk_swap_top(ctx, -2);
        duk_pop(ctx);
        memcpy(buf + len, s, s_len);
    }
    else
    {
        memmove(buf + len, s, s_len);
    }
    *p_len = len + s_len;
    return buf;
}
static uint8_t *appendEscapedRune(
    duk_context *ctx,
    uint8_t *buf, duk_size_t *buf_len, duk_size_t *buf_cap,
    ppp_utf8_rune_t r, uint8_t quote,
    duk_bool_t ASCIIonly, duk_bool_t graphicOnly)
{
    uint8_t runeTmp[4] = {0};
    if (r == quote || r == '\\')
    {
        // always backslashed
        buf = appendByte(ctx, buf, buf_len, buf_cap, '\\');
        buf = appendByte(ctx, buf, buf_len, buf_cap, r);
        return buf;
    }

    if (ASCIIonly)
    {
        if (r < PPP_UTF8_RUNE_SELF && ppp_strconv_is_print(r))
        {
            buf = appendByte(ctx, buf, buf_len, buf_cap, r);
            return buf;
        }
    }
    else
    {
        if (ppp_strconv_is_print(r) || graphicOnly && ppp_strconv_is_graphic_list(r))
        {
            int n = ppp_utf8_encode(runeTmp, 4, r);
            buf = appendBytes(ctx, buf, buf_len, buf_cap, runeTmp, n);
            return buf;
        }
    }
    switch (r)
    {
    case '\a':
        buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\a", 2);
        break;
    case '\b':
        buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\b", 2);
        break;
    case '\f':
        buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\f", 2);
        break;
    case '\n':
        buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\n", 2);
        break;
    case '\r':
        buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\r", 2);
        break;
    case '\t':
        buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\t", 2);
        break;
    case '\v':
        buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\v", 2);
        break;
    default:
        if (r < ' ' || r == 0x7f)
        {
            const char *lowerhex = EJS_SHARED_LOWER_HEX_DIGIT;
            buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\x", 2);
            buf = appendByte(ctx, buf, buf_len, buf_cap, lowerhex[r >> 4]);
            buf = appendByte(ctx, buf, buf_len, buf_cap, lowerhex[r & 0xF]);
        }
        else
        {
            if (!ppp_utf8_is_rune(r))
            {
                r = 0xFFFD;
            }
            const char *lowerhex = EJS_SHARED_LOWER_HEX_DIGIT;
            if (r < 0x10000)
            {
                buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\u", 2);
                for (int s = 12; s >= 0; s -= 4)
                {
                    buf = appendByte(ctx, buf, buf_len, buf_cap, lowerhex[r >> s & 0xF]);
                }
            }
            else
            {
                buf = appendBytes(ctx, buf, buf_len, buf_cap, "\\U", 2);
                for (int s = 28; s >= 0; s -= 4)
                {
                    buf = appendByte(ctx, buf, buf_len, buf_cap, lowerhex[r >> s & 0xF]);
                }
            }
        }
        break;
    }
    return buf;
}
static duk_ret_t appendQuotedWith(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = _ejs_require_lprop_lstring(ctx, 0, "s", 1, &s_len);
    duk_bool_t ASCIIonly = _ejs_require_lprop_bool(ctx, 0, "ASCIIonly", 9);
    duk_bool_t graphicOnly = _ejs_require_lprop_bool(ctx, 0, "graphicOnly", 11);
    uint8_t quote = _ejs_require_lprop_number(ctx, 0, "quote", 5);

    duk_get_prop_lstring(ctx, 0, "buf", 3);
    uint8_t *buf = 0;
    duk_size_t buf_cap = 0;
    if (!duk_is_null_or_undefined(ctx, -1))
    {
        buf = duk_require_buffer_data(ctx, -1, &buf_cap);
    }
    duk_size_t buf_len = 0;
    if (buf)
    {
        buf_len = _ejs_require_lprop_number(ctx, 0, "len", 3);
    }
    duk_push_array(ctx);
    duk_swap_top(ctx, -2);
    // Often called with big strings, so preallocate. If there's quoting,
    // this is conservative but still helps a lot.
    if (buf_cap - buf_len < s_len)
    {
        duk_pop(ctx);
        buf_cap = buf_len + 1 + s_len + 1;
        void *p = duk_push_fixed_buffer(ctx, buf_cap);
        memcpy(p, buf, buf_len);
        buf = p;
    }

    buf = appendByte(ctx, buf, &buf_len, &buf_cap, quote);
    ppp_utf8_rune_t r;
    const char *lowerhex = EJS_SHARED_LOWER_HEX_DIGIT;
    for (int width = 0; s_len > 0;)
    {
        // 	r := rune(s[0])
        // width = 1
        if (s[0] >= PPP_UTF8_RUNE_SELF)
        {
            r = ppp_utf8_decode(s, s_len, &width);
        }
        else
        {
            r = s[0];
            width = 1;
        }
        if (width == 1 && r == PPP_UTF8_RUNE_ERROR)
        {
            buf = appendBytes(ctx, buf, &buf_len, &buf_cap, "\\x", 2);
            buf = appendByte(ctx, buf, &buf_len, &buf_cap, lowerhex[s[0] >> 4]);
            buf = appendByte(ctx, buf, &buf_len, &buf_cap, lowerhex[s[0] & 0xF]);
        }
        else
        {
            buf = appendEscapedRune(
                ctx,
                buf, &buf_len, &buf_cap,
                r, quote,
                ASCIIonly, graphicOnly);
        }
        s += width;
        s_len -= width;
    }
    buf = appendByte(ctx, buf, &buf_len, &buf_cap, quote);

    duk_put_prop_index(ctx, -2, 0);
    duk_push_number(ctx, buf_len);
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}
static duk_ret_t appendQuotedRuneWith(duk_context *ctx)
{
    ppp_utf8_rune_t r = _ejs_require_lprop_number(ctx, 0, "r", 1);
    duk_bool_t ASCIIonly = _ejs_require_lprop_bool(ctx, 0, "ASCIIonly", 9);
    duk_bool_t graphicOnly = _ejs_require_lprop_bool(ctx, 0, "graphicOnly", 11);
    uint8_t quote = _ejs_require_lprop_number(ctx, 0, "quote", 5);

    duk_get_prop_lstring(ctx, 0, "buf", 3);
    uint8_t *buf = 0;
    duk_size_t buf_cap = 0;
    if (!duk_is_null_or_undefined(ctx, -1))
    {
        buf = duk_require_buffer_data(ctx, -1, &buf_cap);
    }
    duk_size_t buf_len = 0;
    if (buf)
    {
        buf_len = _ejs_require_lprop_number(ctx, 0, "len", 3);
    }
    duk_push_array(ctx);
    duk_swap_top(ctx, -2);

    buf = appendByte(ctx, buf, &buf_len, &buf_cap, quote);
    if (!ppp_utf8_is_rune(r))
    {
        r = PPP_UTF8_RUNE_ERROR;
    }
    buf = appendEscapedRune(
        ctx,
        buf, &buf_len, &buf_cap,
        r, quote,
        ASCIIonly, graphicOnly);
    buf = appendByte(ctx, buf, &buf_len, &buf_cap, quote);

    duk_put_prop_index(ctx, -2, 0);
    duk_push_number(ctx, buf_len);
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}
static int _unquote_char_impl(
    const uint8_t *s, size_t s_len, uint8_t quote,
    ppp_utf8_rune_t *output_rune,
    duk_bool_t *output_multibyte,
    size_t *output_tail)
{

    // easy cases
    if (s_len == 0)
    {
        return -1;
    }
    uint8_t c = s[0];
    if (c == quote && (quote == '\'' || quote == '"'))
    {
        return -1;
    }
    else if (c >= PPP_UTF8_RUNE_SELF)
    {
        int size;
        ppp_utf8_rune_t r = ppp_utf8_decode(s, s_len, &size);
        EJS_SET_OUTPUT(output_rune, r);
        EJS_SET_OUTPUT(output_multibyte, 1);
        EJS_SET_OUTPUT(output_tail, size);
        return 0;
    }
    else if (c != '\\')
    {
        EJS_SET_OUTPUT(output_rune, s[0]);
        EJS_SET_OUTPUT(output_multibyte, 0);
        EJS_SET_OUTPUT(output_tail, 1);
        return 0;
    }

    // hard case: c is backslash
    if (s_len <= 1)
    {
        return -1;
    }
    c = s[1];
    s += 2;
    s_len -= 2;

    size_t tail = 2;
    ppp_utf8_rune_t value = 0;
    duk_bool_t multibyte = 0;
    switch (c)
    {
    case 'a':
        value = '\a';
        break;
    case 'b':
        value = '\b';
        break;
    case 'f':
        value = '\f';
        break;
    case 'n':
        value = '\n';
        break;
    case 'r':
        value = '\r';
        break;
    case 't':
        value = '\t';
        break;
    case 'v':
        value = '\v';
        break;
    case 'x':
    case 'u':
    case 'U':
    {
        int n = 0;
        switch (c)
        {
        case 'x':
            n = 2;
            break;
        case 'u':
            n = 4;
            break;
        case 'U':
            n = 8;
            break;
        }

        if (s_len < n)
        {
            return -1;
        }
        ppp_utf8_rune_t v = 0;
        duk_bool_t ok;
        ppp_utf8_rune_t x;
        for (int j = 0; j < n; j++)
        {
            x = __ejs_modules_shared_unhex(s[j], &ok);
            if (!ok)
            {
                return -1;
            }
            v = v << 4 | x;
        }
        tail += n;
        s += n;
        s_len -= n;
        if (c == 'x')
        {
            // single-byte string, possibly not UTF-8
            value = v;
        }
        else if (!ppp_utf8_is_rune(v))
        {
            return -1;
        }
        else
        {
            value = v;
            multibyte = 1;
        }
    }
    break;
    case '0':
    case '1':
    case '2':
    case '3':
    case '4':
    case '5':
    case '6':
    case '7':
    {
        if (s_len < 2)
        {
            return -1;
        }
        ppp_utf8_rune_t v = c - '0';
        ppp_utf8_rune_t x;
        for (int j = 0; j < 2; j++)
        { // one digit already; two more
            x = s[j] - '0';
            if (x < 0 || x > 7)
            {
                return -1;
            }
            v = (v << 3) | x;
        }
        if (v > 255)
        {
            return -1;
        }
        tail += 2;
        s += 2;
        s_len -= 2;

        value = v;
    }
    break;
    case '\\':
        value = '\\';
        break;
    case '\'':
    case '"':
        if (c != quote)
        {
            return -1;
        }
        value = c;
        break;
    default:
        return -1;
    }
    EJS_SET_OUTPUT(output_rune, value);
    EJS_SET_OUTPUT(output_multibyte, multibyte);
    EJS_SET_OUTPUT(output_tail, tail);
    return 0;
}
static duk_ret_t _unquote(
    duk_context *ctx,
    duk_bool_t is_string,
    const uint8_t *in, duk_size_t in_len,
    duk_bool_t unescape)
{
    // Determine the quote form and optimistically find the terminating quote.
    if (in_len < 2)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
        duk_throw(ctx);
    }
    uint8_t quote = in[0];
    size_t end = __ejs_modules_shared_strings_index(in + 1, in_len - 1, quote);
    if (end == -1)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
        duk_throw(ctx);
    }
    end += 2; // position after terminating quote; may be wrong if escape sequences are present

    switch (quote)
    {
    case '`':
        if (!unescape)
        {
            if (end != in_len)
            {
                if (is_string)
                {
                    duk_push_lstring(ctx, in, end);
                }
                else
                {
                    duk_push_number(ctx, 0);
                    duk_push_number(ctx, end);
                    duk_call(ctx, 3);
                }
            }
        }
        else if (!__ejs_modules_shared_strings_contains(in, end, '\r'))
        {
            if (end != in_len)
            {
                if (unescape)
                {
                    duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
                    duk_throw(ctx);
                }
            }
            if (is_string)
            {
                duk_push_lstring(ctx, in + 1, end - 1 - 1);
            }
            else
            {
                duk_push_number(ctx, 1);
                duk_push_number(ctx, end - 1);
                duk_call(ctx, 3);
            }
        }
        else
        {
            if (end != in_len)
            {
                if (unescape)
                {
                    duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
                    duk_throw(ctx);
                }
            }

            // Carriage return characters ('\r') inside raw string literals
            // are discarded from the raw string value.
            duk_size_t cap = end - 3;
            if (cap)
            {
                duk_pop(ctx);
                uint8_t *buf = duk_push_fixed_buffer(ctx, cap);
                duk_size_t buf_len = 0;
                for (size_t i = 1; i < end - 1; i++)
                {
                    if (in[i] != '\r')
                    {
                        buf[buf_len++] = in[i];
                    }
                }
                if (is_string)
                {
                    duk_push_lstring(ctx, buf, buf_len);
                }
                else if (buf_len != cap)
                {
                    duk_push_number(ctx, 0);
                    duk_push_number(ctx, buf_len);
                    duk_call(ctx, 3);
                }
            }
            else
            {
                if (is_string)
                {
                    duk_push_lstring(ctx, "", 0);
                }
                else
                {
                    duk_push_number(ctx, 0);
                    duk_push_number(ctx, 0);
                    duk_call(ctx, 3);
                }
            }
        }
        // NOTE: Prior implementations did not verify that raw strings consist
        // of valid UTF-8 characters and we continue to not verify it as such.
        // The Go specification does not explicitly require valid UTF-8,
        // but only mention that it is implicitly valid for Go source code
        // (which must be valid UTF-8).
        break;
    case '"':
    case '\'':
    {
        // Handle quoted strings without any escape sequences.
        if (!__ejs_modules_shared_strings_contains_any(in, end, "\\\n", 2))
        {
            BOOL valid;
            switch (quote)
            {
            case '"':
                valid = ppp_utf8_is_valid(in + 1, end - 1 - 1);
                break;
            case '\'':
            {
                int n;
                ppp_utf8_rune_t r = ppp_utf8_decode(in + 1, end - 1 - 1, &n);
                valid = (1 + n + 1 == end) && (r != PPP_UTF8_RUNE_ERROR || n != 1) ? 1 : 0;
            }
            break;
            }
            if (valid)
            {
                if (unescape)
                {
                    if (end != in_len)
                    {
                        duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
                        duk_throw(ctx);
                    }
                    // exclude quotes
                    if (is_string)
                    {
                        duk_push_lstring(ctx, in + 1, end - 1 - 1);
                    }
                    else
                    {
                        duk_push_number(ctx, 1);
                        duk_push_number(ctx, end - 1);
                        duk_call(ctx, 3);
                    }
                }
                else
                {
                    if (end != in_len)
                    {
                        if (is_string)
                        {
                            duk_push_lstring(ctx, in, end);
                        }
                        else
                        {
                            duk_push_number(ctx, 0);
                            duk_push_number(ctx, end);
                            duk_call(ctx, 3);
                        }
                    }
                }
                return 1;
            }
        }

        // Handle quoted strings with escape sequences.
        uint8_t *buf = 0;
        size_t buf_len = 0;
        size_t buf_cap = 0;
        const uint8_t *in0 = in;
        size_t in0_len = in_len;
        in++; // skip starting quote
        in_len--;
        if (unescape)
        {
            buf_cap = 3 * end / 2;
            buf = duk_push_fixed_buffer(ctx, buf_cap);
        }
        duk_bool_t multibyte;
        size_t rem;
        ppp_utf8_rune_t r;
        while (in_len > 0 && in[0] != quote)
        {
            if (in[0] == '\n')
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
                duk_throw(ctx);
            }
            // Process the next character,
            // rejecting any unescaped newline characters which are invalid.
            if (_unquote_char_impl(
                    in, in_len,
                    quote,
                    &r, &multibyte, &rem))
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
                duk_throw(ctx);
            }
            in += rem;
            in_len -= rem;

            // Append the character if unescaping the input.
            if (unescape)
            {
                if (r < PPP_UTF8_RUNE_SELF || !multibyte)
                {
                    buf = appendByte(ctx, buf, &buf_len, &buf_cap, r);
                }
                else
                {
                    uint8_t arr[4] = {0};
                    int n = ppp_utf8_encode(arr, 4, r);
                    buf = appendBytes(ctx, buf, &buf_len, &buf_cap, arr, n);
                }
            }

            // Single quoted strings must be a single character.
            if (quote == '\'')
            {
                break;
            }
        }

        // Verify that the string ends with a terminating quote.
        if (!(in_len > 0 && in[0] == quote))
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
            duk_throw(ctx);
        }
        in++; // skip terminating quote
        in_len--;
        if (unescape)
        {
            if (is_string)
            {
                duk_push_lstring(ctx, buf, buf_len);
            }
            else
            {
                duk_swap_top(ctx, -2);
                duk_pop(ctx);

                duk_push_number(ctx, 0);
                duk_push_number(ctx, buf_len);
                duk_call(ctx, 3);
            }
            return 1;
        }
        if (is_string)
        {
            duk_push_lstring(ctx, in0, in0_len - in_len);
        }
        else
        {
            duk_pop(ctx);

            duk_push_number(ctx, 0);
            duk_push_number(ctx, in0_len - in_len);
            duk_call(ctx, 3);
        }
    }
    break;
    default:
        duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t unquoteChar(duk_context *ctx)
{
    uint8_t quote = duk_require_number(ctx, 2);
    duk_bool_t is_string = duk_is_string(ctx, 0);
    const uint8_t *s;
    size_t s_len;
    if (is_string)
    {
        s = duk_require_lstring(ctx, 1, &s_len);
        duk_swap_top(ctx, 0);
        duk_pop_2(ctx);
    }
    else
    {
        s = duk_require_buffer_data(ctx, 1, &s_len);
        duk_pop(ctx);
    }
    ppp_utf8_rune_t r;
    duk_bool_t multibyte;
    size_t tail;
    if (_unquote_char_impl(
            s, s_len,
            quote,
            &r, &multibyte, &tail))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "invalid syntax");
        duk_throw(ctx);
    }
    if (is_string)
    {
        if (tail == s_len)
        {
            duk_push_object(ctx);
            duk_swap_top(ctx, -2);
        }
        else
        {
            duk_pop(ctx);
            duk_push_object(ctx);
            duk_push_lstring(ctx, s + tail, s_len - tail);
        }
    }
    else
    {
        if (tail == s_len)
        {
            duk_push_object(ctx);
            duk_swap_top(ctx, -3);
            duk_pop(ctx);
        }
        else
        {
            duk_push_number(ctx, tail);
            duk_call(ctx, 2);
            duk_push_object(ctx);
            duk_swap_top(ctx, -2);
        }
    }
    duk_put_prop_lstring(ctx, -2, "tail", 4);
    duk_push_number(ctx, r);
    duk_put_prop_lstring(ctx, -2, "value", 5);
    if (multibyte)
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    duk_put_prop_lstring(ctx, -2, "multibyte", 9);
    return 1;
}
static duk_ret_t unquote(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s;
    duk_bool_t is_string = duk_is_string(ctx, 1);
    duk_bool_t unescape = duk_require_boolean(ctx, 2);
    if (is_string)
    {
        s = duk_require_lstring(ctx, 1, &s_len);
        duk_pop_3(ctx);
    }
    else
    {
        s = duk_require_buffer_data(ctx, 1, &s_len);
        duk_pop(ctx);
    }

    return _unquote(ctx, is_string, s, s_len, unescape);
}
EJS_SHARED_MODULE__DECLARE(strconv)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_strconv_min_js, js_ejs_js_strconv_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {

        duk_push_number(ctx, PPP_STRCONV_MIN_BASE);
        duk_put_prop_lstring(ctx, -2, "minBase", 7);
        duk_push_number(ctx, PPP_STRCONV_MAX_BASE);
        duk_put_prop_lstring(ctx, -2, "maxBase", 7);

        duk_push_number(ctx, EJS_STRCONV_ERROR_NUM);
        duk_put_prop_lstring(ctx, -2, "ErrNum", 6);
        duk_push_number(ctx, EJS_STRCONV_ERROR_SYNTAX);
        duk_put_prop_lstring(ctx, -2, "ErrSyntax", 9);
        duk_push_number(ctx, EJS_STRCONV_ERROR_RANGE);
        duk_put_prop_lstring(ctx, -2, "ErrRange", 8);
        duk_push_number(ctx, EJS_STRCONV_ERROR_BASE);
        duk_put_prop_lstring(ctx, -2, "ErrBase", 7);
        duk_push_number(ctx, EJS_STRCONV_ERROR_BIT_SIZE);
        duk_put_prop_lstring(ctx, -2, "ErrBitSize", 10);

        duk_push_c_lightfunc(ctx, toString, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "toString", 8);
        duk_push_c_lightfunc(ctx, toBuffer, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "toBuffer", 8);

        duk_push_c_lightfunc(ctx, __ejs__modules_append_value, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "append", 6);

        duk_push_c_lightfunc(ctx, __ejs__unicode_utf8__append_rune, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "appendRune", 10);

        duk_push_c_lightfunc(ctx, appendBool, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "appendBool", 10);
        duk_push_c_lightfunc(ctx, parseBool, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "parseBool", 9);

        duk_push_c_lightfunc(ctx, formatUint, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "formatUint", 10);
        duk_push_c_lightfunc(ctx, formatInt, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "formatInt", 9);
        duk_push_c_lightfunc(ctx, appendUint, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "appendUint", 10);
        duk_push_c_lightfunc(ctx, appendInt, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "appendInt", 9);

        duk_push_c_lightfunc(ctx, parseInt, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "parseInt", 8);
        duk_push_c_lightfunc(ctx, parseUint, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "parseUint", 9);
        duk_push_c_lightfunc(ctx, fast_atoi, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "fast_atoi", 9);
        duk_push_c_lightfunc(ctx, isGraphic, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "isGraphic", 9);
        duk_push_c_lightfunc(ctx, isPrint, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "isPrint", 7);
        duk_push_c_lightfunc(ctx, canBackquote, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "canBackquote", 12);

        duk_push_c_lightfunc(ctx, _len, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "len", 3);
        duk_push_c_lightfunc(ctx, appendQuotedWith, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "appendQuotedWith", 16);
        duk_push_c_lightfunc(ctx, appendQuotedRuneWith, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "appendQuotedRuneWith", 20);
        duk_push_c_lightfunc(ctx, unquote, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "unquote", 7);
        duk_push_c_lightfunc(ctx, unquoteChar, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "unquoteChar", 11);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */

    duk_call(ctx, 3);
    return 0;
}