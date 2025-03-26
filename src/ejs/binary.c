#include "binary.h"
#include <netinet/in.h>
ejs_binary_t __ejs_binary_cache = {0};
uint8_t __ejs_binary_cache_init = 0;

static uint16_t big_uint16(const uint8_t *b)
{
    return (uint16_t)(b[1]) |
           ((uint16_t)(b[0]) << 8);
}
static uint16_t little_uint16(const uint8_t *b)
{
    return ((uint16_t)(b[1]) << 8) |
           (uint16_t)(b[0]);
}
static void big_put_uint16(uint8_t *b, uint16_t v)
{
    b[1] = (uint8_t)(v);
    b[0] = (uint8_t)(v >> 8);
}
static void little_put_uint16(uint8_t *b, uint16_t v)
{
    b[1] = (uint8_t)(v >> 8);
    b[0] = (uint8_t)(v);
}
static uint32_t big_uint32(const uint8_t *b)
{
    return (uint32_t)(b[3]) |
           ((uint32_t)(b[2]) << 8) |
           ((uint32_t)(b[1]) << 16) |
           ((uint32_t)(b[0]) << 24);
}
static uint32_t little_uint32(const uint8_t *b)
{
    return ((uint32_t)(b[3]) << 24) |
           ((uint32_t)(b[2]) << 16) |
           ((uint32_t)(b[1]) << 8) |
           (uint32_t)(b[0]);
}
static void big_put_uint32(uint8_t *b, uint32_t v)
{
    b[3] = (uint8_t)(v);
    b[2] = (uint8_t)(v >> 8);
    b[1] = (uint8_t)(v >> 16);
    b[0] = (uint8_t)(v >> 24);
}
static void little_put_uint32(uint8_t *b, uint32_t v)
{
    b[3] = (uint8_t)(v >> 24);
    b[2] = (uint8_t)(v >> 16);
    b[1] = (uint8_t)(v >> 8);
    b[0] = (uint8_t)(v);
}
static uint64_t big_uint64(const uint8_t *b)
{
    return (uint64_t)(b[7]) |
           ((uint64_t)(b[6]) << 8) |
           ((uint64_t)(b[5]) << 16) |
           ((uint64_t)(b[4]) << 24) |
           ((uint64_t)(b[3]) << 32) |
           ((uint64_t)(b[2]) << 40) |
           ((uint64_t)(b[1]) << 48) |
           ((uint64_t)(b[0]) << 56);
}
static uint64_t little_uint64(const uint8_t *b)
{
    return ((uint64_t)(b[7]) << 56) |
           ((uint64_t)(b[6]) << 48) |
           ((uint64_t)(b[5]) << 40) |
           ((uint64_t)(b[4]) << 32) |
           ((uint64_t)(b[3]) << 24) |
           ((uint64_t)(b[2]) << 16) |
           ((uint64_t)(b[1]) << 8) |
           (uint64_t)(b[0]);
}
void big_put_uint64(uint8_t *b, uint64_t v)
{
    b[7] = (uint8_t)(v);
    b[6] = (uint8_t)(v >> 8);
    b[5] = (uint8_t)(v >> 16);
    b[4] = (uint8_t)(v >> 24);
    b[3] = (uint8_t)(v >> 32);
    b[2] = (uint8_t)(v >> 40);
    b[1] = (uint8_t)(v >> 48);
    b[0] = (uint8_t)(v >> 56);
}
void little_put_uint64(uint8_t *b, uint64_t v)
{
    b[7] = (uint8_t)(v >> 56);
    b[6] = (uint8_t)(v >> 48);
    b[5] = (uint8_t)(v >> 40);
    b[4] = (uint8_t)(v >> 32);
    b[3] = (uint8_t)(v >> 24);
    b[2] = (uint8_t)(v >> 16);
    b[1] = (uint8_t)(v >> 8);
    b[0] = (uint8_t)(v);
}

void __ejs_binary_init(ejs_binary_t *o)
{
    ejs_byte_order_t *little, *big;

    uint16_t hport = 0x8000;
    uint16_t nport = htons(hport);
    if (hport == nport)
    {
        // system is big endian
        little = &o->big;
        big = &o->little;
    }
    else
    {
        // system is little endian
        big = &o->big;
        little = &o->little;
    }

    // Set the default implementation function on little-endian systems
    big->uint16 = big_uint16;
    big->put_uint16 = big_put_uint16;
    big->uint32 = big_uint32;
    big->put_uint32 = big_put_uint32;
    big->uint64 = big_uint64;
    big->put_uint64 = big_put_uint64;

    little->uint16 = little_uint16;
    little->put_uint16 = little_put_uint16;
    little->uint32 = little_uint32;
    little->put_uint32 = little_put_uint32;
    little->uint64 = little_uint64;
    little->put_uint64 = little_put_uint64;
}

DUK_EXTERNAL ejs_binary_t *ejs_get_binary()
{
    if (!__ejs_binary_cache_init)
    {
        ejs_binary_t o;
        __ejs_binary_init(&o);
        __ejs_binary_cache = o;

        __ejs_binary_cache_init = 1;
    }
    return &__ejs_binary_cache;
}