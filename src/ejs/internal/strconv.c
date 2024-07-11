#include "strconv.h"
#include <stdio.h>

static const char *smallsString = "00010203040506070809"
                                  "10111213141516171819"
                                  "20212223242526272829"
                                  "30313233343536373839"
                                  "40414243444546474849"
                                  "50515253545556575859"
                                  "60616263646566676869"
                                  "70717273747576777879"
                                  "80818283848586878889"
                                  "90919293949596979899";
static const uint8_t host32bit = sizeof(void *) == 4 ? 1 : 0;
static const char *digits = "0123456789abcdefghijklmnopqrstuvwxyz";

static uint8_t trailingZeros32(uint32_t x)
{
    if (x == 0)
    {
        return 32;
    }
    static uint8_t deBruijn32tab[] = {
        0,
        1,
        28,
        2,
        29,
        14,
        24,
        3,
        30,
        22,
        20,
        15,
        25,
        17,
        4,
        8,
        31,
        27,
        13,
        23,
        21,
        19,
        16,
        7,
        26,
        12,
        18,
        6,
        11,
        5,
        10,
        9,
    };

    // see comment in TrailingZeros64
    return deBruijn32tab[(x & -x) * 0x077CB531 >> (32 - 5)];
}
int ppp_strconv_encode(uint8_t *p, const size_t p_len, const void *value, size_t value_len, uint8_t mv)
{
    if (p_len < value_len)
    {
        int n = value_len - p_len;
        return -n;
    }
    if (mv)
    {
        memmove(p, value, value_len);
    }
    else
    {
        memcpy(p, value, value_len);
    }
    return value_len;
}
ppp_c_string_t ppp_strconv_format_bool(const int b)
{
    ppp_c_string_t value = {
        .cap = 0,
    };
    if (b)
    {
        value.str = "true",
        value.len = 4;
    }
    else
    {
        value.str = "false",
        value.len = 5;
    }
    return value;
}
int ppp_strconv_encode_bool(uint8_t *p, const size_t p_len, const int b)
{
    uint8_t *src;
    size_t src_len;
    if (b)
    {
        src = "true";
        src_len = 4;
    }
    else
    {
        src = "false";
        src_len = 5;
    }
    return p ? ppp_strconv_encode(p, p_len, src, src_len, 1) : src_len;
}
int ppp_strconv_append_bool(ppp_c_string_t *s, const int b)
{
    if (s->cap > s->len)
    {
        size_t n = b ? 4 : 5;
        size_t available = s->cap - s->len;
        if (available >= n)
        {
            n = ppp_strconv_encode_bool(s->str + s->len, available, b);
            return 0;
        }
    }
    uint8_t p[5];
    int n = ppp_strconv_encode_bool(s->str + s->len, 5, b);
    if (ppp_c_string_append(s, p, n))
    {
        return -1;
    }
    return 0;
}
int ppp_strconv_parse_bool(const uint8_t *str, const size_t str_len)
{
    switch (str_len)
    {
    case 1:
        switch (str[0])
        {
        case '1':
        case 't':
        case 'T':
            return 1;
        case '0':
        case 'f':
        case 'F':
            return 0;
        }
        break;
    case 4:
        if (!memcmp(str, "true", 4) ||
            !memcmp(str, "TRUE", 4) ||
            !memcmp(str, "True", 4))
        {
            return 1;
        }
        break;
    case 5:
        if (!memcmp(str, "false", 5) ||
            !memcmp(str, "FALSE", 5) ||
            !memcmp(str, "False", 5))
        {
            return 0;
        }
        break;
    }
    return -1;
}

int ppp_strconv_format_bits(ppp_c_string_t *dst, ppp_strconv_format_bits_a_t *ap, uint64_t u, int base, int neg, int append_)
{
    // if (base < 2 || base > 36)
    // {
    //     puts("strconv: illegal AppendInt/FormatInt base");
    //     exit(1);
    // }
    // 2 <= base && base <= len(digits)

    // var a [64 + 1]byte // +1 for sign of 64bit value in base 2
    int i = sizeof(ap->a);
    uint8_t *a = ap->a;
    ap->i = i;

    if (neg)
    {
        u = -u;
    }

    // convert bits
    // We use uint values where we can because those will
    // fit into a single register even on a 32bit machine.
    if (base == 10)
    {
        // common case: use constants for / because
        // the compiler can optimize it into a multiply+shift

        if (host32bit)
        {
            // convert the lower digits using 32bit operations
            uint64_t q;
            uint32_t us, is;
            while (u >= 1e9)
            {
                // Avoid using r = a%b in addition to q = a/b
                // since 64bit division and modulo operations
                // are calculated by runtime functions on 32bit machines.
                q = u / 1e9;
                us = (uint32_t)(u - q * 1e9); // u % 1e9 fits into a uint
                for (int j = 4; j > 0; j--)
                {
                    is = us % 100 * 2;
                    us /= 100;
                    i -= 2;
                    a[i + 1] = smallsString[is + 1];
                    a[i + 0] = smallsString[is + 0];
                }

                // us < 10, since it contains the last digit
                // from the initial 9-digit us.
                i--;
                a[i] = smallsString[us * 2 + 1];

                u = q;
            }
            // u < 1e9

            // u guaranteed to fit into a uint
            us = u;
            while (us >= 100)
            {
                is = us % 100 * 2;
                us /= 100;
                i -= 2;
                a[i + 1] = smallsString[is + 1];
                a[i + 0] = smallsString[is + 0];
            }

            // us < 100
            is = us * 2;
            i--;
            a[i] = smallsString[is + 1];
            if (us >= 10)
            {
                i--;
                a[i] = smallsString[is];
            }
        }
        else
        {
            // u guaranteed to fit into a uint
            uint64_t us = u;
            uint64_t is;
            while (us >= 100)
            {
                is = us % 100 * 2;
                us /= 100;
                i -= 2;
                a[i + 1] = smallsString[is + 1];
                a[i + 0] = smallsString[is + 0];
            }

            // us < 100
            is = us * 2;
            i--;
            a[i] = smallsString[is + 1];
            if (us >= 10)
            {
                i--;
                a[i] = smallsString[is];
            }
        }
    }
    else if ((base & (base - 1)) == 0)
    {
        // Use shifts and masks instead of / and %.
        // Base is a power of 2 and 2 <= base <= len(digits) where len(digits) is 36.
        // The largest power of 2 below or equal to 36 is 32, which is 1 << 5;
        // i.e., the largest possible shift count is 5. By &-ind that value with
        // the constant 7 we tell the compiler that the shift count is always
        // less than 8 which is smaller than any register width. This allows
        // the compiler to generate better code for the shift operation.
        uint64_t shift = trailingZeros32(base) & 7;
        uint64_t b = base;
        uint64_t m = base - 1; // == 1<<shift - 1
        while (u >= b)
        {
            i--;
            a[i] = digits[(uint64_t)(u)&m];
            u >>= shift;
        }
        // u < base
        i--;
        a[i] = digits[u];
    }
    else
    {
        // general case
        uint64_t b = base;
        uint64_t q;
        while (u >= b)
        {
            i--;
            // Avoid using r = a%b in addition to q = a/b
            // since 64bit division and modulo operations
            // are calculated by runtime functions on 32bit machines.
            q = u / b;
            a[i] = digits[(uint)(u - q * b)];
            u = q;
        }
        // u < base
        i--;
        a[i] = digits[(uint)(u)];
    }

    // add sign, if any
    if (neg)
    {
        i--;
        a[i] = '-';
    }

    if (append_)
    {
        // d = append(dst, a [i:]...);
        if (ppp_c_string_append(dst, a + i, 65 - i))
        {
            return -1;
        }
        return 0;
    }
    // s = string(a[i:])
    ap->i = i;
    return 0;
}
ppp_strconv_small_t ppp_strconv_small(int i)
{
    if (i < 10)
    {
        ppp_strconv_small_t val = {
            .s = digits + i,
            .n = 1,
        };
        return val;
    }
    ppp_strconv_small_t val = {
        .s = smallsString + i * 2,
        .n = 2,
    };
    return val;
}
