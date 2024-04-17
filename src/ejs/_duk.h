#ifndef _EMBEDDED_JS__DUK_H_
#define _EMBEDDED_JS__DUK_H_
#include "../duk/duktape.h"
void _ejs_dump_context_stdout(duk_context *ctx);
// ... message, cause
duk_ret_t _ejs_init(duk_context *ctx);

#endif