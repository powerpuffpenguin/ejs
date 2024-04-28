#include "_duk_net.h"
#include "defines.h"
#include "stash.h"
#include "duk.h"
#include "js/net.h"
#include "_duk_helper.h"

static int ubtoa(uint8_t *dst, int start, uint8_t v)
{
    if (v < 10)
    {
        dst[start] = v + '0';
        return 1;
    }
    else if (v < 100)
    {
        dst[start + 1] = v % 10 + '0';
        dst[start] = v / 10 + '0';
        return 2;
    }

    dst[start + 2] = v % 10 + '0';
    dst[start + 1] = (v / 10) % 10 + '0';
    dst[start] = v / 100 + '0';
    return 3;
}
// (ip:Uint8Array)=>string
static duk_ret_t ipv4_string(duk_context *ctx)
{
    duk_size_t len;
    const uint8_t *p4 = duk_require_buffer_data(ctx, 0, &len);

    uint8_t *b = duk_push_fixed_buffer(ctx, 15);
    int n = ubtoa(b, 0, p4[0]);
    b[n] = '.';
    n++;

    n += ubtoa(b, n, p4[1]);
    b[n] = '.';
    n++;

    n += ubtoa(b, n, p4[2]);
    b[n] = '.';
    n++;

    n += ubtoa(b, n, p4[3]);

    duk_buffer_to_string(ctx, -1);
    return 1;
}

// (ip:Uint8Array)=>string
static duk_ret_t ipv6_string(duk_context *ctx)
{
    duk_size_t len;
    const uint8_t *p = duk_require_buffer_data(ctx, 0, &len);

    // Find longest run of zeros.
    int e0 = -1;
    int e1 = -1;
    int j;
    for (int i = 0; i < IPv6len; i += 2)
    {
        j = i;
        while (j < IPv6len && p[j] == 0 && p[j + 1] == 0)
        {
            j += 2;
        }
        if (j > i && j - i > e1 - e0)
        {
            e0 = i;
            e1 = j;
            i = j;
        }
    }
    // The symbol "::" MUST NOT be used to shorten just one 16 bit 0 field.
    if (e1 - e0 <= 2)
    {
        e0 = -1;
        e1 = -1;
    }
    uint8_t *b = duk_push_dynamic_buffer(ctx, 39);
    // Print with possible :: in place of run of zeros
    duk_size_t n = 0;
    for (int i = 0; i < IPv6len; i += 2)
    {
        if (i == e0)
        {
            b[n++] = ':';
            b[n++] = ':';
            i = e1;
            if (i >= IPv6len)
            {
                break;
            }
        }
        else if (i > 0)
        {
            b[n++] = ':';
        }
        // b = appendHex(b, (uint32(p[i])<<8)|uint32(p[i+1]))
        uint32_t val = ((uint32_t)p[i] << 8) | p[i + 1];
        if (val == 0)
        {
            b[n++] = '0';
        }
        else
        {
            char *hexDigit = EJS_HEX_DIGIT;
            uint32_t v;
            for (int j = 7; j >= 0; j--)
            {
                v = val >> j * 4;
                if (v > 0)
                {
                    b[n++] = hexDigit[v & 0xf];
                }
            }
        }
    }
    if (n != IPv6len)
    {
        duk_resize_buffer(ctx, -1, n);
    }
    duk_buffer_to_string(ctx, -1);
    return 1;
}

// Decimal to integer.
// Returns number, characters consumed, success.
static BOOL dtoi(const uint8_t *s, const duk_size_t len, int *out_n, int *out_i)
{
    int n = 0;
    int i;
    for (i = 0; i < len && '0' <= s[i] && s[i] <= '9'; i++)
    {
        n = n * 10 + (int)(s[i] - '0');
        if (n >= 0xFFFFFF)
        {
            *out_n = 0xFFFFFF;
            *out_i = i;
            return FALSE;
        }
    }
    if (!i)
    {
        *out_n = 0;
        *out_i = 0;
        return FALSE;
    }

    *out_n = n;
    *out_i = i;
    return TRUE;
}
// Hexadecimal to integer.
// Returns number, characters consumed, success.
static BOOL xtoi(const uint8_t *s, const duk_size_t len, int *out_n, int *out_i)
{
    int n = 0;
    int i;
    for (i = 0; i < len; i++)
    {
        if ('0' <= s[i] && s[i] <= '9')
        {
            n *= 16;
            n += (int)(s[i] - '0');
        }
        else if ('a' <= s[i] && s[i] <= 'f')
        {
            n *= 16;
            n += (int)(s[i] - 'a') + 10;
        }
        else if ('A' <= s[i] && s[i] <= 'F')
        {
            n *= 16;
            n += (int)(s[i] - 'A') + 10;
        }
        else
        {
            break;
        }
        if (n >= 0xFFFFFF)
        {
            *out_n = 0;
            *out_i = i;
            return FALSE;
        }
    }
    if (!i)
    {
        *out_n = 0;
        *out_i = i;
        return FALSE;
    }
    *out_n = n;
    *out_i = i;
    return TRUE;
}

static duk_ret_t parse_ipv4(duk_context *ctx, const uint8_t *s, duk_size_t len)
{
    uint8_t *p = duk_push_fixed_buffer(ctx, IPv6len);
    memset(p, 0, IPv6len);
    p[10] = 0xff;
    p[11] = 0xff;
    p += 12;
    int c, n;
    BOOL ok;
    for (int i = 0; i < 4; i++)
    {
        if (!len)
        {
            // Missing octets.
            return 0;
        }
        if (i > 0)
        {
            if (s[0] != '.')
            {
                return 0;
            }
            s++;
            len--;
        }
        // n, c, ok := dtoi(s)
        ok = dtoi(s, len, &n, &c);
        if (!ok || n > 0xFF)
        {
            return 0;
        }
        if (c > 1 && s[0] == '0')
        {
            // Reject non-zero components with leading zeroes.
            return 0;
        }
        s += c;
        len -= c;
        p[i] = (uint8_t)n;
    }
    if (len)
    {
        return 0;
    }
    return 1;
}
static duk_ret_t parse_ipv6(duk_context *ctx, const uint8_t *s, duk_size_t len)
{
    uint8_t *ip = duk_push_fixed_buffer(ctx, IPv6len);
    memset(ip, 0, IPv6len);
    int ellipsis = -1; // position of ellipsis in ip

    // Might have leading ellipsis
    if (len >= 2 && s[0] == ':' && s[1] == ':')
    {
        ellipsis = 0;
        s += 2;
        len -= 2;
        // Might be only ellipsis
        if (!len)
        {
            return 1;
        }
    }

    // Loop, parsing hex numbers followed by colon.
    int i = 0;
    int n, c;
    BOOL ok;
    while (i < IPv6len)
    {
        // Hex number.
        ok = xtoi(s, len, &n, &c);
        if (!ok || n > 0xFFFF)
        {
            return 0;
        }

        // If followed by dot, might be in trailing IPv4.
        if (c < len && s[c] == '.')
        {
            if (ellipsis < 0 && i != IPv6len - IPv4len)
            {
                // Not the right place.
                return 0;
            }
            if (i + IPv4len > IPv6len)
            {
                // Not enough room.
                return 0;
            }
            if (!parse_ipv4(ctx, s, len))
            {
                return 0;
            }
            uint8_t *ip4 = duk_require_buffer_data(ctx, -1, NULL);
            ip[i] = ip4[12];
            ip[i + 1] = ip4[13];
            ip[i + 2] = ip4[14];
            ip[i + 3] = ip4[15];
            duk_pop(ctx);
            s = "";
            len = 0;
            i += IPv4len;
            break;
        }

        // Save this 16-bit chunk.
        ip[i] = n >> 8;
        ip[i + 1] = n;
        i += 2;

        // Stop at end of string.
        s += c;
        len -= c;
        if (!len)
        {
            break;
        }

        // Otherwise must be followed by colon and more.
        if (s[0] != ':' || len == 1)
        {
            return 0;
        }
        s += 1;
        len--;

        // Look for ellipsis.
        if (s[0] == ':')
        {
            if (ellipsis >= 0)
            { // already have one
                return 0;
            }
            ellipsis = i;
            s += 1;
            len--;
            if (!len)
            { // can be at end
                break;
            }
        }
    }
    // Must have used entire string.
    if (len)
    {
        return 0;
    }

    // If didn't parse enough, expand ellipsis.
    if (i < IPv6len)
    {
        if (ellipsis < 0)
        {
            return 0;
        }
        n = IPv6len - i;
        int j;
        for (j = i - 1; j >= ellipsis; j--)
        {
            ip[j + n] = ip[j];
        }
        for (j = ellipsis + n - 1; j >= ellipsis; j--)
        {
            ip[j] = 0;
        }
    }
    else if (ellipsis >= 0)
    {
        // Ellipsis must represent at least one 0 group.
        return 0;
    }
    return 1;
}
// (s:string)=>Uint8Array
static duk_ret_t parse_ip(duk_context *ctx)
{
    duk_size_t len;
    const uint8_t *s = duk_require_lstring(ctx, 0, &len);
    for (duk_size_t i = 0; i < len; i++)
    {
        switch (s[i])
        {
        case '.':
            return parse_ipv4(ctx, s, len);
        case ':':
            return parse_ipv6(ctx, s, len);
        }
    }
    return 0;
}
duk_ret_t _ejs_native_net_init(duk_context *ctx)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_net_min_js, js_ejs_js_net_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, _ejs_helper_bytes_equal, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "eq", 2);
        duk_push_c_lightfunc(ctx, _ejs_helper_hex_string, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "hex_string", 10);
        duk_push_c_lightfunc(ctx, ipv4_string, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "ipv4_string", 11);
        duk_push_c_lightfunc(ctx, ipv6_string, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "ipv6_string", 11);
        duk_push_c_lightfunc(ctx, parse_ip, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "parse_ip", 8);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);
    return 0;
}