#ifndef _EMBEDDED_JS_DUK_H_
#define _EMBEDDED_JS_DUK_H_
#include "../duk/duktape.h"
#include "error.h"
/**
 * Print the current stack, usually used for debugging
 */
void ejs_dump_context_stdout(duk_context *ctx);

void ejs_throw_cause(duk_context *ctx, EJS_ERROR_RET cause, const char *message);
void ejs_throw_cause_format(duk_context *ctx, EJS_ERROR_RET cause, const char *fmt, ...);
#endif