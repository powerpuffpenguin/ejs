/**
 * source:
 *  - encoding_binary.h
 *  - encoding_binary.c
 */
#ifndef _PPP_ENCODING_BINARY_H_
#define _PPP_ENCODING_BINARY_H_

#include <stdint.h>
void ppp_encoding_binary_big_endian_put_uint16(uint8_t *b, const uint16_t v);
void ppp_encoding_binary_big_endian_put_uint32(uint8_t *b, const uint32_t v);
void ppp_encoding_binary_big_endian_put_uint64(uint8_t *b, const uint64_t v);
uint16_t ppp_encoding_binary_big_endian_uint16(const uint8_t *b);
uint32_t ppp_encoding_binary_big_endian_uint32(const uint8_t *b);
uint64_t ppp_encoding_binary_big_endian_uint64(const uint8_t *b);

void ppp_encoding_binary_little_endian_put_uint16(uint8_t *b, const uint16_t v);
void ppp_encoding_binary_little_endian_put_uint32(uint8_t *b, const uint32_t v);
void ppp_encoding_binary_little_endian_put_uint64(uint8_t *b, const uint64_t v);
uint16_t ppp_encoding_binary_little_endian_uint16(const uint8_t *b);
uint32_t ppp_encoding_binary_little_endian_uint32(const uint8_t *b);
uint64_t ppp_encoding_binary_little_endian_uint64(const uint8_t *b);

#endif
