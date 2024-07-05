#ifndef _EMBEDDED_JS__DUK_MODULES__INIT_H_
#define _EMBEDDED_JS__DUK_MODULES__INIT_H_
#include "../../duk/duktape.h"

/**
 * Initialize all built-in modules
 *
 * ... obj -> ... obj
 */
void __ejs_modules_init(duk_context *ctx);

#endif