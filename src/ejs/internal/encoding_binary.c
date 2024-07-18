#include "encoding_binary.h"

void ppp_encoding_binary_big_endian_put_uint16(uint8_t *b, const uint16_t v)
{
    b[1] = (uint8_t)(v);
    b[0] = (uint8_t)(v >> 8);
}
void ppp_encoding_binary_big_endian_put_uint32(uint8_t *b, const uint32_t v)
{
    b[3] = (uint8_t)(v);
    b[0] = (uint8_t)(v >> 24);
    b[1] = (uint8_t)(v >> 16);
    b[2] = (uint8_t)(v >> 8);
}
void ppp_encoding_binary_big_endian_put_uint64(uint8_t *b, const uint64_t v)
{
    b[7] = (uint8_t)(v);
    b[0] = (uint8_t)(v >> 56);
    b[1] = (uint8_t)(v >> 48);
    b[2] = (uint8_t)(v >> 40);
    b[3] = (uint8_t)(v >> 32);
    b[4] = (uint8_t)(v >> 24);
    b[5] = (uint8_t)(v >> 16);
    b[6] = (uint8_t)(v >> 8);
}
uint16_t ppp_encoding_binary_big_endian_uint16(const uint8_t *b)
{
    return ((uint16_t)b[1]) |
           (((uint16_t)(b[0])) << 8);
}
uint32_t ppp_encoding_binary_big_endian_uint32(const uint8_t *b)
{
    return ((uint32_t)(b[3])) |
           (((uint32_t)(b[2])) << 8) |
           (((uint32_t)(b[1])) << 16) |
           (((uint32_t)(b[0])) << 24);
}
uint64_t ppp_encoding_binary_big_endian_uint64(const uint8_t *b)
{
    return ((uint64_t)(b[7])) |
           (((uint64_t)(b[6])) << 8) |
           (((uint64_t)(b[5])) << 16) |
           (((uint64_t)(b[4])) << 24) |
           (((uint64_t)(b[3])) << 32) |
           (((uint64_t)(b[2])) << 40) |
           (((uint64_t)(b[1])) << 48) |
           (((uint64_t)(b[0])) << 56);
}
void ppp_encoding_binary_little_endian_put_uint16(uint8_t *b, const uint16_t v)
{
    b[1] = (uint8_t)(v >> 8);
    b[0] = (uint8_t)(v);
}
void ppp_encoding_binary_little_endian_put_uint32(uint8_t *b, const uint32_t v)
{
    b[3] = (uint8_t)(v >> 24);
    b[0] = (uint8_t)(v);
    b[1] = (uint8_t)(v >> 8);
    b[2] = (uint8_t)(v >> 16);
}
void ppp_encoding_binary_little_endian_put_uint64(uint8_t *b, const uint64_t v)
{
    b[7] = (uint8_t)(v >> 56);
    b[0] = (uint8_t)(v);
    b[1] = (uint8_t)(v >> 8);
    b[2] = (uint8_t)(v >> 16);
    b[3] = (uint8_t)(v >> 24);
    b[4] = (uint8_t)(v >> 32);
    b[5] = (uint8_t)(v >> 40);
    b[6] = (uint8_t)(v >> 48);
}
uint16_t ppp_encoding_binary_little_endian_uint16(const uint8_t *b)
{
    return (((uint16_t)(b[1])) << 8) |
           ((uint16_t)(b[0]));
}
uint32_t ppp_encoding_binary_little_endian_uint32(const uint8_t *b)
{
    return (((uint32_t)(b[3])) << 24) |
           ((uint32_t)(b[0])) |
           (((uint32_t)(b[1])) << 8) |
           (((uint32_t)(b[2])) << 16);
}
uint64_t ppp_encoding_binary_little_endian_uint64(const uint8_t *b)
{
    return (((uint64_t)(b[7])) << 56) |
           ((uint64_t)(b[0])) |
           (((uint64_t)(b[1])) << 8) |
           (((uint64_t)(b[2])) << 16) |
           (((uint64_t)(b[3])) << 24) |
           (((uint64_t)(b[4])) << 32) |
           (((uint64_t)(b[5])) << 40) |
           (((uint64_t)(b[6])) << 48);
}