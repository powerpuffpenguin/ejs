#include "modules_shared.h"
#include "../js/encoding_base64.h"
#include "../binary.h"
#include <errno.h>
static duk_size_t encoded_len(duk_size_t n, duk_bool_t padding)
{
    if (padding)
    {
        return (n + 2) / 3 * 4; // minimum # 4-char quanta, 3 bytes each
    }
    return (n * 8 + 5) / 6; // minimum # chars at 6 bits per char
}
static duk_size_t decoded_len(duk_size_t n, duk_bool_t padding)
{
    if (padding)
    {
        return n / 4 * 3; // Padded base64 should always be a multiple of 4 characters in length.
    }
    return n % 4 == 1 ? 0 : n * 6 / 8; // Unpadded data may end with partial block of 2-3 characters.
}
/**
 * Perform base64 encoding
 * @param dst Encoded output target, the caller needs to ensure that it is of sufficient length
 * @param src Original text to be encoded
 * @param src_len length of src
 * @param pading Padding character, if it is 0, no padding will be performed. The standard padding character is '='
 * @param encode The 64-byte encoding value should be "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" in the standard algorithm
 */
static duk_size_t base64_encode(uint8_t *dst,
                                const uint8_t *src, duk_size_t src_len,
                                const uint8_t pading,
                                const uint8_t *encode)
{
    duk_size_t ret = pading ? ((src_len + 2) / 3 * 4) : (src_len * 8 + 5) / 6;
    if (ret && dst)
    {
        size_t di = 0, si = 0;
        size_t n = (src_len / 3) * 3;
        uint32_t val;
        while (src_len >= 3)
        {
            dst[0] = encode[src[0] >> 2];
            dst[1] = encode[((src[0] & 0x3) << 4) | (src[1] >> 4)];
            dst[2] = encode[((src[1] & 0xF) << 2) | (src[2] >> 6)];
            dst[3] = encode[src[2] & 0x3F];

            src_len -= 3;
            src += 3;
            dst += 4;
        }
        switch (src_len)
        {
        case 1:
            dst[0] = encode[src[0] >> 2];
            dst[1] = encode[((src[0] & 0x3) << 4)];
            if (pading)
            {
                dst[2] = pading;
                dst[3] = pading;
            }
            break;
        case 2:
            dst[0] = encode[src[0] >> 2];
            dst[1] = encode[((src[0] & 0x3) << 4) | (src[1] >> 4)];
            dst[2] = encode[((src[1] & 0xF) << 2)];
            if (pading)
            {
                dst[3] = pading;
            }
            break;
        }
    }
    return ret;
}
/**
 * Perform base64 decoding
 * @param dst Decoded output target, the caller needs to ensure that it is of sufficient length
 * @param src What to decode
 * @param src_len length of src
 * @param pading Padding character, if it is 0, no padding will be performed. The standard padding character is '='
 * @param decode 256-byte decoding index, memset(decode, 0xFF, 256); for(int i=0;i<64;i++) decode[encode[i]]=i;
 */
static duk_size_t base64_decode(uint8_t *dst,
                                const uint8_t *src, duk_size_t src_len,
                                const uint8_t pading,
                                const uint8_t *decode)
{
    if (!src_len)
    {
        return 0;
    }
    if (pading)
    {
        if ((src_len % 4))
        {
            return 0; // 填充時 src_len 顯然必須4的整數倍才合法
        }
    }
    else
    {
        if (src_len % 4 == 1)
        {
            return 0; // 非填充時，只會剩餘 2 or 3 個字節，剩餘 1 字節顯然不是 合法 編碼值
        }
    }
    duk_size_t ret = pading ? (src_len / 4 * 3) : (src_len * 6 / 8);
    if (ret && dst)
    {
        ret = 0;
        uint8_t s[4];
        uint8_t j;
        const uint8_t *p = dst;
        // 執行 n-1 次解碼
        duk_size_t count = (pading ? src_len : src_len + 3) / 4;
        for (duk_size_t i = 1; i < count; i++)
        {
            for (j = 0; j < 4; j++)
            {
                s[j] = decode[src[j]];
                if (s[j] == 0xff)
                {
                    // 中途遇到填充 顯然不合法
                    return ret;
                }
            }
            dst[0] = (s[0] << 2) | (s[1] >> 4);
            dst[1] = (s[1] << 4) | (s[2] >> 2);
            dst[2] = (s[2] << 6) | (s[3]);

            dst += 3;
            src += 4;
            src_len -= 4;
            ret += 3;
        }
        // 執行最後一次解碼，要考慮 填充字符或非填充情況下 src 長度不足 4
        if (pading)
        {
            for (j = 0; j < 4; j++)
            {
                s[j] = decode[src[j]];
                if (s[j] == 0xff)
                {
                    if (src[j] != pading || j < 2) // 不是填充符或在最後兩字節填充
                    {
                        return ret;
                    }
                }
            }
            if (s[2] == 0xff) // 填充了兩個字符
            {
                dst[0] = (s[0] << 2) | (s[1] >> 4);
                if (s[3] != 0xff) // 必須連續兩個相同填充
                {
                    return ret;
                }
                ret++;
            }
            else if (s[3] == 0xff) // 填充了一個字符
            {
                dst[0] = (s[0] << 2) | (s[1] >> 4);
                dst[1] = (s[1] << 4) | (s[2] >> 2);
                ret += 2;
            }
            else // 沒有填充字符
            {
                dst[0] = (s[0] << 2) | (s[1] >> 4);
                dst[1] = (s[1] << 4) | (s[2] >> 2);
                dst[2] = (s[2] << 6) | (s[3]);
                ret += 3;
            }
        }
        else
        {
            for (j = 0; j < src_len; j++)
            {
                s[j] = decode[src[j]];
                if (s[j] == 0xff)
                {
                    return ret;
                }
            }
            switch (src_len)
            {
            case 2: // 需要填充兩個字符
                dst[0] = (s[0] << 2) | (s[1] >> 4);
                ret++;
                break;
            case 3: // 需要填充一個字符
                dst[0] = (s[0] << 2) | (s[1] >> 4);
                dst[1] = (s[1] << 4) | (s[2] >> 2);
                ret += 2;
                break;
            case 4: // 不需要填充
                dst[0] = (s[0] << 2) | (s[1] >> 4);
                dst[1] = (s[1] << 4) | (s[2] >> 2);
                dst[2] = (s[2] << 6) | (s[3]);
                ret += 3;
                break;
            }
        }
    }
    return ret;
}

static duk_ret_t encodedLen(duk_context *ctx)
{
    duk_bool_t padding = duk_require_boolean(ctx, 1);
    duk_size_t n;
    if (duk_is_number(ctx, 0))
    {
        n = duk_require_number(ctx, 0);
    }
    else
    {
        const uint8_t *s;
        if (duk_is_string(ctx, 0))
        {
            duk_require_lstring(ctx, 0, &n);
        }
        else
        {
            duk_require_buffer_data(ctx, 0, &n);
        }
    }
    duk_pop_2(ctx);
    duk_push_number(ctx, encoded_len(n, padding));
    return 1;
}
static duk_ret_t decodedLen(duk_context *ctx)
{
    duk_bool_t padding = duk_require_boolean(ctx, 1);
    duk_size_t n;
    if (duk_is_number(ctx, 0))
    {
        n = duk_require_number(ctx, 0);
    }
    else
    {
        const uint8_t *s;
        if (duk_is_string(ctx, 0))
        {
            duk_require_lstring(ctx, 0, &n);
        }
        else
        {
            duk_require_buffer_data(ctx, 0, &n);
        }
    }
    duk_pop_2(ctx);
    duk_push_number(ctx, decoded_len(n, padding));
    return 1;
}

static duk_ret_t createDecode(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = duk_require_lstring(ctx, 0, &s_len);
    if (s_len < 64)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "base64 encoding alphabet is not 64-bytes long");
        duk_throw(ctx);
    }
    uint8_t *decode = duk_push_buffer(ctx, 256, 0);
    memset(decode, 0xff, 256);
    for (uint8_t i = 0; i < 64; i++)
    {
        decode[s[i]] = i;
    }
    return 1;
}
static duk_ret_t createPadding(duk_context *ctx)
{
    duk_int_t padding = 0;
    duk_size_t s_len;
    const uint8_t *s;
    if (duk_is_number(ctx, 1))
    {
        padding = duk_require_int(ctx, 1);
        if (0 == padding)
        {
            duk_push_number(ctx, 0);
            return 1;
        }
    }
    else
    {
        s = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &s_len);
        if (0 == s_len || 0 == s[0])
        {
            duk_push_number(ctx, 0);
            return 1;
        }
        padding = s[0];
    }

    if (padding == '\r' || padding == '\n' || padding > 0xff)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "base64 invalid padding");
        duk_throw(ctx);
    }

    s = duk_require_lstring(ctx, 0, &s_len);
    for (int i = 0; i < 64; i++)
    {
        if (s[i] == padding)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "padding contained in alphabet");
            duk_throw(ctx);
        }
    }
    duk_push_number(ctx, padding);
    return 1;
}
static duk_ret_t encode(duk_context *ctx)
{
    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 0, &dst_len);
    duk_size_t src_len;
    const uint8_t *src = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &src_len);
    const uint8_t *encode = duk_require_lstring(ctx, 2, 0);
    uint8_t padding = duk_require_number(ctx, 3);
    duk_pop_n(ctx, 4);

    duk_size_t n = encoded_len(src_len, padding ? 1 : 0);
    if (n == 0)
    {
        duk_push_number(ctx, 0);
        return 1;
    }
    else if (dst_len < n)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "dst not enough buffer");
        duk_throw(ctx);
    }
    duk_push_number(ctx, base64_encode(dst, src, src_len, padding, encode));
    return 1;
}
static duk_ret_t encodeToString(duk_context *ctx)
{
    duk_size_t src_len;
    const uint8_t *src = EJS_REQUIRE_CONST_LSOURCE(ctx, 0, &src_len);
    const uint8_t *encode = duk_require_lstring(ctx, 1, 0);
    uint8_t padding = duk_require_number(ctx, 2);
    duk_pop_n(ctx, 3);

    size_t n = encoded_len(src_len, padding ? 1 : 0);
    if (n == 0)
    {
        duk_push_lstring(ctx, "", 0);
        return 1;
    }
    uint8_t *dst = duk_push_buffer(ctx, n, 0);
    base64_encode(dst, src, src_len, padding, encode);
    duk_buffer_to_string(ctx, -1);
    return 1;
}

static duk_ret_t decode(duk_context *ctx)
{
    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 0, &dst_len);
    duk_size_t src_len;
    const uint8_t *src = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &src_len);
    const uint8_t *dencode = duk_require_buffer_data(ctx, 2, 0);
    uint8_t padding = duk_require_number(ctx, 3);
    duk_pop_n(ctx, 4);

    duk_size_t n = decoded_len(src_len, padding ? 1 : 0);
    if (dst_len < n)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "dst not enough buffer");
        duk_throw(ctx);
    }
    n = base64_decode(dst, src, src_len, padding, dencode);
    duk_push_number(ctx, n);
    return 1;
}
EJS_SHARED_MODULE__DECLARE(encoding_base64)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx,
                     js_ejs_js_encoding_base64_min_js,
                     js_ejs_js_encoding_base64_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, encodedLen, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "encodedLen", 10);
        duk_push_c_lightfunc(ctx, decodedLen, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "decodedLen", 10);

        duk_push_c_lightfunc(ctx, createDecode, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "createDecode", 12);
        duk_push_c_lightfunc(ctx, createPadding, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "createPadding", 13);

        duk_push_c_lightfunc(ctx, encode, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "encode", 6);

        duk_push_c_lightfunc(ctx, encodeToString, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "encodeToString", 14);

        duk_push_c_lightfunc(ctx, decode, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "decode", 6);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */

    duk_call(ctx, 3);
    return 0;
}