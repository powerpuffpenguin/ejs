#include "strconv.h"

static int __ppp_strconv_encode(
    uint8_t *p, const size_t p_len,
    const uint8_t *src, size_t src_len,
    uint8_t mv)
{
    if (p_len < src_len)
    {
        int n = src_len - p_len;
        return -n;
    }
    if (mv)
    {
        memmove(p, src, src_len);
    }
    else
    {
        memcpy(p, src, src_len);
    }
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
    return p ? __ppp_strconv_encode(p, p_len, src, src_len, 1) : src_len;
}