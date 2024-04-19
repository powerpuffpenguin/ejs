#ifndef _EMBEDDED_JS__DUK_H_
#define _EMBEDDED_JS__DUK_H_
#include "../duk/duktape.h"

void _ejs_init(duk_context *ctx);

// ... string ... -> ... string
void _ejs_path_clean(duk_context *ctx);

#endif