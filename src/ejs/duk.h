#ifndef _EMBEDDED_JS_DUK_H_
#define _EMBEDDED_JS_DUK_H_
#include "../duk/duktape.h"
#include "error.h"

typedef void (*ejs_finally_function)(void *args);

/**
 * Print the current stack, usually used for debugging
 */
void ejs_dump_context_stdout(duk_context *ctx);

void ejs_throw_cause(duk_context *ctx, EJS_ERROR_RET cause, const char *message);
void ejs_throw_cause_format(duk_context *ctx, EJS_ERROR_RET cause, const char *fmt, ...);

/**
 * * ok  ... -> ... retval
 * * err  ...
 */
void ejs_call_function(duk_context *ctx,
                       duk_c_function func, void *args,
                       ejs_finally_function finally_func);

/**
 * * ok  ... -> ... retval
 * * err  ... -> ... err
 */
duk_ret_t ejs_pcall_function(duk_context *ctx,
                             duk_c_function func, void *args);

/**
 * ... string ... -> ...
 */
duk_bool_t ejs_filepath_is_abs(duk_context *ctx, duk_idx_t idx);
/**
 * * ok  ... string ... -> ... string
 * * err ... string ...
 */
void ejs_filepath_clean(duk_context *ctx, duk_idx_t idx);
/**
 * * ok  ... string ... -> ... string
 * * err ... string ...
 */
void ejs_filepath_abs(duk_context *ctx, duk_idx_t idx);
#endif
