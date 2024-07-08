#include "utf8.h"

#define ppp_utf8_surrogateMin 0xD800
#define ppp_utf8_surrogateMax 0xDFFF

#define ppp_utf8_t1 0b00000000
#define ppp_utf8_tx 0b10000000
#define ppp_utf8_t2 0b11000000
#define ppp_utf8_t3 0b11100000
#define ppp_utf8_t4 0b11110000
#define ppp_utf8_t5 0b11111000

#define ppp_utf8_maskx 0b00111111
#define ppp_utf8_mask2 0b00011111
#define ppp_utf8_mask3 0b00001111
#define ppp_utf8_mask4 0b00000111

#define ppp_utf8_rune1Max 127
#define ppp_utf8_rune2Max 2047
#define ppp_utf8_rune3Max 65535

// The default lowest and highest continuation byte.
#define ppp_utf8_locb 0b10000000
#define ppp_utf8_hicb 0b10111111

// These names of these constants are chosen to give nice alignment in the
// table below. The first nibble is an index into acceptRanges or F for
// special one-byte cases. The second nibble is the Rune length or the
// Status for the special one-byte case.
#define ppp_utf8_xx 0xF1 // invalid: size 1
#define ppp_utf8_as 0xF0 // ASCII: size 1
#define ppp_utf8_s1 0x02 // accept 0, size 2
#define ppp_utf8_s2 0x13 // accept 1, size 3
#define ppp_utf8_s3 0x03 // accept 0, size 3
#define ppp_utf8_s4 0x23 // accept 2, size 3
#define ppp_utf8_s5 0x34 // accept 3, size 4
#define ppp_utf8_s6 0x04 // accept 0, size 4
#define ppp_utf8_s7 0x44 // accept 4, size 4
// first is information about the first byte in a UTF-8 sequence.
static uint8_t first[256] = {
    //   1   2   3   4   5   6   7   8   9   A   B   C   D   E   F
    ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, // 0x00-0x0F
    ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, // 0x10-0x1F
    ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, // 0x20-0x2F
    ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, // 0x30-0x3F
    ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, // 0x40-0x4F
    ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, // 0x50-0x5F
    ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, // 0x60-0x6F
    ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, ppp_utf8_as, // 0x70-0x7F
    //   1   2   3   4   5   6   7   8   9   A   B   C   D   E   F
    ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, // 0x80-0x8F
    ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, // 0x90-0x9F
    ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, // 0xA0-0xAF
    ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, // 0xB0-0xBF
    ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, // 0xC0-0xCF
    ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, ppp_utf8_s1, // 0xD0-0xDF
    ppp_utf8_s2, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s3, ppp_utf8_s4, ppp_utf8_s3, ppp_utf8_s3, // 0xE0-0xEF
    ppp_utf8_s5, ppp_utf8_s6, ppp_utf8_s6, ppp_utf8_s6, ppp_utf8_s7, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, ppp_utf8_xx, // 0xF0-0xFF
};

// acceptRange gives the range of valid values for the second byte in a UTF-8
// sequence.
typedef struct
{
    uint8_t lo; // lowest value for second byte.
    uint8_t hi; // highest value for second byte.
} acceptRange_t;

// acceptRanges has size 16 to avoid bounds checks in the code that uses it.
static acceptRange_t acceptRanges[] = {
    {ppp_utf8_locb, ppp_utf8_hicb},
    {0xA0, ppp_utf8_hicb},
    {ppp_utf8_locb, 0x9F},
    {0x90, ppp_utf8_hicb},
    {ppp_utf8_locb, 0x8F},
    {0, 0},
    {0, 0},
    {0, 0},
    {0, 0},
    {0, 0},
    {0, 0},
    {0, 0},
    {0, 0},
    {0, 0},
    {0, 0},
    {0, 0},
};

int ppp_utf8_encode(uint8_t *p, const size_t p_len, ppp_utf8_rune_t r)
{
    // Negative values are erroneous. Making it unsigned addresses the problem.
    uint32_t i = r;
    if (i < ppp_utf8_rune1Max)
    {
        if (!p)
        {
            return 1;
        }
        else if (p_len < 1)
        {
            return -1;
        }
        p[0] = (uint8_t)r;
        return 1;
    }
    else if (i <= ppp_utf8_rune2Max)
    {
        if (!p)
        {
            return 2;
        }
        else if (p_len < 2)
        {
            return -1;
        }
        p[0] = ppp_utf8_t2 | (uint8_t)(r >> 6);
        p[1] = ppp_utf8_tx | (uint8_t)(r)&ppp_utf8_maskx;
        return 2;
    }
    else if (i > PPP_UTF8_MAX_RUNE || (ppp_utf8_surrogateMin <= i && i <= ppp_utf8_surrogateMax))
    {
        if (!p)
        {
            return 3;
        }
        r = PPP_UTF8_RUNE_ERROR;
    }
    else if (i < ppp_utf8_rune3Max)
    {
        if (!p)
        {
            return 3;
        }
    }
    else
    {
        if (!p)
        {
            return 4;
        }
        else if (p_len < 4)
        {
            return -1;
        }
        p[0] = ppp_utf8_t4 | (uint8_t)(r >> 18);
        p[1] = ppp_utf8_tx | (uint8_t)(r >> 12) & ppp_utf8_maskx;
        p[2] = ppp_utf8_tx | (uint8_t)(r >> 6) & ppp_utf8_maskx;
        p[3] = ppp_utf8_tx | (uint8_t)(r)&ppp_utf8_maskx;
        return 4;
    }
    if (p_len < 3)
    {
        return -1;
    }

    p[0] = ppp_utf8_t3 | (uint8_t)(r >> 12);
    p[1] = ppp_utf8_tx | (uint8_t)(r >> 6) & ppp_utf8_maskx;
    p[2] = ppp_utf8_tx | (uint8_t)(r)&ppp_utf8_maskx;
    return 3;
}
int ppp_utf8_len(ppp_utf8_rune_t r)
{
    if (r < 0)
    {
        return -1;
    }
    else if (r <= ppp_utf8_rune1Max)
    {
        return 1;
    }
    else if (r <= ppp_utf8_rune2Max)
    {
        return 2;
    }
    else if (ppp_utf8_surrogateMin <= r && r <= ppp_utf8_surrogateMax)
    {
        return -1;
    }
    else if (r <= ppp_utf8_rune3Max)
    {
        return 3;
    }
    else if (r <= PPP_UTF8_MAX_RUNE)
    {
        return 4;
    }
    return -1;
}
ppp_utf8_rune_t ppp_utf8_decode_last(const uint8_t *p, const size_t p_len, int *size)
{
    size_t end = p_len;
    if (end == 0)
    {
        if (size)
        {
            *size = 0;
        }
        return PPP_UTF8_RUNE_ERROR;
    }
    size_t start = end - 1;
    ppp_utf8_rune_t r = p[start];
    if (r < PPP_UTF8_RUNE_SELF)
    {
        if (size)
        {
            *size = 1;
        }
        return r;
    }
    // guard against O(n^2) behavior when traversing
    // backwards through strings with long sequences of
    // invalid UTF-8.
    size_t lim = end > PPP_UTF8_MAX_RUNE ? end - PPP_UTF8_MAX_RUNE : 0;

    if (start > 0)
    {
        start--;
        while (start >= lim)
        {
            if (ppp_utf8_rune_start(p[start]))
            {
                break;
            }
            start--;
            if (!start)
            {
                break;
            }
        }
    }
    if (size)
    {
        r = ppp_utf8_decode(p + start, end - start, size);
        if (start + *size != end)
        {
            *size = 1;
            return PPP_UTF8_RUNE_ERROR;
        }
    }
    else
    {
        int s;
        r = ppp_utf8_decode(p + start, end - start, &s);
        if (start + s != end)
        {
            return PPP_UTF8_RUNE_ERROR;
        }
    }
    return r;
}
ppp_utf8_rune_t ppp_utf8_decode(const uint8_t *p, const size_t p_len, int *size)
{
    size_t n = p_len;
    if (n < 1)
    {
        if (size)
        {
            *size = 0;
        }
        return PPP_UTF8_RUNE_ERROR;
    }
    uint8_t p0 = p[0];
    uint8_t x = first[p0];
    if (x >= ppp_utf8_as)
    {
        // The following code simulates an additional check for x == xx and
        // handling the ASCII and invalid cases accordingly. This mask-and-or
        // approach prevents an additional branch.
        int32_t mask = (int32_t)(x) << 31 >> 31; // Create 0x0000 or 0xFFFF.
        if (size)
        {
            *size = 1;
        }
        return (ppp_utf8_rune_t)(p[0]) & ~mask | PPP_UTF8_RUNE_ERROR & mask;
    }
    int sz = x & 7;
    acceptRange_t accept = acceptRanges[x >> 4];
    if (n < sz)
    {
        if (size)
        {
            *size = 1;
        }
        return PPP_UTF8_RUNE_ERROR;
    }
    uint8_t b1 = p[1];
    if (b1 < accept.lo || accept.hi < b1)
    {
        if (size)
        {
            *size = 1;
        }
        return PPP_UTF8_RUNE_ERROR;
    }
    if (sz <= 2)
    { // <= instead of == to help the compiler eliminate some bounds checks
        if (size)
        {
            *size = 2;
        }
        return (ppp_utf8_rune_t)(p0 & ppp_utf8_mask2) << 6 | (ppp_utf8_rune_t)(b1 & ppp_utf8_maskx);
    }
    uint8_t b2 = p[2];
    if (b2 < ppp_utf8_locb || ppp_utf8_hicb < b2)
    {
        if (size)
        {
            *size = 1;
        }
        return PPP_UTF8_RUNE_ERROR;
    }
    if (sz <= 3)
    {
        if (size)
        {
            *size = 3;
        }
        return (ppp_utf8_rune_t)(p0 & ppp_utf8_mask3) << 12 | (ppp_utf8_rune_t)(b1 & ppp_utf8_maskx) << 6 | (ppp_utf8_rune_t)(b2 & ppp_utf8_maskx);
    }
    uint8_t b3 = p[3];
    if (b3 < ppp_utf8_locb || ppp_utf8_hicb < b3)
    {
        if (size)
        {
            *size = 1;
        }
        return PPP_UTF8_RUNE_ERROR;
    }
    if (size)
    {
        *size = 4;
    }
    return (ppp_utf8_rune_t)(p0 & ppp_utf8_mask4) << 18 | (ppp_utf8_rune_t)(b1 & ppp_utf8_maskx) << 12 | (ppp_utf8_rune_t)(b2 & ppp_utf8_maskx) << 6 | (ppp_utf8_rune_t)(b3 & ppp_utf8_maskx);
}
BOOL ppp_utf8_full(const uint8_t *p, const size_t n)
{
    if (n == 0)
    {
        return FALSE;
    }
    uint8_t x = first[p[0]];
    if (n >= (int)(x & 7))
    {
        return TRUE; // ASCII, invalid or valid.
    }
    // Must be short or invalid.
    acceptRange_t accept = acceptRanges[x >> 4];
    if (n > 1 && (p[1] < accept.lo || accept.hi < p[1]))
    {
        return TRUE;
    }
    else if (n > 2 && (p[2] < ppp_utf8_locb || ppp_utf8_hicb < p[2]))
    {
        return TRUE;
    }
    return FALSE;
}
size_t ppp_utf8_count(const uint8_t *p, const size_t np)
{
    size_t n;
    uint8_t c;
    int size;
    acceptRange_t accept;
    for (size_t i = 0; i < np;)
    {
        n++;
        c = p[i];
        if (c < PPP_UTF8_RUNE_SELF)
        {
            // ASCII fast path
            i++;
            continue;
        }
        c = first[c];
        if (c == ppp_utf8_xx)
        {
            i++; // invalid.
            continue;
        }
        size = c & 7;
        if (i + size > np)
        {
            i++; // Short or invalid.
            continue;
        }
        accept = acceptRanges[c >> 4];
        c = p[i + 1];
        if (c < accept.lo || accept.hi < c)
        {
            i++;
        }
        else if (size == 2)
        {
            i += size;
        }
        else
        {
            c = p[i + 2];
            if (c < ppp_utf8_locb || ppp_utf8_hicb < c)
            {
                i++;
            }
            else if (size == 3)
            {
                i += size;
            }
            else
            {
                c = p[i + 3];
                if (c < ppp_utf8_locb || ppp_utf8_hicb < c)
                {
                    i++;
                }
                else
                {
                    i += size;
                }
            }
        }
    }
    return n;
}
BOOL ppp_utf8_is_rune(ppp_utf8_rune_t r)
{
    if (0 <= r && r < ppp_utf8_surrogateMin)
    {
        return TRUE;
    }
    else if (ppp_utf8_surrogateMax < r && r <= PPP_UTF8_MAX_RUNE)
    {
        return TRUE;
    }
    return FALSE;
}
BOOL ppp_utf8_is_valid(const uint8_t *p, size_t p_len)
{

    // Fast path. Check for and skip 8 bytes of ASCII characters per iteration.
    uint32_t first32, second32;
    while (p_len >= 8)
    {
        // Combining two 32 bit loads allows the same code to be used
        // for 32 and 64 bit platforms.
        // The compiler can generate a 32bit load for first32 and second32
        // on many platforms. See test/codegen/memcombine.go.
        first32 = (uint32_t)(p[0]) | (uint32_t)(p[1]) << 8 | (uint32_t)(p[2]) << 16 | (uint32_t)(p[3]) << 24;
        second32 = (uint32_t)(p[4]) | (uint32_t)(p[5]) << 8 | (uint32_t)(p[6]) << 16 | (uint32_t)(p[7]) << 24;
        if ((first32 | second32) & 0x80808080 != 0)
        {
            // Found a non ASCII byte (>= RuneSelf).
            break;
        }

        p_len -= 8;
        p += 8;
    }
    size_t n = p_len;
    uint8_t c;
    int size;
    acceptRange_t accept;
    for (size_t i = 0; i < n;)
    {
        c = p[i];
        if (c < PPP_UTF8_RUNE_SELF)
        {
            i++;
            continue;
        }
        c = first[c];
        if (c == ppp_utf8_xx)
        {
            return FALSE; // Illegal starter byte.
        }
        size = c & 7;
        if (i + size > n)
        {
            return FALSE; // Short or invalid.
        }
        accept = acceptRanges[c >> 4];
        c = p[i + 1];
        if (c < accept.lo || accept.hi < c)
        {
            return FALSE;
        }
        else if (size == 2)
        {
            i += size;
        }
        else
        {
            c = p[i + 2];
            if (c < ppp_utf8_locb || ppp_utf8_hicb < c)
            {
                return FALSE;
            }
            else if (size == 3)
            {
                i += size;
            }
            else
            {
                c = p[i + 3];
                if (c < ppp_utf8_locb || ppp_utf8_hicb < c)
                {
                    return FALSE;
                }
                i += size;
            }
        }
    }
    return TRUE;
}