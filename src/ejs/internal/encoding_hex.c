#include "encoding_hex.h"

static uint8_t ppp_encoding_hex_reverse_hex_table[] = {0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0x0, 0x1, 0x2, 0x3, 0x4, 0x5, 0x6, 0x7, 0x8, 0x9, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xa, 0xb, 0xc, 0xd, 0xe, 0xf, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff, 0xff};
void ppp_encoding_hex_encode(uint8_t *dst, const uint8_t *src, const size_t src_len, BOOL uppercase)
{
    char *hextable = uppercase ? "0123456789ABCDEF" : "0123456789abcdef";
    uint8_t v;
    size_t j = 0;
    for (size_t i = 0; i < src_len; i++)
    {
        v = src[i];
        dst[j++] = hextable[v >> 4];
        dst[j++] = hextable[v & 0x0f];
    }
}
size_t ppp_encoding_hex_decode(uint8_t *dst, const uint8_t *src, const size_t src_len)
{
    size_t i = 0;
    size_t j = 1;
    uint8_t a, b;
    for (; j < src_len; j += 2)
    {
        a = ppp_encoding_hex_reverse_hex_table[src[j - 1]];
        if (a > 0x0f)
        {
            return i;
        }
        b = ppp_encoding_hex_reverse_hex_table[src[j]];
        if (b > 0x0f)
        {
            return i;
        }
        dst[i++] = (a << 4) | b;
    }
    return i;
}
BOOL ppp_encoding_hex_is_valid_char(uint8_t c)
{
    if (ppp_encoding_hex_reverse_hex_table[c] > 0xf)
    {
        return FALSE;
    }
    return TRUE;
}
BOOL ppp_encoding_hex_is_valid(const uint8_t *s, const size_t s_len)
{
    if (s_len % 2)
    {
        return FALSE;
    }

    size_t i = 0;
    size_t j = 1;
    for (; j < s_len; j += 2)
    {
        if (ppp_encoding_hex_reverse_hex_table[s[j - 1]] > 0x0f)
        {
            return FALSE;
        }
        if (ppp_encoding_hex_reverse_hex_table[s[j]] > 0x0f)
        {
            return FALSE;
        }
    }
    return TRUE;
}