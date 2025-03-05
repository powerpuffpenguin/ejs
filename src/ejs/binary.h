#ifndef _EMBEDDED_JS_BINARY_H_
#define _EMBEDDED_JS_BINARY_H_

#include "duk.h"

#if defined(__cplusplus)
extern "C"
{
#endif
#include <stdint.h>
    /**
     * specifies how to convert byte slices into 16-, 32-, or 64-bit unsigned integers.
     */
    typedef struct
    {
        uint16_t (*uint16)(uint8_t *b);
        uint32_t (*uint32)(uint8_t *b);
        uint64_t (*uint64)(uint8_t *b);
        void (*put_uint16)(uint8_t *b, uint16_t v);
        void (*put_uint32)(uint8_t *b, uint32_t v);
        void (*put_uint64)(uint8_t *b, uint64_t v);
    } ejs_byte_order_t;

    /**
     * A codec interface
     */
    typedef struct
    {
        /**
         * Calculate how many bytes need to be prepared to store the encoding result
         */
        size_t (*encoded_len)(size_t n);
        /**
         * Encode src to dst, you can pass NULL for dst to just calculate how many bytes dst needs to prepare for writing
         */
        size_t (*encode)(uint8_t *dst, const uint8_t *src, size_t src_len);
        /**
         * Calculate how many bytes need to be prepared to store the decoding result
         */
        size_t (*decoded_len)(size_t n);
        /**
         * Decode src to dst. You can pass NULL for dst to only calculate how many bytes dst needs to prepare for writing. If src is not a legal encoding value, 0 will be returned.
         */
        size_t (*decode)(uint8_t *dst, const uint8_t *src, size_t src_len);
    } ejs_encode_t;

    DUK_EXTERNAL size_t ejs_base64_encoded_len(size_t n);
    DUK_EXTERNAL size_t ejs_base64_encoded_len_no_padding(size_t n);
    DUK_EXTERNAL size_t ejs_base64_decoded_len(size_t n);
    DUK_EXTERNAL size_t ejs_base64_decoded_len_no_padding(size_t n);
    /**
     * Perform base64 encoding
     * @param dst Encoded output target, the caller needs to ensure that it is of sufficient length
     * @param src Original text to be encoded
     * @param src_len length of src
     * @param pading Padding character, if it is 0, no padding will be performed. The standard padding character is '='
     * @param encode The 64-byte encoding value should be "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/" in the standard algorithm
     */
    DUK_EXTERNAL size_t ejs_base64_encode(uint8_t *dst,
                                          const uint8_t *src, size_t src_len,
                                          const uint8_t pading,
                                          const uint8_t *encode);
    /**
     * Perform base64 decoding
     * @param dst Decoded output target, the caller needs to ensure that it is of sufficient length
     * @param src What to decode
     * @param src_len length of src
     * @param pading Padding character, if it is 0, no padding will be performed. The standard padding character is '='
     * @param decode 256-byte decoding index, memset(decode, 0xFF, 256); for(int i=0;i<64;i++) decode[encode[i]]=i;
     */
    DUK_EXTERNAL size_t ejs_base64_decode(uint8_t *dst,
                                          const uint8_t *src, size_t src_len,
                                          const uint8_t pading,
                                          const uint8_t *decode);

    /**
     * Provides basic binary encoding functions
     */
    typedef struct
    {
        /**
         * a little-endian implementation of ejs_byte_order_t
         */
        ejs_byte_order_t little;
        /**
         * a big-endian implementation of ejs_byte_order_t
         */
        ejs_byte_order_t big;

        const char *base64_encode_std;
        const char *base64_encode_url;
        char base64_decode_std[256];
        char base64_decode_url[256];

        ejs_encode_t base64_std;
        ejs_encode_t base64_std_raw;
        ejs_encode_t base64_url;
        ejs_encode_t base64_url_raw;
    } ejs_binary_t;

    /**
     * Returns binary encoder
     */
    DUK_EXTERNAL ejs_binary_t *ejs_get_binary();
#if defined(__cplusplus)
}
#endif

#endif