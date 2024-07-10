#ifndef _PPP_C_STRCONV_H_
#define _PPP_C_STRCONV_H_

#include <stdint.h>
#include <string.h>

/**
 * Writes into p the "true" or "false", according to the value of b.
 * It returns the number(<0 if p_len not enough, The abs value is the missing capacity value) of bytes written.
 * If p is 0, only the length of bytes required for encoding is calculate
 */
int ppp_strconv_encode_bool(uint8_t *p, const size_t p_len, const int b);

#endif