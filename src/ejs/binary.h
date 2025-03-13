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

    } ejs_binary_t;

    /**
     * Returns binary encoder
     */
    DUK_EXTERNAL ejs_binary_t *ejs_get_binary();
#if defined(__cplusplus)
}
#endif

#endif