#ifndef _EMBEDDED_JS__DUK_H_
#define _EMBEDDED_JS__DUK_H_
#include "../duk/duktape.h"

void _ejs_init_base(duk_context *ctx);
void _ejs_init_extras(duk_context *ctx);

#endif