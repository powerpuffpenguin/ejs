#ifndef _PPP_C_STRCONV_H_
#define _PPP_C_STRCONV_H_

#include <stdint.h>
#include "c_string.h"

#define PPP_STRCONV_N_SMALLS 100
#define PPP_STRCONV_MIN_BASE 2
#define PPP_STRCONV_MAX_BASE 36

int ppp_strconv_encode(uint8_t *p, const size_t p_len, const void *value, size_t value_len, uint8_t mv);
/**
 * returns "true" or "false" according to the value of b
 */
ppp_c_string_t ppp_strconv_format_bool(const int b);

/**
 * Writes into p the "true" or "false", according to the value of b.
 * It returns the number(<0 if p_len not enough, The abs value is the missing capacity value) of bytes written.
 * If p is 0, only the length of bytes required for encoding is calculate
 */
int ppp_strconv_encode_bool(uint8_t *p, const size_t p_len, const int b);

/**
 * append(s, format_bool(b))
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_strconv_append_bool(ppp_c_string_t *s, const int b);

/**
 * returns the boolean value(1 for true, 0 for false) represented by the string.
 * It accepts 1, t, T, TRUE, true, True, 0, f, F, FALSE, false, False.
 * Any other value returns -1.
 */
int ppp_strconv_parse_bool(const uint8_t *str, const size_t str_len);

typedef struct
{
    uint8_t a[64 + 1];
    int i;
} ppp_strconv_format_bits_a_t;

// formatBits computes the string representation of u in the given base.
// If neg is set, u is treated as negative int64 value. If append_ is
// set, the string is appended to dst and the resulting byte slice is
// returned as the first result value; otherwise the string is returned
// as the second result value.
int ppp_strconv_format_bits(ppp_c_string_t *dst, ppp_strconv_format_bits_a_t *ap, uint64_t u, int base, int neg, int append_);
typedef struct
{
    const uint8_t *s;
    int n;
} ppp_strconv_small_t;
ppp_strconv_small_t ppp_strconv_small(int i);

#define PPP_STRCONV_LOWER(c) ((uint8_t)(c) | ('x' - 'X'))

int ppp_strconv_is_print(int32_t r);
int ppp_strconv_is_graphic(int32_t r);

#endif