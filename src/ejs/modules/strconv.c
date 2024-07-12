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
    uint8_t value = 0;
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
    if (base < PPP_STRCONV_MIN_BASE || base > PPP_STRCONV_MAX_BASE)
    {
        duk_pop_n(ctx, 4);
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "strconv: illegal appendUint base");
        duk_throw(ctx);
    }
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
    if (base < PPP_STRCONV_MIN_BASE || base > PPP_STRCONV_MAX_BASE)
    {
        duk_pop_n(ctx, 4);
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "strconv: illegal appendInt base");
        duk_throw(ctx);
    }
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
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */

    duk_call(ctx, 3);
    return 0;
}