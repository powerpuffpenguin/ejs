#ifndef _EMBEDDED_JS__DUK_TIMER_H_
#define _EMBEDDED_JS__DUK_TIMER_H_
#include "../duk/duktape.h"
void _ejs_init_timer(duk_context *ctx);
// ... stash -> ... stash
void _ejs_destroy_timer(duk_context *ctx);
#endif