#ifndef _EMBEDDED_JS__DUK_HELPER_H_
#define _EMBEDDED_JS__DUK_HELPER_H_

#include "../duk/duktape.h"

#define EJS_HEX_DIGIT "0123456789abcdef"

// (a:buffer,b:buffer)=>bool
duk_ret_t _ejs_helper_bytes_equal(duk_context *ctx);

// ... -> ... string
void _ejs_helper_c_hex_string(duk_context *ctx, const uint8_t *b, const duk_size_t length);
// (b:buffer)=>string
duk_ret_t _ejs_helper_hex_string(duk_context *ctx);

#endif