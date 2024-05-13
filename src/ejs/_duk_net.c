#include "_duk_net.h"
#include "defines.h"
#include "stash.h"
#include "duk.h"
#include "js/net.h"
#include "_duk_helper.h"
#include "core.h"
#include <event2/listener.h>
#include <event2/bufferevent.h>
#include <event2/buffer.h>
#include <event2/dns.h>

#ifdef DUK_F_LINUX
#include <sys/socket.h>
#include <sys/un.h>
#endif
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

typedef struct
{
    ejs_core_t *core;
    struct bufferevent *bev;
    short what;
} tcp_connection_event_cb_args;

static duk_ret_t tcp_connection_event_cb_impl(duk_context *ctx)
{
    tcp_connection_event_cb_args *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    if (!ejs_stash_get_pointer(ctx, args->bev, EJS_STASH_NET_TCP_CONN))
    {
        return 0;
    }

    duk_get_prop_lstring(ctx, -1, "cbe", 3);
    if (!duk_is_function(ctx, -1))
    {
        return 0;
    }
    duk_push_uint(ctx, args->what);
    duk_call(ctx, 1);
    return 0;
}
static void tcp_connection_event_cb(struct bufferevent *bev, short what, void *ptr)
{
    tcp_connection_event_cb_args args = {
        .core = ptr,
        .bev = bev,
        .what = what,
    };
    ejs_call_callback_noresult(args.core->duk, tcp_connection_event_cb_impl, &args, NULL);
}
typedef struct
{
    ejs_core_t *core;
    struct bufferevent *bev;
} tcp_connection_cb_args_t;
static duk_ret_t tcp_connection_read_cb_impl(duk_context *ctx)
{
    tcp_connection_cb_args_t *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    if (!ejs_stash_get_pointer(ctx, args->bev, EJS_STASH_NET_TCP_CONN))
    {
        return 0;
    }

    duk_get_prop_lstring(ctx, -1, "cbr", 3);
    if (!duk_is_function(ctx, -1))
    {
        return 0;
    }

    struct evbuffer *buf = bufferevent_get_input(args->bev);
    duk_push_pointer(ctx, buf);
    duk_call(ctx, 1);
    return 0;
}
static void tcp_connection_read_cb(struct bufferevent *bev, void *ptr)
{
    tcp_connection_cb_args_t args = {
        .core = ptr,
        .bev = bev,
    };
    ejs_call_callback_noresult(args.core->duk, tcp_connection_read_cb_impl, &args, NULL);
}

static duk_ret_t tcp_connection_write_cb_impl(duk_context *ctx)
{
    tcp_connection_cb_args_t *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    if (!ejs_stash_get_pointer(ctx, args->bev, EJS_STASH_NET_TCP_CONN))
    {
        return 0;
    }

    duk_get_prop_lstring(ctx, -1, "busy", 4);
    if (!duk_get_boolean_default(ctx, -1, 0))
    {
        return 0;
    }

    duk_get_prop_lstring(ctx, -2, "cbw", 3);
    if (!duk_is_function(ctx, -1))
    {
        return 0;
    }
    duk_call(ctx, 0);
    return 0;
}
static void tcp_connection_write_cb(struct bufferevent *bev, void *ptr)
{
    tcp_connection_cb_args_t args = {
        .core = ptr,
        .bev = bev,
    };
    ejs_call_callback_noresult(args.core->duk, tcp_connection_write_cb_impl, &args, NULL);
}

typedef struct
{
    struct evconnlistener *listener;
} tcp_listen_args_t;
static duk_ret_t evconnlistener_tcp_destroy(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    struct evconnlistener *listener = duk_get_pointer_default(ctx, -1, 0);
    if (listener)
    {
        evconnlistener_free(listener);
    }
    return 0;
}
static duk_ret_t bufferevent_destroy(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    struct bufferevent *bev = duk_get_pointer_default(ctx, -1, 0);
    if (bev)
    {
        bufferevent_free(bev);
    }
    return 0;
}
static void push_tcp_connection(duk_context *ctx, ejs_core_t *core, struct bufferevent *bev)
{
    duk_push_object(ctx);
    duk_push_pointer(ctx, core);
    duk_put_prop_lstring(ctx, -2, "core", 4);
    duk_push_pointer(ctx, bev);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_push_object(ctx);
    {
        duk_push_uint(ctx, 0);
        duk_put_prop_lstring(ctx, -2, "mw", 2);
    }
    duk_put_prop_lstring(ctx, -2, "md", 2);

    duk_push_c_lightfunc(ctx, bufferevent_destroy, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
}
typedef struct
{
    struct evconnlistener *listener;
    ejs_core_t *core;
} evconnlistener_tcp_errorcb_args_t;
static duk_ret_t evconnlistener_tcp_errorcb_impl(duk_context *ctx)
{
    evconnlistener_tcp_errorcb_args_t *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    if (!ejs_stash_get_pointer(ctx, args->listener, EJS_STASH_NET_TCP_LISTENER))
    {
        return 0;
    }

    int err = EVUTIL_SOCKET_ERROR();
    const char *msg = evutil_socket_error_to_string(err);

    duk_get_prop_lstring(ctx, -1, "err", 3);
    duk_push_string(ctx, msg);
    duk_call(ctx, 1);
    return 0;
}
static void evconnlistener_tcp_errorcb(struct evconnlistener *listener, void *ptr)
{
    evconnlistener_tcp_errorcb_args_t args = {
        .core = ptr,
        .listener = listener,
    };
    ejs_call_callback_noresult(args.core->duk, evconnlistener_tcp_errorcb_impl, &args, NULL);
}
typedef struct
{
    struct evconnlistener *listener;
    evutil_socket_t s;
    struct sockaddr *addr;
    int socklen;
    ejs_core_t *core;
    struct bufferevent *bev;

    BOOL free;
} evconnlistener_tcp_cb_args_t;
static void evconnlistener_tcp_cb_args_destroy(void *ptr)
{
    evconnlistener_tcp_cb_args_t *args = ptr;
    if (!args->free)
    {
        if (args->bev)
        {
            bufferevent_free(args->bev);
        }
        else
        {
            evutil_closesocket(args->s);
        }
    }
}
static duk_ret_t evconnlistener_tcp_cb_impl(duk_context *ctx)
{
    evconnlistener_tcp_cb_args_t *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    if (!ejs_stash_get_pointer(ctx, args->listener, EJS_STASH_NET_TCP_LISTENER))
    {
        return 0;
    }
#ifdef DUK_F_LINUX
    duk_bool_t is_unix = 0;
    duk_get_prop_lstring(ctx, -1, "network", 7);
    if (duk_is_string(ctx, -1))
    {
        duk_size_t len;
        const uint8_t *network = duk_get_lstring(ctx, -1, &len);
        if (len = 4 && !memcmp("unix", network, 4))
        {
            is_unix = 1;
        }
    }
    duk_pop(ctx);
#endif
    duk_get_prop_lstring(ctx, -1, "cb", 2);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    args->bev = bufferevent_socket_new(args->core->base, args->s, BEV_OPT_CLOSE_ON_FREE | BEV_OPT_DEFER_CALLBACKS);
    if (!args->bev)
    {
        return 0;
    }
    bufferevent_setcb(args->bev, tcp_connection_read_cb, tcp_connection_write_cb, tcp_connection_event_cb, args->core);
    bufferevent_enable(args->bev, EV_WRITE);

    push_tcp_connection(ctx, args->core, args->bev);
    args->free = TRUE;

#ifdef DUK_F_LINUX
    if (is_unix)
    {
        duk_call(ctx, 1);
        return 0;
    }
#endif

    duk_push_object(ctx);
    if (args->socklen == sizeof(struct sockaddr_in6))
    {
        struct sockaddr_in6 *sin = (struct sockaddr_in6 *)args->addr;
        char ip[40] = {0};
        evutil_inet_ntop(AF_INET6, &sin->sin6_addr, ip, 40);
        duk_push_string(ctx, ip);
        duk_put_prop_lstring(ctx, -2, "remoteIP", 8);
        duk_push_int(ctx, ntohs(sin->sin6_port));
        duk_put_prop_lstring(ctx, -2, "remotePort", 10);
    }
    else
    {
        struct sockaddr_in *sin = (struct sockaddr_in *)args->addr;
        char ip[16] = {0};
        evutil_inet_ntop(AF_INET, &sin->sin_addr, ip, 16);
        duk_push_string(ctx, ip);
        duk_put_prop_lstring(ctx, -2, "remoteIP", 8);
        duk_push_int(ctx, ntohs(sin->sin_port));
        duk_put_prop_lstring(ctx, -2, "remotePort", 10);
    }
    struct sockaddr_in6 localAddress;
    socklen_t addressLength = args->socklen;
    getsockname(args->s, (struct sockaddr *)&localAddress, &addressLength);
    if (addressLength == sizeof(struct sockaddr_in6))
    {
        struct sockaddr_in6 *sin = (struct sockaddr_in6 *)(&localAddress);
        char ip[40] = {0};
        evutil_inet_ntop(AF_INET6, &sin->sin6_addr, ip, 40);
        duk_push_string(ctx, ip);
        duk_put_prop_lstring(ctx, -2, "localIP", 7);
        duk_push_int(ctx, ntohs(sin->sin6_port));
        duk_put_prop_lstring(ctx, -2, "localPort", 9);
    }
    else
    {
        struct sockaddr_in *sin = (struct sockaddr_in *)(&localAddress);
        char ip[16] = {0};
        evutil_inet_ntop(AF_INET, &sin->sin_addr, ip, 16);
        duk_push_string(ctx, ip);
        duk_put_prop_lstring(ctx, -2, "localIP", 7);
        duk_push_int(ctx, ntohs(sin->sin_port));
        duk_put_prop_lstring(ctx, -2, "localPort", 9);
    }
    duk_call(ctx, 2);

    return 0;
}

static void evconnlistener_tcp_cb(struct evconnlistener *listener, evutil_socket_t s, struct sockaddr *addr, int socklen, void *ptr)
{
    printf("%d %d\n", s, socklen);

    return;
    evconnlistener_tcp_cb_args_t args = {
        .core = ptr,
        .listener = listener,
        .s = s,
        .addr = addr,
        .socklen = socklen,
        .bev = NULL,
        .free = FALSE,
    };
    ejs_call_callback_noresult(args.core->duk, evconnlistener_tcp_cb_impl, &args, evconnlistener_tcp_cb_args_destroy);
}
static duk_ret_t tcp_listen_impl(duk_context *ctx)
{
    tcp_listen_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "ip", 2);
    const uint8_t *ip = NULL;
    if (!duk_is_undefined(ctx, -1))
    {
        ip = duk_require_string(ctx, -1);
    }
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "port", 4);
    short port = duk_require_uint(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "backlog", 7);
    duk_int_t backlog = duk_require_int(ctx, -1);
    duk_pop(ctx);

    ejs_core_t *core = ejs_require_core(ctx);

    duk_get_prop_lstring(ctx, 0, "v6", 2);
    if (duk_is_undefined(ctx, -1))
    {
        // v4 or v6
        struct sockaddr_in6 sin;
        memset(&sin, 0, sizeof(sin));
        sin.sin6_family = AF_INET6;
        sin.sin6_port = htons(port);
        if (ip)
        {
            if (evutil_inet_pton(AF_INET6, ip, &sin.sin6_addr))
            {
                duk_push_lstring(ctx, "evutil_inet_pton fail", 21);
                duk_throw(ctx);
            }
        }
        else
        {
            sin.sin6_addr = in6addr_any;
        }
        args->listener = evconnlistener_new_bind(
            core->base,
            evconnlistener_tcp_cb, core,
            LEV_OPT_CLOSE_ON_FREE | LEV_OPT_REUSEABLE | LEV_OPT_DISABLED,
            backlog,
            (struct sockaddr *)&sin, sizeof(sin));
    }
    else
    {
        duk_to_boolean(ctx, -1);
        if (duk_get_boolean(ctx, -1))
        {
            // v6
            struct sockaddr_in6 sin;
            memset(&sin, 0, sizeof(sin));
            sin.sin6_family = AF_INET6;
            sin.sin6_port = htons(port);
            if (ip)
            {
                if (evutil_inet_pton(AF_INET6, ip, &sin.sin6_addr))
                {
                    duk_push_lstring(ctx, "evutil_inet_pton fail", 21);
                    duk_throw(ctx);
                }
            }
            else
            {
                sin.sin6_addr = in6addr_any;
            }
            args->listener = evconnlistener_new_bind(
                core->base,
                evconnlistener_tcp_cb, core,
                LEV_OPT_CLOSE_ON_FREE | LEV_OPT_REUSEABLE | LEV_OPT_BIND_IPV6ONLY | LEV_OPT_DISABLED,
                backlog,
                (struct sockaddr *)&sin, sizeof(sin));
        }
        else
        {
            // v4
            struct sockaddr_in sin;
            memset(&sin, 0, sizeof(sin));
            sin.sin_family = AF_INET;
            sin.sin_port = htons(port);
            if (ip)
            {
                if (evutil_inet_pton(AF_INET, ip, &sin.sin_addr))
                {
                    duk_push_lstring(ctx, "evutil_inet_pton fail", 21);
                    duk_throw(ctx);
                }
            }
            else
            {
                sin.sin_addr.s_addr = INADDR_ANY;
            }
            args->listener = evconnlistener_new_bind(
                core->base,
                evconnlistener_tcp_cb, core,
                LEV_OPT_CLOSE_ON_FREE | LEV_OPT_REUSEABLE | LEV_OPT_DISABLED,
                backlog,
                (struct sockaddr *)&sin, sizeof(sin));
        }
    }
    if (!args->listener)
    {
        duk_push_string(ctx, evutil_socket_error_to_string(EVUTIL_SOCKET_ERROR()));
        duk_throw(ctx);
    }
    duk_pop(ctx);

    duk_push_object(ctx);
    duk_push_pointer(ctx, args->listener);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_push_pointer(ctx, core);
    duk_put_prop_lstring(ctx, -2, "core", 4);
    duk_push_c_lightfunc(ctx, evconnlistener_tcp_destroy, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->listener = NULL;

    ejs_stash_put_pointer(ctx, EJS_STASH_NET_TCP_LISTENER);
    return 1;
}

static duk_ret_t tcp_listen(duk_context *ctx)
{
    tcp_listen_args_t args = {
        .listener = NULL,
    };
    if (ejs_pcall_function_n(ctx, tcp_listen_impl, &args, 2))
    {
        if (args.listener)
        {
            evconnlistener_free(args.listener);
        }
        duk_throw(ctx);
    }
    return 1;
}
#ifdef DUK_F_LINUX
static void unix_sockaddr_fill(duk_context *ctx, struct sockaddr_un *sin, int *socklen, const uint8_t *address, duk_size_t len)
{
    if (len == 0 ||
        (len == 1 && address[0] == '@'))
    {
        duk_push_lstring(ctx, "unix address invalid", 20);
        duk_throw(ctx);
    }
    if (len - 1 > sizeof(sin->sun_path))
    {
        duk_push_lstring(ctx, "unix address invalid", 20);
        duk_throw(ctx);
    }
    sin->sun_family = AF_UNIX;
    memcpy(sin->sun_path, address, len);
    if (address[0] == '@')
    {
        sin->sun_path[0] = 0;
        *socklen = sizeof(sa_family_t) + len;
    }
    else
    {
        *socklen = sizeof(struct sockaddr_un);
    }
    sin->sun_path[len] = 0;
}
static duk_ret_t unix_listen_impl(duk_context *ctx)
{
    tcp_listen_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "backlog", 7);
    duk_int_t backlog = duk_require_int(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "address", 7);
    duk_size_t len;
    const uint8_t *address = duk_require_lstring(ctx, -1, &len);
    duk_pop(ctx);
    if (len == 0 ||
        (len == 1 && address[0] == '@'))
    {
        duk_push_lstring(ctx, "unix address invalid", 20);
        duk_throw(ctx);
    }
    struct sockaddr_un sin;
    if (len - 1 > sizeof(sin.sun_path))
    {
        duk_push_lstring(ctx, "unix address invalid", 20);
        duk_throw(ctx);
    }
    sin.sun_family = AF_UNIX;
    memcpy(sin.sun_path, address, len);
    int socklen;
    if (address[0] == '@')
    {
        sin.sun_path[0] = 0;
        socklen = sizeof(sa_family_t) + len;
    }
    else
    {
        socklen = sizeof(sin);
    }
    sin.sun_path[len] = 0;

    ejs_core_t *core = ejs_require_core(ctx);

    args->listener = evconnlistener_new_bind(
        core->base,
        evconnlistener_tcp_cb, core,
        LEV_OPT_CLOSE_ON_FREE | LEV_OPT_REUSEABLE | LEV_OPT_DISABLED, backlog,
        (struct sockaddr *)&sin, socklen);
    if (!args->listener)
    {
        duk_push_string(ctx, evutil_socket_error_to_string(EVUTIL_SOCKET_ERROR()));
        duk_throw(ctx);
    }

    duk_push_object(ctx);
    duk_push_lstring(ctx, "unix", 4);
    duk_put_prop_lstring(ctx, -2, "network", 7);
    duk_push_pointer(ctx, args->listener);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_push_pointer(ctx, core);
    duk_put_prop_lstring(ctx, -2, "core", 4);
    duk_push_c_lightfunc(ctx, evconnlistener_tcp_destroy, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->listener = NULL;

    ejs_stash_put_pointer(ctx, EJS_STASH_NET_TCP_LISTENER);
    return 1;
}
#endif
static duk_ret_t unix_listen(duk_context *ctx)
{
#ifndef DUK_F_LINUX
    ejs_throw_cause(ctx, EJS_ERROR_NOT_SUPPORT, "unix is ​​only supported under linux");
#else
    tcp_listen_args_t args = {
        .listener = NULL,
    };
    if (ejs_pcall_function_n(ctx, unix_listen_impl, &args, 2))
    {
        if (args.listener)
        {
            evconnlistener_free(args.listener);
        }

        duk_throw(ctx);
    }
#endif
    return 1;
}
static duk_ret_t tcp_listen_close(duk_context *ctx)
{
    struct evconnlistener *listener = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_NET_TCP_LISTENER);
    if (listener)
    {
        evconnlistener_free(listener);
    }
    return 0;
}

static duk_ret_t tcp_listen_cb(duk_context *ctx)
{
    duk_bool_t enable = duk_require_boolean(ctx, 1);

    duk_get_prop_lstring(ctx, 0, "p", 1);
    struct evconnlistener *listener = duk_get_pointer_default(ctx, -1, 0);
    if (!listener)
    {
        return 0;
    }
    duk_pop_2(ctx);
    duk_get_prop_lstring(ctx, 0, "core", 4);
    ejs_core_t *core = duk_get_pointer_default(ctx, -1, 0);
    if (!core)
    {
        return 0;
    }

    if (enable)
    {
        evconnlistener_enable(listener);
    }
    else
    {
        evconnlistener_disable(listener);
    }
    return 0;
}
static duk_ret_t tcp_listen_err(duk_context *ctx)
{
    duk_bool_t enable = duk_require_boolean(ctx, 1);

    duk_get_prop_lstring(ctx, 0, "p", 1);
    struct evconnlistener *listener = duk_get_pointer_default(ctx, -1, 0);
    if (!listener)
    {
        return 0;
    }
    duk_pop_2(ctx);
    duk_get_prop_lstring(ctx, 0, "core", 4);
    ejs_core_t *core = duk_get_pointer_default(ctx, -1, 0);
    if (!core)
    {
        return 0;
    }
    evconnlistener_set_error_cb(listener, enable ? evconnlistener_tcp_errorcb : 0);
    return 0;
}

static duk_ret_t tcp_conn_stash(duk_context *ctx)
{
    duk_bool_t put = duk_require_boolean(ctx, -1);
    if (put)
    {
        duk_pop(ctx);
        ejs_stash_put_pointer(ctx, EJS_STASH_NET_TCP_CONN);
    }
    else
    {
        duk_get_prop_lstring(ctx, 0, "p", 1);
        struct bufferevent *bev = duk_require_pointer(ctx, -1);
        duk_set_finalizer(ctx, 0);
        bufferevent_free(bev);
    }
    return 0;
}
static duk_ret_t tcp_conn_close(duk_context *ctx)
{
    struct bufferevent *bev = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_NET_TCP_CONN);
    if (bev)
    {
        bufferevent_free(bev);
    }
    return 0;
}
static duk_ret_t tcp_conn_write(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    struct bufferevent *bev = duk_get_pointer_default(ctx, -1, 0);
    if (!bev)
    {
        return 0;
    }
    duk_pop(ctx);

    const uint8_t *data;
    duk_size_t data_len;
    if (duk_is_string(ctx, 1))
    {
        data = duk_require_lstring(ctx, 1, &data_len);
    }
    else
    {
        data = duk_require_buffer_data(ctx, 1, &data_len);
    }
    duk_pop(ctx);
    if (!data_len)
    {
        duk_push_uint(ctx, 0);
        return 1;
    }
    duk_get_prop_lstring(ctx, 0, "md", 2);
    duk_get_prop_lstring(ctx, -1, "mw", 2);
    duk_size_t maxWriteBytes = duk_get_uint_default(ctx, -1, 0);
    duk_pop_n(ctx, 2);

    struct evbuffer *buf = bufferevent_get_output(bev);
    size_t len = evbuffer_get_length(buf);
    if (maxWriteBytes)
    {
        if (data_len > maxWriteBytes)
        {
            duk_push_lstring(ctx, "data too large", 14);
            duk_throw(ctx);
        }
        else if (maxWriteBytes - len < data_len)
        {
            duk_push_true(ctx);
            duk_put_prop_lstring(ctx, 0, "busy", 4);
            return 0;
        }
    }

    if (bufferevent_write(bev, data, data_len))
    {
        duk_push_lstring(ctx, "bufferevent_write fail", 22);
        duk_throw(ctx);
    }

    duk_push_uint(ctx, data_len);
    return 1;
}
static duk_ret_t tcp_conn_cb(duk_context *ctx)
{
    duk_bool_t enable = duk_require_boolean(ctx, 1);

    duk_get_prop_lstring(ctx, 0, "p", 1);
    struct bufferevent *bev = duk_get_pointer_default(ctx, -1, 0);
    if (!bev)
    {
        return 0;
    }
    duk_pop_2(ctx);
    duk_get_prop_lstring(ctx, 0, "core", 4);
    ejs_core_t *core = duk_get_pointer_default(ctx, -1, 0);
    if (!core)
    {
        return 0;
    }

    if (enable)
    {
        bufferevent_enable(bev, EV_READ);
    }
    else
    {
        bufferevent_disable(bev, EV_READ);
    }
    return 0;
}
static duk_ret_t tcp_conn_localAddr(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    struct bufferevent *bev = duk_require_pointer(ctx, -1);
    duk_pop_2(ctx);

    int s = bufferevent_getfd(bev);
    struct sockaddr_in6 localAddress;
    socklen_t addressLength = sizeof(localAddress);
    duk_push_array(ctx);
    getsockname(s, (struct sockaddr *)&localAddress, &addressLength);
    if (addressLength == sizeof(struct sockaddr_in6))
    {
        struct sockaddr_in6 *sin = (struct sockaddr_in6 *)(&localAddress);
        char ip[40] = {0};
        evutil_inet_ntop(AF_INET6, &sin->sin6_addr, ip, 40);
        duk_push_string(ctx, ip);
        duk_put_prop_index(ctx, -2, 0);
        duk_push_int(ctx, ntohs(sin->sin6_port));
        duk_put_prop_index(ctx, -2, 1);
    }
    else
    {
        struct sockaddr_in *sin = (struct sockaddr_in *)(&localAddress);
        char ip[16] = {0};
        evutil_inet_ntop(AF_INET, &sin->sin_addr, ip, 16);
        duk_push_string(ctx, ip);
        duk_put_prop_index(ctx, -2, 0);
        duk_push_int(ctx, ntohs(sin->sin_port));
        duk_put_prop_index(ctx, -2, 1);
    }
    return 1;
}
static duk_ret_t socket_error_str(duk_context *ctx)
{
    duk_push_string(ctx, evutil_socket_error_to_string(EVUTIL_SOCKET_ERROR()));
    return 1;
}
static duk_ret_t socket_error(duk_context *ctx)
{
    duk_push_int(ctx, EVUTIL_SOCKET_ERROR());
    return 1;
}
static duk_ret_t connect_error_str(duk_context *ctx)
{
    struct bufferevent *bev = duk_require_pointer(ctx, -1);
    int err = bufferevent_socket_get_dns_error(bev);
    if (err)
    {
        duk_push_string(ctx, evutil_gai_strerror(err));
    }
    else
    {
        duk_push_string(ctx, evutil_socket_error_to_string(EVUTIL_SOCKET_ERROR()));
    }
    return 1;
}

typedef struct
{
    struct bufferevent *bev;
} tcp_conect_args_t;
static duk_ret_t tcp_conect_impl(duk_context *ctx)
{
    tcp_conect_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "ip", 2);
    const uint8_t *ip = duk_require_string(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "port", 4);
    short port = duk_require_uint(ctx, -1);
    duk_pop(ctx);

    ejs_core_t *core = ejs_require_core(ctx);
    duk_get_prop_lstring(ctx, 0, "v6", 2);
    if (duk_require_boolean(ctx, -1))
    {
        // v6
        struct sockaddr_in6 sin;
        memset(&sin, 0, sizeof(sin));
        sin.sin6_family = AF_INET6;
        sin.sin6_port = htons(port);
        if (evutil_inet_pton(AF_INET6, ip, &sin.sin6_addr) != 1)
        {
            duk_push_lstring(ctx, "evutil_inet_pton fail", 21);
            duk_throw(ctx);
        }

        args->bev = bufferevent_socket_new(core->base, -1, BEV_OPT_CLOSE_ON_FREE | BEV_OPT_DEFER_CALLBACKS);
        if (!args->bev)
        {
            duk_push_lstring(ctx, "bufferevent_socket_new fail", 27);
            duk_throw(ctx);
        }
        bufferevent_setcb(args->bev, tcp_connection_read_cb, tcp_connection_write_cb, tcp_connection_event_cb, core);
        bufferevent_enable(args->bev, EV_WRITE);

        if (bufferevent_socket_connect(args->bev, (const struct sockaddr *)&sin, sizeof(sin)))
        {
            duk_push_lstring(ctx, "bufferevent_socket_connect fail", 31);
            duk_throw(ctx);
        }
    }
    else
    {
        // v4
        struct sockaddr_in sin;
        memset(&sin, 0, sizeof(sin));
        sin.sin_family = AF_INET;
        sin.sin_port = htons(port);
        if (evutil_inet_pton(AF_INET, ip, &sin.sin_addr) != 1)
        {
            duk_push_lstring(ctx, "evutil_inet_pton fail", 21);
            duk_throw(ctx);
        }

        args->bev = bufferevent_socket_new(core->base, -1, BEV_OPT_CLOSE_ON_FREE | BEV_OPT_DEFER_CALLBACKS);
        if (!args->bev)
        {
            duk_push_lstring(ctx, "bufferevent_socket_new fail", 27);
            duk_throw(ctx);
        }
        bufferevent_setcb(args->bev, tcp_connection_read_cb, tcp_connection_write_cb, tcp_connection_event_cb, core);
        bufferevent_enable(args->bev, EV_WRITE);

        if (bufferevent_socket_connect(args->bev, (const struct sockaddr *)&sin, sizeof(sin)))
        {
            duk_push_lstring(ctx, "bufferevent_socket_connect fail", 31);
            duk_throw(ctx);
        }
    }

    duk_pop_2(ctx);

    push_tcp_connection(ctx, core, args->bev);
    struct bufferevent *bev = args->bev;
    args->bev = NULL;

    ejs_stash_put_pointer(ctx, EJS_STASH_NET_TCP_CONN);
    return 1;
}
static duk_ret_t tcp_conect(duk_context *ctx)
{
    EJS_VAR_TYPE(tcp_conect_args_t, args);
    if (ejs_pcall_function_n(ctx, tcp_conect_impl, &args, 2))
    {
        if (args.bev)
        {
            bufferevent_free(args.bev);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t unix_conect_impl(duk_context *ctx)
{
    tcp_conect_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "name", 4);
    duk_size_t len;
    const uint8_t *address = duk_require_lstring(ctx, -1, &len);

    struct sockaddr_un sin;
    int socklen;
    unix_sockaddr_fill(ctx, &sin, &socklen, address, len);

    duk_pop_2(ctx);

    ejs_core_t *core = ejs_require_core(ctx);

    args->bev = bufferevent_socket_new(core->base, -1, BEV_OPT_CLOSE_ON_FREE | BEV_OPT_DEFER_CALLBACKS);
    if (!args->bev)
    {
        duk_push_lstring(ctx, "bufferevent_socket_new fail", 27);
        duk_throw(ctx);
    }
    bufferevent_setcb(args->bev, tcp_connection_read_cb, tcp_connection_write_cb, tcp_connection_event_cb, core);
    bufferevent_enable(args->bev, EV_WRITE);

    if (bufferevent_socket_connect(args->bev, (const struct sockaddr *)&sin, socklen))
    {
        duk_push_lstring(ctx, "bufferevent_socket_connect fail", 31);
        duk_throw(ctx);
    }

    push_tcp_connection(ctx, core, args->bev);
    struct bufferevent *bev = args->bev;
    args->bev = NULL;

    ejs_stash_put_pointer(ctx, EJS_STASH_NET_TCP_CONN);
    return 1;
}

static duk_ret_t unix_conect(duk_context *ctx)
{
#ifndef DUK_F_LINUX
    ejs_throw_cause(ctx, EJS_ERROR_NOT_SUPPORT, "unix is ​​only supported under linux");
#else
    EJS_VAR_TYPE(tcp_conect_args_t, args);
    if (ejs_pcall_function_n(ctx, unix_conect_impl, &args, 2))
    {
        if (args.bev)
        {
            bufferevent_free(args.bev);
        }
        duk_throw(ctx);
    }
#endif
    return 1;
}
typedef struct
{
    struct evdns_base *dns;
} resolver_new_args_t;
static duk_ret_t resolver_destroy(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    struct evdns_base *dns = duk_get_pointer_default(ctx, -1, 0);
    if (dns)
    {
        evdns_base_free(dns, 1);
    }
    return 0;
}
static duk_ret_t resolver_new_impl(duk_context *ctx)
{
    resolver_new_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    ejs_core_t *core = ejs_require_core(ctx);

    int flags = EVDNS_BASE_NAMESERVERS_NO_DEFAULT | EVDNS_BASE_DISABLE_WHEN_INACTIVE;
    duk_get_prop_lstring(ctx, 0, "system", 6);
    duk_to_boolean(ctx, -1);
    if (duk_get_boolean(ctx, -1))
    {
        flags |= EVDNS_BASE_INITIALIZE_NAMESERVERS;
    }
    duk_pop(ctx);

    struct evdns_base *dns = evdns_base_new(core->base, flags);
    if (!dns)
    {
        duk_push_lstring(ctx, "evdns_base_new fail", 19);
        duk_throw(ctx);
    }
    args->dns = dns;
    duk_get_prop_lstring(ctx, 0, "nameserver", 10);
    if (duk_is_array(ctx, -1))
    {
        duk_size_t count = duk_get_length(ctx, -1);
        int err;
        for (duk_size_t i = 0; i < count; i++)
        {
            duk_get_prop_index(ctx, -1, i);
            const char *ip = duk_require_string(ctx, -1);
            err = evdns_base_nameserver_ip_add(dns, ip);
            if (err)
            {
                duk_push_lstring(ctx, "evdns_base_nameserver_ip_add fail: ", 35);
                duk_swap_top(ctx, -2);
                duk_concat(ctx, 2);
                duk_throw(ctx);
            }
            else
            {
                duk_pop(ctx);
            }
        }
    }
    duk_pop(ctx);

    duk_push_object(ctx);
    duk_push_pointer(ctx, dns);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_push_c_lightfunc(ctx, resolver_destroy, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->dns = NULL;
    ejs_stash_put_pointer(ctx, EJS_STASH_NET_RESOLVER);
    return 1;
}
static duk_ret_t resolver_new(duk_context *ctx)
{
    EJS_VAR_TYPE(resolver_new_args_t, args);
    if (ejs_pcall_function_n(ctx, resolver_new_impl, &args, 2))
    {
        if (args.dns)
        {
            evdns_base_free(args.dns, 1);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t resolver_free(duk_context *ctx)
{
    struct evdns_base *dns = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_NET_RESOLVER);
    if (dns)
    {
        evdns_base_free(dns, 1);
    }
    return 0;
}
typedef struct
{
    ejs_core_t *core;
    struct evdns_base *dns;
    struct evdns_request *request;
    duk_bool_t stash;
} resolve_ip_t;
static duk_ret_t resolve_ip_destroy(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    resolve_ip_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        if (p->request)
        {
            struct evdns_request *req = p->request;
            p->request = NULL;
            evdns_cancel_request(p->dns, req);
        }
        else
        {
            free(p);
        }
    }
    return 0;
}
typedef struct
{
    int result;
    char type;
    int count;
    int ttl;
    void *addresses;
    resolve_ip_t *resolve;
} resolver_ip_cb_args_t;

static duk_ret_t resolver_ip_cb_impl(duk_context *ctx)
{
    resolver_ip_cb_args_t *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    if (!ejs_stash_pop_pointer(ctx, args->resolve, EJS_STASH_NET_RESOLVER_REQUEST))
    {
        return 0;
    }

    duk_push_undefined(ctx);
    duk_set_finalizer(ctx, -2);
    free(args->resolve);

    duk_get_prop_lstring(ctx, -1, "cb", 2);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    if (args->result)
    {
        duk_push_undefined(ctx);
        duk_push_int(ctx, args->result);
        duk_push_string(ctx, evdns_err_to_string(args->result));
        duk_call(ctx, 3);
    }
    else
    {
        duk_push_array(ctx);
        if (args->type == DNS_IPv4_A)
        {
            char *p = args->addresses;
            for (int i = 0; i < args->count; i++)
            {
                char ip[16];
                evutil_inet_ntop(AF_INET, p, ip, 16);
                p += 4;
                duk_push_string(ctx, ip);
                duk_put_prop_index(ctx, -2, i);
            }
        }
        else
        {
            char *p = args->addresses;
            for (int i = 0; i < args->count; i++)
            {
                char ip[40] = {0};
                evutil_inet_ntop(AF_INET6, p, ip, 40);
                p += 16;
                duk_push_string(ctx, ip);
                duk_put_prop_index(ctx, -2, i);
            }
        }
        duk_call(ctx, 1);
    }
    return 0;
}
static void resolver_ip_cb(int result, char type, int count, int ttl, void *addresses, void *arg)
{
    resolve_ip_t *resolve = arg;
    if (resolve->stash)
    {
        resolver_ip_cb_args_t args = {
            .result = result,
            .type = type,
            .count = count,
            .ttl = ttl,
            .addresses = addresses,
            .resolve = arg,
        };
        args.resolve->request = NULL;
        ejs_call_callback_noresult(args.resolve->core->duk, resolver_ip_cb_impl, &args, NULL);
    }
    else
    {
        free(resolve);
    }
}
typedef struct
{
    resolve_ip_t *resolve;
} resolver_ip_args_t;
static duk_ret_t resolver_ip_impl(duk_context *ctx)
{
    resolver_ip_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, -1, "r", 1);
    duk_get_prop_lstring(ctx, -1, "p", 1);
    struct evdns_base *dns = duk_require_pointer(ctx, -1);
    duk_pop_2(ctx);

    ejs_core_t *core = ejs_require_core(ctx);

    duk_get_prop_lstring(ctx, -1, "name", 4);
    const char *name = duk_require_string(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, -1, "v6", 2);
    duk_bool_t v6 = duk_require_boolean(ctx, -1);
    duk_pop(ctx);

    resolve_ip_t *resolve = malloc(sizeof(resolve_ip_t));
    if (!resolve)
    {
        ejs_throw_os(ctx, errno, strerror(errno));
    }
    args->resolve = resolve;
    resolve->stash = 0;
    resolve->dns = dns;
    resolve->core = core;
    resolve->request = v6 ? evdns_base_resolve_ipv6(dns, name, 0, resolver_ip_cb, args->resolve) : evdns_base_resolve_ipv4(dns, name, 0, resolver_ip_cb, args->resolve);
    if (!resolve->request)
    {
        duk_push_lstring(ctx, "evdns_base_resolve_ipv6 fail", 28);
        duk_throw(ctx);
    }

    duk_push_object(ctx);
    duk_push_pointer(ctx, resolve);
    duk_put_prop_lstring(ctx, -2, "p", 1);

    duk_get_prop_lstring(ctx, 0, "cb", 2);
    duk_put_prop_lstring(ctx, -2, "cb", 2);

    duk_push_c_lightfunc(ctx, resolve_ip_destroy, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->resolve = NULL;

    ejs_stash_put_pointer(ctx, EJS_STASH_NET_RESOLVER_REQUEST);
    resolve->stash = 1;
    return 1;
}
static duk_ret_t resolver_ip(duk_context *ctx)
{
    EJS_VAR_TYPE(resolver_ip_args_t, args);
    if (ejs_pcall_function_n(ctx, resolver_ip_impl, &args, 2))
    {
        if (args.resolve)
        {
            if (args.resolve->request)
            {
                struct evdns_request *req = args.resolve->request;
                args.resolve->request = NULL;
                evdns_cancel_request(args.resolve->dns, req);
            }
            else
            {
                free(args.resolve);
            }
        }
        duk_throw(ctx);
    }
    return 1;
}
duk_ret_t resolver_ip_cancel(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    resolve_ip_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        duk_set_finalizer(ctx, 0);
        if (p->request)
        {
            struct evdns_request *req = p->request;
            p->request = NULL;
            evdns_cancel_request(p->dns, req);
        }
        else
        {
            free(p);
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

        // evbuffer_len
        duk_push_c_lightfunc(ctx, _ejs_evbuffer_len, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "evbuffer_len", 12);
        duk_push_c_lightfunc(ctx, _ejs_evbuffer_read, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "evbuffer_read", 13);
        duk_push_c_lightfunc(ctx, _ejs_evbuffer_copy, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "evbuffer_copy", 13);
        duk_push_c_lightfunc(ctx, _ejs_evbuffer_drain, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "evbuffer_drain", 14);

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

        // BEV_EVENT_
        duk_push_uint(ctx, BEV_EVENT_CONNECTED);
        duk_put_prop_lstring(ctx, -2, "BEV_EVENT_CONNECTED", 19);
        duk_push_uint(ctx, BEV_EVENT_WRITING);
        duk_put_prop_lstring(ctx, -2, "BEV_EVENT_WRITING", 17);
        duk_push_uint(ctx, BEV_EVENT_READING);
        duk_put_prop_lstring(ctx, -2, "BEV_EVENT_READING", 17);

        duk_push_uint(ctx, BEV_EVENT_TIMEOUT);
        duk_put_prop_lstring(ctx, -2, "BEV_EVENT_TIMEOUT", 17);
        duk_push_uint(ctx, BEV_EVENT_EOF);
        duk_put_prop_lstring(ctx, -2, "BEV_EVENT_EOF", 13);
        duk_push_uint(ctx, BEV_EVENT_ERROR);
        duk_put_prop_lstring(ctx, -2, "BEV_EVENT_ERROR", 15);

        // tcp
        duk_push_c_lightfunc(ctx, tcp_listen, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_listen", 10);

        duk_push_c_lightfunc(ctx, tcp_listen_close, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_listen_close", 16);

        duk_push_c_lightfunc(ctx, tcp_listen_cb, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_listen_cb", 13);

        duk_push_c_lightfunc(ctx, tcp_listen_err, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_listen_err", 14);

        duk_push_c_lightfunc(ctx, tcp_conn_stash, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_conn_stash", 14);

        duk_push_c_lightfunc(ctx, tcp_conn_close, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_conn_close", 14);
        duk_push_c_lightfunc(ctx, tcp_conn_write, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_conn_write", 14);
        duk_push_c_lightfunc(ctx, tcp_conn_cb, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_conn_cb", 11);
        duk_push_c_lightfunc(ctx, tcp_conn_localAddr, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_conn_localAddr", 18);

        duk_push_c_lightfunc(ctx, socket_error_str, 0, 0, 0);
        duk_put_prop_lstring(ctx, -2, "socket_error_str", 16);
        duk_push_c_lightfunc(ctx, socket_error, 0, 0, 0);
        duk_put_prop_lstring(ctx, -2, "socket_error", 12);
        duk_push_c_lightfunc(ctx, connect_error_str, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "connect_error_str", 17);

        duk_push_c_lightfunc(ctx, tcp_conect, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "tcp_conect", 10);

        // unix
        duk_push_c_lightfunc(ctx, unix_listen, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "unix_listen", 11);
        duk_push_c_lightfunc(ctx, unix_conect, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "unix_conect", 11);

        duk_push_c_lightfunc(ctx, resolver_new, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "resolver_new", 12);
        duk_push_c_lightfunc(ctx, resolver_free, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "resolver_free", 13);
        duk_push_c_lightfunc(ctx, resolver_ip, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "resolver_ip", 11);
        duk_push_c_lightfunc(ctx, resolver_ip_cancel, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "resolver_ip_cancel", 18);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);

    ejs_stash_set_module_destroy(ctx);

    return 0;
}