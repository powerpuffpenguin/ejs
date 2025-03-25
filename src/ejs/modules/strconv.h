#ifndef _EMBEDDED_JS_MODULE_STRCONV_H_
#define _EMBEDDED_JS_MODULE_STRCONV_H_

#include "../../duk/duktape.h"

#if defined(__cplusplus)
extern "C"
{
#endif
    uint64_t __ejs_private_parse_uint(
        duk_context *ctx,
        const uint8_t *s, size_t s_len,
        int base, int bitSize,
        duk_bool_t isuint);
    int64_t __ejs_private_parse_int(
        duk_context *ctx,
        const uint8_t *s, size_t s_len,
        int base, int bitSize);
#if defined(__cplusplus)
}
#endif

#endif // _EMBEDDED_JS_MODULE_STRCONV_H_