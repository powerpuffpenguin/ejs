#include "net_url.h"
#include "../js/net_url.h"

static char *upperhex = EJS_SHARED_UPPER_HEX_DIGIT;

static duk_bool_t _should_escape(const char c, duk_uint8_t mode)
{
    // §2.3 Unreserved characters (alphanum)
    if ('a' <= c && c <= 'z' || 'A' <= c && c <= 'Z' || '0' <= c && c <= '9')
    {
        return 0;
    }

    if (mode == EJS_NET_URL_encodeHost || mode == EJS_NET_URL_encodeZone)
    {
        // §3.2.2 Host allows
        //	sub-delims = "!" / "$" / "&" / "'" / "(" / ")" / "*" / "+" / "," / ";" / "="
        // as part of reg-name.
        // We add : because we include :port as part of host.
        // We add [ ] because we include [ipv6]:port as part of host.
        // We add < > because they're the only characters left that
        // we could possibly allow, and Parse will reject them if we
        // escape them (because hosts can't use %-encoding for
        // ASCII bytes).
        switch (c)
        {
        case '!':
        case '$':
        case '&':
        case '\'':
        case '(':
        case ')':
        case '*':
        case '+':
        case ',':
        case ';':
        case '=':
        case ':':
        case '[':
        case ']':
        case '<':
        case '>':
        case '"':
            return 0;
        }
    }

    switch (c)
    {
    case '-':
    case '_':
    case '.':
    case '~': // §2.3 Unreserved characters (mark)
        return 0;

    case '$':
    case '&':
    case '+':
    case ',':
    case '/':
    case ':':
    case ';':
    case '=':
    case '?':
    case '@': // §2.2 Reserved characters (reserved)
        // Different sections of the URL allow a few of
        // the reserved characters to appear unescaped.
        switch (mode)
        {
        case EJS_NET_URL_encodePath: // §3.3
            // The RFC allows : @ & = + $ but saves / ; , for assigning
            // meaning to individual path segments. This package
            // only manipulates the path as a whole, so we allow those
            // last three as well. That leaves only ? to escape.
            return c == '?' ? 1 : 0;

        case EJS_NET_URL_encodePathSegment: // §3.3
            // The RFC allows : @ & = + $ but saves / ; , for assigning
            // meaning to individual path segments.
            return (c == '/' || c == ';' || c == ',' || c == '?') ? 1 : 0;

        case EJS_NET_URL_encodeUserPassword: // §3.2.1
            // The RFC allows ';', ':', '&', '=', '+', '$', and ',' in
            // userinfo, so we must escape only '@', '/', and '?'.
            // The parsing of userinfo treats ':' as special so we must escape
            // that too.
            return (c == '@' || c == '/' || c == '?' || c == ':') ? 1 : 0;

        case EJS_NET_URL_encodeQueryComponent: // §3.4
            // The RFC reserves (so we must escape) everything.
            return 1;

        case EJS_NET_URL_encodeFragment: // §4.1
            // The RFC text is silent but the grammar allows
            // everything, so escape nothing.
            return 0;
        }
    }

    if (mode == EJS_NET_URL_encodeFragment)
    {
        // RFC 3986 §2.2 allows not escaping sub-delims. A subset of sub-delims are
        // included in reserved from RFC 2396 §2.2. The remaining sub-delims do not
        // need to be escaped. To minimize potential breakage, we apply two restrictions:
        // (1) we always escape sub-delims outside of the fragment, and (2) we always
        // escape single quote to avoid breaking callers that had previously assumed that
        // single quotes would be escaped. See issue #19917.
        switch (c)
        {
        case '!':
        case '(':
        case ')':
        case '*':
            return 0;
        }
    }

    // Everything else must be escaped.
    return 1;
}
typedef struct
{
    const uint8_t *s;
    duk_size_t s_len;
    duk_size_t hexCount;
    duk_uint8_t mode;
} _escape_hex_args_t;

static void _escape_hex(duk_context *ctx, _escape_hex_args_t *args, uint8_t *t, duk_size_t t_len)
{
    if (args->hexCount == 0)
    {
        memcpy(t, args->s, args->s_len);
        for (duk_size_t i = 0; i < args->s_len; i++)
        {
            if (args->s[i] == ' ')
            {
                t[i] = '+';
            }
        }
    }
    else
    {
        duk_size_t j = 0;
        uint8_t c;
        for (duk_size_t i = 0; i < args->s_len; i++)
        {
            c = args->s[i];
            if (c == ' ' && args->mode == EJS_NET_URL_encodeQueryComponent)
            {
                t[j] = '+';
                j++;
            }
            else if (_should_escape(c, args->mode))
            {
                t[j] = '%';
                t[j + 1] = upperhex[c >> 4];
                t[j + 2] = upperhex[c & 15];
                j += 3;
            }
            else
            {
                t[j] = c;
                j++;
            }
        }
    }
    duk_push_lstring(ctx, t, t_len);
}
typedef struct
{
    _escape_hex_args_t *args;
    uint8_t *t;
    duk_size_t t_len;
} _escape_args_t;
static duk_ret_t _escape_impl(duk_context *ctx)
{
    _escape_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    args->t = malloc(args->t_len);
    if (!args->t)
    {
        ejs_throw_os_errno(ctx);
    }
    _escape_hex(ctx, args->args, args->t, args->t_len);
    free(args->t);
    args->t = 0;
    return 1;
}
static duk_ret_t _escape(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = duk_require_lstring(ctx, 0, &s_len);
    duk_uint8_t mode = duk_require_uint(ctx, 1);
    duk_pop(ctx);

    duk_size_t spaceCount = 0, hexCount = 0;
    char c;
    for (duk_size_t i = 0; i < s_len; i++)
    {
        c = s[i];
        if (_should_escape(c, mode))
        {
            if (c == ' ' && mode == EJS_NET_URL_encodeQueryComponent)
            {
                spaceCount++;
            }
            else
            {
                hexCount++;
            }
        }
    }
    if (spaceCount == 0 && hexCount == 0)
    {
        return 1;
    }
    duk_pop(ctx);

    duk_size_t required = s_len + 2 * hexCount;
    _escape_hex_args_t hex_args = {
        .s = s,
        .s_len = s_len,
        .hexCount = hexCount,
        .mode = mode,
    };
    if (required <= 64)
    {
        uint8_t buf[64];
        _escape_hex(ctx, &hex_args, buf, required);
    }
    else
    {
        _escape_args_t args = {
            .args = &hex_args,
            .t = 0,
            .t_len = required,
        };
        if (ejs_pcall_function(ctx, _escape_impl, &args))
        {
            if (args.t)
            {
                free(args.t);
            }
            duk_throw(ctx);
        }
    }
    return 1;
}
typedef struct
{
    const uint8_t *s;
    duk_size_t s_len;
    duk_uint8_t mode;
    duk_size_t n;
    uint8_t *t;
} _unescape_impl_args_t;
static duk_ret_t _unescape_impl(duk_context *ctx)
{
    _unescape_impl_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    args->t = malloc(args->s_len + args->n * 2);
    if (!args->t)
    {
        ejs_throw_os_errno(ctx);
    }
    duk_size_t t_len = 0;
    uint8_t c;
    for (duk_size_t i = 0; i < args->s_len; i++)
    {
        c = args->s[i];
        switch (c)
        {
        case '%':
            args->t[t_len++] = __ejs_modules_shared_unhex(args->s[i + 1], 0) << 4 | __ejs_modules_shared_unhex(args->s[i + 2], 0);
            i += 2;
            break;
        case '+':
            if (args->mode == EJS_NET_URL_encodeQueryComponent)
            {
                args->t[t_len++] = ' ';
            }
            else
            {
                args->t[t_len++] = '+';
            }
            break;
        default:
            args->t[t_len++] = c;
            break;
        }
    }

    duk_push_lstring(ctx, args->t, t_len);
    free(args->t);
    args->t = 0;
    return 1;
}
static duk_ret_t _unescape(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = duk_require_lstring(ctx, 1, &s_len);
    duk_uint8_t mode = duk_require_uint(ctx, 2);
    duk_pop(ctx);

    // Count %, check that they're well-formed.
    duk_size_t n = 0;
    duk_bool_t hasPlus = 0;
    for (duk_size_t i = 0; i < s_len;)
    {
        switch (s[i])
        {
        case '%':
            n++;
            if (i + 2 >= s_len || !__ejs_modules_shared_ishex(s[i + 1]) || !__ejs_modules_shared_ishex(s[i + 2]))
            {
                s += i;
                s_len -= i;
                if (s_len > 3)
                {
                    s_len = 3;
                }
                duk_pop(ctx);
                duk_get_prop_lstring(ctx, 0, "escape", 6);
                duk_push_lstring(ctx, s, s_len);
                duk_new(ctx, 1);
                duk_throw(ctx);
            }
            // Per https://tools.ietf.org/html/rfc3986#page-21
            // in the host component %-encoding can only be used
            // for non-ASCII bytes.
            // But https://tools.ietf.org/html/rfc6874#section-2
            // introduces %25 being allowed to escape a percent sign
            // in IPv6 scoped-address literals. Yay.
            if (mode == EJS_NET_URL_encodeHost &&
                __ejs_modules_shared_unhex(s[i + 1], 0) < 8 &&
                memcmp(s + i, "%25", 3))
            {
                duk_pop(ctx);
                duk_get_prop_lstring(ctx, 0, "escape", 6);
                duk_push_lstring(ctx, s + i, 3);
                duk_new(ctx, 1);
                duk_throw(ctx);
            }
            if (mode == EJS_NET_URL_encodeZone)
            {
                // RFC 6874 says basically "anything goes" for zone identifiers
                // and that even non-ASCII can be redundantly escaped,
                // but it seems prudent to restrict %-escaped bytes here to those
                // that are valid host name bytes in their unescaped form.
                // That is, you can use escaping in the zone identifier but not
                // to introduce bytes you couldn't just write directly.
                // But Windows puts spaces here! Yay.
                uint8_t v = __ejs_modules_shared_unhex(s[i + 1], 0) << 4 | __ejs_modules_shared_unhex(s[i + 2], 0);
                if (memcmp(s + i, "%25", 3) &&
                    v != ' ' &&
                    _should_escape(v, EJS_NET_URL_encodeHost))
                {
                    duk_pop(ctx);
                    duk_get_prop_lstring(ctx, 0, "escape", 6);
                    duk_push_lstring(ctx, s + i, 3);
                    duk_new(ctx, 1);
                    duk_throw(ctx);
                }
            }
            i += 3;
            break;
        case '+':
            hasPlus = mode == EJS_NET_URL_encodeQueryComponent ? 1 : 0;
            i++;
            break;
        default:
            if ((mode == EJS_NET_URL_encodeHost || mode == EJS_NET_URL_encodeZone) &&
                s[i] < 0x80 &&
                _should_escape(s[i], mode))
            {
                duk_pop(ctx);
                duk_get_prop_lstring(ctx, 0, "host", 4);
                duk_push_lstring(ctx, s + i, 1);
                duk_new(ctx, 1);
                duk_throw(ctx);
            }
            i++;
            break;
        }
    }
    if (n == 0 && !hasPlus)
    {
        return 1;
    }

    duk_pop_2(ctx);

    _unescape_impl_args_t args = {
        s : s,
        s_len : s_len,
        mode : mode,
        n : n,
        t : 0,
    };
    if (ejs_pcall_function(ctx, _unescape_impl, &args))
    {
        if (args.t)
        {
            free(args.t);
        }
        duk_throw(ctx);
    }
    return 1;
}

static duk_ret_t join_values_impl(duk_context *ctx)
{
    ppp_c_string_t *s = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    const char *key;
    duk_size_t key_len;
    const char *value;
    duk_size_t value_len;

    while (1)
    {
        duk_dup_top(ctx);
        duk_call(ctx, 0);
        if (duk_is_undefined(ctx, -1))
        {
            break;
        }
        duk_get_prop_index(ctx, -1, 0);
        key = duk_require_lstring(ctx, -1, &key_len);
        duk_pop(ctx);
        duk_get_prop_index(ctx, -1, 1);
        value = duk_require_lstring(ctx, -1, &value_len);
        duk_pop_2(ctx);

        if (s->len)
        {
            if (ppp_c_string_append_char(s, '&'))
            {
                ejs_throw_os_errno(ctx);
            }
        }

        if (ppp_c_string_grow(s, key_len + 1 + value_len))
        {
            ejs_throw_os_errno(ctx);
        }

        ppp_c_string_append_raw(s, key, key_len);
        ppp_c_string_append_char_raw(s, '=');
        ppp_c_string_append_raw(s, value, value_len);
    }

    duk_push_lstring(ctx, s->str, s->len);
    if (s->cap)
    {
        free(s->str);
        s->cap = 0;
    }
    return 1;
}
static duk_ret_t join_values(duk_context *ctx)
{
    ppp_c_string_t s = {0};
    if (ejs_pcall_function_n(ctx, join_values_impl, &s, 2))
    {
        if (s.cap)
        {
            free(s.str);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t _check(duk_context *ctx)
{
    duk_size_t len;
    const uint8_t *s = duk_require_lstring(ctx, 0, &len);
    if (__ejs_modules_shared_strings_contains_ctl(s, len))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "ejs/net/url: invalid control character in URL");
        duk_throw(ctx);
    }
    if (!len && EJS_BOOL_VALUE(ctx, 1))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "empty url");
        duk_throw(ctx);
    }
    return 0;
}
static duk_ret_t getScheme(duk_context *ctx)
{
    duk_size_t len;
    const uint8_t *s = duk_require_lstring(ctx, 0, &len);

    uint8_t c;
    for (size_t i = 0; i < len; i++)
    {
        c = s[i];
        if ('a' <= c && c <= 'z' || 'A' <= c && c <= 'Z')
        {
        }
        else if ('0' <= c && c <= '9' || c == '+' || c == '-' || c == '.')
        {
            if (i == 0)
            {
                break;
            }
        }
        else if (c == ':')
        {
            duk_pop(ctx);
            if (i == 0)
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, "missing protocol scheme");
                duk_throw(ctx);
            }
            duk_push_array(ctx);
            duk_push_lstring(ctx, s, i);
            duk_put_prop_index(ctx, -2, 0);
            duk_push_lstring(ctx, s + i + 1, len - i - 1);
            duk_put_prop_index(ctx, -2, 1);
            return 1;
        }
        else
        {
            break;
        }
    }
    duk_push_array(ctx);
    duk_push_lstring(ctx, "", 0);
    duk_put_prop_index(ctx, -2, 0);
    duk_swap_top(ctx, -2);
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}
static duk_ret_t validUserinfo(duk_context *ctx)
{
    duk_size_t s_len;
    const char *s = duk_require_lstring(ctx, 0, &s_len);

    char r;
    for (duk_size_t i = 0; i < s_len; i++)
    {
        r = s[i];
        if ('A' <= r && r <= 'Z')
        {
            continue;
        }
        if ('a' <= r && r <= 'z')
        {
            continue;
        }
        if ('0' <= r && r <= '9')
        {
            continue;
        }
        switch (r)
        {
        case '-':
        case '.':
        case '_':
        case ':':
        case '~':
        case '!':
        case '$':
        case '&':
        case '\'':
        case '(':
        case ')':
        case '*':
        case '+':
        case ',':
        case ';':
        case '=':
        case '%':
        case '@':
            break;
        default:
            duk_pop(ctx);
            duk_push_false(ctx);
            return 1;
        }
    }
    duk_pop(ctx);
    duk_push_true(ctx);
    return 1;
}
static duk_ret_t validOptionalPort(duk_context *ctx)
{
    duk_size_t s_len;
    const char *s = duk_require_lstring(ctx, 0, &s_len);
    if (s_len == 0)
    {
        duk_push_true(ctx);
        return 1;
    }
    if (s[0] != ':')
    {
        duk_push_false(ctx);
        return 1;
    }
    for (size_t i = 1; i < s_len; i++)
    {
        if (s[i] < '0' || s[i] > '9')
        {
            duk_push_false(ctx);
            return 1;
        }
    }
    duk_push_true(ctx);
    return 1;
}
static duk_ret_t validEncoded(duk_context *ctx)
{
    duk_size_t s_len;
    const char *s = duk_require_lstring(ctx, 0, &s_len);
    duk_uint8_t mode = duk_require_number(ctx, 1);
    char c;
    for (duk_size_t i = 0; i < s_len; i++)
    {
        c = s[i];
        switch (c)
        {
        case '!':
        case '$':
        case '&':
        case '\'':
        case '(':
        case ')':
        case '*':
        case '+':
        case ',':
        case ';':
        case '=':
        case ':':
        case '@':
            // ok
            break;
        case '[':
        case ']':
            // ok - not specified in RFC 3986 but left alone by modern browsers
            break;
        case '%':
            // ok - percent encoded, will decode
            break;
        default:
            if (_should_escape(c, mode))
            {
                duk_pop_2(ctx);
                duk_push_false(ctx);
                return 1;
            }
            break;
        }
    }
    duk_pop_2(ctx);
    duk_push_true(ctx);
    return 1;
}
typedef struct
{
    const uint8_t *full;
    duk_size_t full_len;
    ppp_c_string_t dst;
} resolvePath_args_t;
static duk_ret_t resolvePath_impl(duk_context *ctx)
{
    resolvePath_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    ppp_c_fast_string_t elem = {0};
    duk_bool_t first = 1;
    ppp_c_fast_string_t remaining = {
        .str = args->full,
        .len = args->full_len,
    };
    // We want to return a leading '/', so write it now.
    ppp_c_string_t *dst = &args->dst;
    dst->str = "/";
    dst->len = 1;
    size_t found = 0;

    size_t index;
    const uint8_t *str;
    size_t str_len;
    while (found != -1)
    {
        found = ppp_c_stirng_first_char_raw(remaining.str, remaining.len, '/');
        if (found == -1)
        {
            elem = remaining;
            remaining.len = 0;
        }
        else
        {
            elem.str = remaining.str;
            elem.len = found;
            index = found + 1;
            remaining.str = remaining.str + index;
            remaining.len -= index;
        }
        if (elem.len == 1 && elem.str[0] == '.')
        {
            first = 0;
            // drop
            continue;
        }

        if (elem.len == 2 && !memcmp(elem.str, "..", 2))
        {

            // Ignore the leading '/' we already wrote.
            str = dst->str + 1;
            str_len = dst->len - 1;
            index = ppp_c_stirng_last_char_raw(str, str_len, '/');
            if (dst->str[0] != '/')
            {
                dst->str[0] = '/';
            }
            if (index == -1)
            {
                first = 1;
                dst->len = 1;
            }
            else
            {
                dst->len = index + 1;
            }
        }
        else
        {
            if (!first)
            {
                if (ppp_c_string_append_char(dst, '/'))
                {
                    ejs_throw_os_errno(ctx);
                }
            }
            if (ppp_c_string_append(dst, elem.str, elem.len))
            {
                ejs_throw_os_errno(ctx);
            }
            first = 0;
        }
    }
    if ((elem.len == 1 && elem.str[0] == '.') ||
        (elem.len == 2 && !memcmp(elem.str, "..", 2)))
    {
        if (ppp_c_string_append_char(dst, '/'))
        {
            ejs_throw_os_errno(ctx);
        }
    }
    if (dst->len > 1 && dst->str[1] == '/')
    {
        duk_push_lstring(ctx, dst->str + 1, dst->len - 1);
    }
    else
    {
        duk_push_lstring(ctx, dst->str, dst->len);
    }
    return 1;
}
static duk_ret_t resolvePath(duk_context *ctx)
{
    resolvePath_args_t args = {0};
    args.full = duk_require_lstring(ctx, 0, &args.full_len);
    duk_pop(ctx);

    duk_int_t err = ejs_pcall_function(ctx, resolvePath_impl, &args);
    if (args.dst.cap)
    {
        free(args.dst.str);
    }
    if (err)
    {
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t shouldEscape(duk_context *ctx)
{
    const char c = duk_require_number(ctx, 0);
    duk_uint8_t mode = duk_require_number(ctx, 1);
    duk_pop_2(ctx);

    duk_bool_t ok = _should_escape(c, mode);
    if (ok)
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
EJS_SHARED_MODULE__DECLARE(net_url)
{
    duk_eval_lstring(ctx, js_ejs_js_net_url_min_js, js_ejs_js_net_url_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_uint(ctx, EJS_NET_URL_encodePath);
        duk_put_prop_lstring(ctx, -2, "encodePath", 10);
        duk_push_uint(ctx, EJS_NET_URL_encodePathSegment);
        duk_put_prop_lstring(ctx, -2, "encodePathSegment", 17);
        duk_push_uint(ctx, EJS_NET_URL_encodeHost);
        duk_put_prop_lstring(ctx, -2, "encodeHost", 10);
        duk_push_uint(ctx, EJS_NET_URL_encodeZone);
        duk_put_prop_lstring(ctx, -2, "encodeZone", 10);
        duk_push_uint(ctx, EJS_NET_URL_encodeUserPassword);
        duk_put_prop_lstring(ctx, -2, "encodeUserPassword", 18);
        duk_push_uint(ctx, EJS_NET_URL_encodeQueryComponent);
        duk_put_prop_lstring(ctx, -2, "encodeQueryComponent", 20);
        duk_push_uint(ctx, EJS_NET_URL_encodeFragment);
        duk_put_prop_lstring(ctx, -2, "encodeFragment", 14);

        duk_push_c_lightfunc(ctx, _escape, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "escape", 6);
        duk_push_c_lightfunc(ctx, _unescape, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "unescape", 8);

        duk_push_c_lightfunc(ctx, join_values, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "join_values", 11);

        duk_push_c_lightfunc(ctx, _check, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "check", 5);
        duk_push_c_lightfunc(ctx, getScheme, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "getScheme", 9);

        duk_push_c_lightfunc(ctx, validUserinfo, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "validUserinfo", 13);
        duk_push_c_lightfunc(ctx, validOptionalPort, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "validOptionalPort", 17);
        duk_push_c_lightfunc(ctx, validEncoded, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "validEncoded", 12);
        duk_push_c_lightfunc(ctx, resolvePath, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "resolvePath", 11);
    }
    duk_call(ctx, 3);

    {
        duk_push_uint(ctx, EJS_NET_URL_encodePath);
        duk_put_prop_lstring(ctx, -2, "encodePath", 10);
        duk_push_uint(ctx, EJS_NET_URL_encodePathSegment);
        duk_put_prop_lstring(ctx, -2, "encodePathSegment", 17);
        duk_push_uint(ctx, EJS_NET_URL_encodeHost);
        duk_put_prop_lstring(ctx, -2, "encodeHost", 10);
        duk_push_uint(ctx, EJS_NET_URL_encodeZone);
        duk_put_prop_lstring(ctx, -2, "encodeZone", 10);
        duk_push_uint(ctx, EJS_NET_URL_encodeUserPassword);
        duk_put_prop_lstring(ctx, -2, "encodeUserPassword", 18);
        duk_push_uint(ctx, EJS_NET_URL_encodeQueryComponent);
        duk_put_prop_lstring(ctx, -2, "encodeQueryComponent", 20);
        duk_push_uint(ctx, EJS_NET_URL_encodeFragment);
        duk_put_prop_lstring(ctx, -2, "encodeFragment", 14);
        duk_push_c_lightfunc(ctx, shouldEscape, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "shouldEscape", 12);
    }
    return 0;
}