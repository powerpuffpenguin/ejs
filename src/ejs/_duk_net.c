#include "_duk_net.h"
#include "defines.h"
#include "stash.h"
#include "duk.h"
#include "js/net.h"
#include "_duk_helper.h"
static uint8_t v4InV6Prefix[12] = {0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0xff, 0xff};

static duk_ret_t ip_equal(duk_context *ctx)
{
    duk_size_t a_len;
    uint8_t *a = duk_require_buffer_data(ctx, 0, &a_len);
    duk_size_t b_len;
    uint8_t *b = duk_require_buffer_data(ctx, 1, &b_len);
    if (a_len != b_len)
    {
        if (a_len == IPv4len && b_len == IPv6len)
        {
            if (memcmp(b, v4InV6Prefix, 12))
            {
                duk_push_false(ctx);
                return 1;
            }
            b += 12;
        }
        else if (a_len == IPv6len && b_len == IPv4len)
        {
            if (memcmp(a, v4InV6Prefix, 12))
            {
                duk_push_false(ctx);
                return 1;
            }
            a += 12;
            a_len -= 12;
        }
        else
        {
            duk_push_false(ctx);
            return 1;
        }
    }
    if (memcmp(a, b, a_len))
    {
        duk_push_false(ctx);
    }
    else
    {
        duk_push_true(ctx);
    }
    return 1;
}
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
static duk_ret_t c_ipv4_string(duk_context *ctx, const uint8_t *p4)
{
    uint8_t *b = duk_push_dynamic_buffer(ctx, 15);
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
    if (n != 15)
    {
        duk_resize_buffer(ctx, -1, n);
    }
    duk_buffer_to_string(ctx, -1);
    return 1;
}

static duk_ret_t c_ipv6_string(duk_context *ctx, const uint8_t *p)
{
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
    if (n != 39)
    {
        duk_resize_buffer(ctx, -1, n);
    }
    duk_buffer_to_string(ctx, -1);
    return 1;
}

static duk_ret_t c_ip_string(duk_context *ctx, const uint8_t *p, duk_size_t len)
{
    switch (len)
    {
    case 0:
        duk_push_lstring(ctx, "<undefined>", 11);
        break;
    case IPv6len:
        if (memcmp(p, v4InV6Prefix, 12))
        {
            return c_ipv6_string(ctx, p);
        }
        else
        {
            return c_ipv4_string(ctx, p + 12);
        }
    case IPv4len:
        return c_ipv4_string(ctx, p);
    default:
        duk_push_lstring(ctx, "?", 1);
        _ejs_helper_c_hex_string(ctx, p, len);
        duk_concat(ctx, 2);
        break;
    }
    return 1;
}
// (ip:Uint8Array)=>string
static duk_ret_t ip_string(duk_context *ctx)
{
    duk_size_t len;
    const uint8_t *p = duk_require_buffer_data(ctx, 0, &len);
    return c_ip_string(ctx, p, len);
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
// (s:string)=>Uint8Array|undefined
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
static BOOL allFF(const uint8_t *b, duk_size_t len)
{
    for (duk_size_t i = 0; i < len; i++)
    {
        if (b[i] != 0xff)
        {
            return FALSE;
        }
    }
    return TRUE;
}
static duk_ret_t ip_4in6(duk_context *ctx)
{
    duk_size_t len;
    uint8_t *b = duk_require_buffer_data(ctx, 0, &len);
    if (len == IPv6len && !memcmp(b, v4InV6Prefix, 12))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
static duk_ret_t ip_mask(duk_context *ctx)
{
    duk_size_t mask_len;
    uint8_t *mask = duk_require_buffer_data(ctx, 0, &mask_len);
    duk_size_t ip_len;
    uint8_t *ip = duk_require_buffer_data(ctx, 1, &ip_len);
    if (mask_len == IPv6len && ip_len == IPv4len && allFF(mask, 12))
    {
        mask += 12;
        mask_len -= 12;
    }
    if (mask_len == IPv4len && ip_len == IPv6len)
    {

        if (!memcmp(ip, v4InV6Prefix, 12))
        {
            ip += 12;
            ip_len -= 12;
        }
    }

    if (ip_len != mask_len)
    {
        return 0;
    }
    uint8_t *out = duk_push_fixed_buffer(ctx, ip_len);
    for (duk_size_t i = 0; i < ip_len; i++)
    {
        out[i] = ip[i] & mask[i];
    }
    return 1;
}
static duk_ret_t c_cidr_mask(duk_context *ctx, duk_int_t ones, duk_int_t bits)
{
    if (bits != 8 * IPv4len && bits != 8 * IPv6len)
    {
        return 0;
    }
    if (ones < 0 || ones > bits)
    {
        return 0;
    }
    duk_int_t l = bits / 8;
    uint8_t *m = duk_push_fixed_buffer(ctx, l);
    duk_uint_t n = ones;
    for (duk_int_t i = 0; i < l; i++)
    {
        if (n >= 8)
        {
            m[i] = 0xff;
            n -= 8;
            continue;
        }
        m[i] = ~((uint8_t)(0xff >> n));
        n = 0;
    }
    return 1;
}
// (ones:int, bits:int)=>Uint8Array|undefined
static duk_ret_t cidr_mask(duk_context *ctx)
{
    duk_int_t ones = duk_require_int(ctx, 0);
    duk_int_t bits = duk_require_int(ctx, 1);
    duk_pop_2(ctx);
    return c_cidr_mask(ctx, ones, bits);
}
// If mask is a sequence of 1 bits followed by 0 bits,
// return the number of 1 bits.
static int simpleMaskLength(const uint8_t *mask, duk_size_t len)
{

    int n = 0;
    uint8_t v;
    for (duk_size_t i = 0; i < len; i++)
    {
        v = mask[i];
        if (v == 0xff)
        {
            n += 8;
            continue;
        }
        // found non-ff byte
        // count 1 bits
        while (v & 0x80)
        {
            n++;
            v <<= 1;
        }
        // rest must be 0 bits
        if (v != 0)
        {
            return -1;
        }
        for (i++; i < len; i++)
        {
            if (mask[i] != 0)
            {
                return -1;
            }
        }
        break;
    }
    return n;
}
//(mask: Uint8Array) => [number, number]
static duk_ret_t mask_size(duk_context *ctx)
{
    duk_size_t len;
    uint8_t *m = duk_require_buffer_data(ctx, 0, &len);

    int ones = simpleMaskLength(m, len);

    duk_pop(ctx);
    duk_push_array(ctx);
    if (ones == -1)
    {
        duk_push_int(ctx, 0);
        duk_put_prop_index(ctx, -2, 0);
        duk_push_int(ctx, 0);
        duk_put_prop_index(ctx, -2, 0);
    }
    else
    {
        duk_push_int(ctx, ones);
        duk_put_prop_index(ctx, -2, 0);
        duk_push_int(ctx, len * 8);
        duk_put_prop_index(ctx, -2, 0);
    }
    return 1;
}
static void c_networkNumberAndMask(uint8_t **ipnet, duk_size_t *ipnet_len, uint8_t **mask, duk_size_t *mask_len)
{
    switch (*ipnet_len)
    {
    case IPv4len:
        break;
    case IPv6len:
        if (!memcmp(*ipnet, v4InV6Prefix, 12))
        {
            *ipnet += 12;
            *ipnet_len -= 12;
        }
        break;
    default:
        *ipnet_len = 0;
        *mask_len = 0;
        return;
    }

    switch (*mask_len)
    {
    case IPv4len:
        if (*ipnet_len != IPv4len)
        {
            *ipnet_len = 0;
            *mask_len = 0;
            return;
        }
        break;
    case IPv6len:
        if (*ipnet_len == IPv4len)
        {
            *mask += 12;
            *mask_len -= 12;
        }
        break;
    default:
        *ipnet_len = 0;
        *mask_len = 0;
        return;
    }
}

static duk_ret_t networkNumberAndMask(duk_context *ctx)
{
    duk_size_t ipnet_len;
    uint8_t *ipnet = duk_require_buffer_data(ctx, 0, &ipnet_len);
    duk_size_t mask_len;
    uint8_t *mask = duk_require_buffer_data(ctx, 1, &mask_len);
    c_networkNumberAndMask(&ipnet, &ipnet_len, &mask, &mask_len);
    if (ipnet_len == 0 || mask_len == 0)
    {
        return 0;
    }
    duk_push_array(ctx);
    memmove(duk_push_dynamic_buffer(ctx, ipnet_len), ipnet, ipnet_len);
    duk_put_prop_index(ctx, -2, 0);
    memmove(duk_push_dynamic_buffer(ctx, mask_len), mask, mask_len);
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}

// (net_ip: Uint8Array, mask: Uint8Array, ip: Uint8Array)=> boolean
static duk_ret_t ipnet_contains(duk_context *ctx)
{
    duk_size_t ipnet_len;
    uint8_t *ipnet = duk_require_buffer_data(ctx, 0, &ipnet_len);

    duk_size_t mask_len;
    uint8_t *mask = duk_require_buffer_data(ctx, 1, &mask_len);

    duk_size_t ip_len;
    uint8_t *ip = duk_require_buffer_data(ctx, 2, &ip_len);
    switch (ip_len)
    {
    case IPv4len:
        break;
    case IPv6len:
        if (!memcmp(ipnet, v4InV6Prefix, 12))
        {
            ip += 12;
            ip_len -= 12;
        }
        break;
    default:
        ip_len = 0;
        break;
    }
    c_networkNumberAndMask(&ipnet, &ipnet_len, &mask, &mask_len);
    if (ipnet_len != ip_len)
    {
        duk_push_false(ctx);
        return 1;
    }

    for (duk_size_t i = 0; i < ip_len; i++)
    {
        if ((ipnet[i] & mask[i]) != (ip[i] & mask[i]))
        {
            duk_push_false(ctx);
            return 1;
        }
    }
    duk_push_true(ctx);
    return 1;
}
// (net_ip: Uint8Array, mask: Uint8Array, ip: Uint8Array)=> string
static duk_ret_t ipnet_string(duk_context *ctx)
{
    duk_size_t ipnet_len;
    uint8_t *ipnet = duk_require_buffer_data(ctx, 0, &ipnet_len);

    duk_size_t mask_len;
    uint8_t *mask = duk_require_buffer_data(ctx, 1, &mask_len);
    if (!ipnet_len || !mask_len || (ipnet_len != IPv6len && ipnet_len != IPv4len))
    {
        duk_push_lstring(ctx, "<undefined>", 11);
    }
    else
    {
        int l = simpleMaskLength(mask, mask_len);
        if (ipnet_len == IPv6len)
        {
            if (memcmp(ipnet, v4InV6Prefix, 12))
            {
                c_ipv6_string(ctx, ipnet);
            }
            else
            {
                c_ipv4_string(ctx, ipnet + 12);
            }
        }
        else if (ipnet_len == IPv4len)
        {
            c_ipv4_string(ctx, ipnet);
        }
        duk_push_lstring(ctx, "/", 1);
        if (l == -1)
        {
            _ejs_helper_c_hex_string(ctx, mask, mask_len);
        }
        else
        {
            duk_push_int(ctx, l);
        }
        duk_concat(ctx, 3);
    }
    return 1;
}
static duk_ret_t parse_cidr(duk_context *ctx)
{
    duk_size_t len;
    const uint8_t *s = (const uint8_t *)duk_require_lstring(ctx, 0, &len);
    duk_size_t found = 0;
    for (; found < len; found++)
    {
        if (s[found] == '/')
        {
            break;
        }
    }
    if (found == len)
    {
        return 0;
    }

    const uint8_t *addr = s;
    duk_size_t addr_len = found;
    const uint8_t *mask = s + (found + 1);
    duk_size_t mask_len = len - (found + 1);

    duk_size_t iplen = IPv4len;
    if (!parse_ipv4(ctx, addr, addr_len))
    {
        if (!parse_ipv6(ctx, addr, addr_len))
        {
            return 0;
        }
        iplen = IPv6len;
    }
    int n;
    int i;
    BOOL ok = dtoi(mask, mask_len, &n, &i);
    if (!ok || i != mask_len || n < 0 || n > 8 * iplen)
    {
        return 0;
    }
    duk_ret_t ret = c_cidr_mask(ctx, n, 8 * iplen);
    if (!ret)
    {
        return 0;
    }
    duk_push_object(ctx);
    duk_swap_top(ctx, -3);
    duk_put_prop_lstring(ctx, -3, "ip", 2);
    duk_put_prop_lstring(ctx, -2, "mask", 4);
    return 1;
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

        duk_push_c_lightfunc(ctx, ip_equal, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "ip_equal", 8);
        duk_push_c_lightfunc(ctx, ip_string, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "ip_string", 9);
        duk_push_c_lightfunc(ctx, parse_ip, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "parse_ip", 8);
        duk_push_c_lightfunc(ctx, ip_4in6, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "ip_4in6", 7);
        duk_push_c_lightfunc(ctx, ip_mask, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "ip_mask", 7);

        duk_push_c_lightfunc(ctx, networkNumberAndMask, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "networkNumberAndMask", 20);
        duk_push_c_lightfunc(ctx, cidr_mask, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "cidr_mask", 9);
        duk_push_c_lightfunc(ctx, mask_size, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "mask_size", 9);

        duk_push_c_lightfunc(ctx, ipnet_contains, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "ipnet_contains", 14);
        duk_push_c_lightfunc(ctx, ipnet_string, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "ipnet_string", 12);

        duk_push_c_lightfunc(ctx, parse_cidr, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "parse_cidr", 10);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);
    return 0;
}