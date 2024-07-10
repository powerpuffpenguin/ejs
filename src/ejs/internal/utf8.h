/**
 * UTF8 processing function ported from golang standard library
 *
 * It is licensed under the MIT license.
 *
 * source:
 *  - utf8.h
 *  - utf8.c
 *  - utf8.c
 *  - utf8.c
 */
#ifndef _PPP_C_UTF8_H_
#define _PPP_C_UTF8_H_

#include <stdint.h>
#include "c_string.h"

#ifndef BOOL
#define BOOL uint8_t
#endif

#ifndef TRUE
#define TRUE 1
#endif

#ifndef FALSE
#define FALSE 0
#endif

typedef int32_t ppp_utf8_rune_t;
/**
 * the "error" Rune or "Unicode replacement character"
 */
#define PPP_UTF8_RUNE_ERROR 65533
/**
 * characters below RuneSelf are represented as themselves in a single byte.
 */
#define PPP_UTF8_RUNE_SELF 0x80
/**
 * Maximum valid Unicode code point.
 */
#define PPP_UTF8_MAX_RUNE 1114111
/**
 * maximum number of bytes of a UTF-8 encoded Unicode character.
 */
#define PPP_UTF8_UTF_MAX 4

/**
 * EncodeRune writes into p the UTF-8 encoding of the rune.
 * If the rune is out of range, it writes the encoding of RuneError.
 * It returns the number(<0 if p_len not enough, The abs value is the missing capacity value) of bytes written.
 * If p is 0, only the length of bytes required for encoding is calculate
 */
int ppp_utf8_encode(uint8_t *p, const size_t p_len, ppp_utf8_rune_t r);
/**
 * returns the number of bytes required to encode the rune. It returns -1 if the rune is not a valid value to encode in UTF-8.
 */
int ppp_utf8_len(ppp_utf8_rune_t r);
/**
 * Unpacks the last UTF-8 encoding in p and returns the rune and
 * its width in bytes. If p is empty it returns (RuneError, 0). Otherwise, if
 * the encoding is invalid, it returns (RuneError, 1). Both are impossible
 * results for correct, non-empty UTF-8.
 *
 * An encoding is invalid if it is incorrect UTF-8, encodes a rune that is
 * out of range, or is not the shortest possible UTF-8 encoding for the
 * value. No other validation is performed.
 */
ppp_utf8_rune_t ppp_utf8_decode_last(const uint8_t *p, const size_t p_len, int *size);
/**
 * Unpacks the first UTF-8 encoding in p and returns the rune and
 * its width in bytes. If p is empty it returns (RuneError, 0). Otherwise, if
 * the encoding is invalid, it returns (RuneError, 1). Both are impossible
 * results for correct, non-empty UTF-8.
 *
 * An encoding is invalid if it is incorrect UTF-8, encodes a rune that is
 * out of range, or is not the shortest possible UTF-8 encoding for the
 * value. No other validation is performed.
 */
ppp_utf8_rune_t ppp_utf8_decode(const uint8_t *p, const size_t p_len, int *size);

#define ppp_utf8_rune_start(b) (((b) & 0xC0) != 0x80 ? 1 : 0)

/**
 * Reports whether the bytes in p begin with a full UTF-8 encoding of a rune.
 * An invalid encoding is considered a full Rune since it will convert as a width-1 error rune.
 */
BOOL ppp_utf8_full(const uint8_t *p, const size_t p_len);
/**
 * Returns the number of runes in p. Erroneous and short
 * encodings are treated as single runes of width 1 byte.
 */
size_t ppp_utf8_count(const uint8_t *p, const size_t p_len);
/**
 * Reports whether r can be legally encoded as UTF-8.
 * Code points that are out of range or a surrogate half are illegal.
 */
BOOL ppp_utf8_is_rune(ppp_utf8_rune_t r);
/**
 * Reports whether p consists entirely of valid UTF-8-encoded runes.
 */
BOOL ppp_utf8_is_valid(const uint8_t *p, size_t p_len);
#endif