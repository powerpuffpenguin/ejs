/**
 * source:
 *  - encoding_hex.h
 *  - encoding_hex.c
 */
#ifndef _PPP_ENCODING_HEX_H_
#define _PPP_ENCODING_HEX_H_

#include <stdlib.h>
#include <stdint.h>

#ifndef BOOL
#define BOOL uint8_t
#endif

#ifndef TRUE
#define TRUE 1
#endif

#ifndef FALSE
#define FALSE 0
#endif

/**
 * Returns the length of an encoding of n source bytes.
 * Specifically, it returns n * 2.
 */
#define PPP_ENCODING_HEX_ENCODED_LEN(n) (n * 2)

/**
 * Returns the length of a decoding of x source bytes.
 * Specifically, it returns x / 2.
 */
#define PPP_ENCODING_HEX_DECODED_LEN(n) (n / 2)

/**
 * Encodes src into src_len*2 bytes of dst.
 * dst should ensure that the length is at least src_len*2
 */
void ppp_encoding_hex_encode(uint8_t *dst, const uint8_t *src, const size_t src_len, BOOL uppercase);

/**
 * Decodes src into src_len/2 bytes,returning the actual number of bytes written to dst.
 * dst should ensure that the length is at least src_len/2.
 * If the return value is not equal to src_len/2, it means a non-hex character was encountered.
 */
size_t ppp_encoding_hex_decode(uint8_t *dst, const uint8_t *src, const size_t src_len);

/**
 * Returns TRUE if the c is a valid hex-encoded character, otherwise returns FALSE
 */
BOOL ppp_encoding_hex_is_valid_char(uint8_t c);
/**
 * Returns TRUE if the s is a valid hex-encoded string, otherwise returns FALSE
 */
BOOL ppp_encoding_hex_is_valid(const uint8_t *s, const size_t s_len);

#endif