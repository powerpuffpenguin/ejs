#ifndef _EMBEDDED_JS_DUK_H_
#define _EMBEDDED_JS_DUK_H_

#include "../duk/duktape.h"
#include "error.h"

#if defined(__cplusplus)
extern "C"
{
#endif

    typedef void (*ejs_finally_function)(void *args);

    /**
     * Print the current stack, usually used for debugging
     */
    DUK_EXTERNAL void ejs_dump_context_stdout(duk_context *ctx);

    DUK_EXTERNAL void ejs_throw_cause(duk_context *ctx, EJS_ERROR_RET cause, const char *message);
    DUK_EXTERNAL void ejs_throw_cause_format(duk_context *ctx, EJS_ERROR_RET cause, const char *fmt, ...);

    DUK_EXTERNAL void ejs_throw_os(duk_context *ctx, int err, const char *message);
    DUK_EXTERNAL void ejs_throw_os_format(duk_context *ctx, int err, const char *fmt, ...);

    /**
     * * ok  ... -> ... retval
     * * err  ...
     */
    DUK_EXTERNAL void ejs_call_function(duk_context *ctx,
                                        duk_c_function func, void *args,
                                        ejs_finally_function finally_func);

    /**
     * * ok  ... -> ... retval
     * * err  ... -> ... err
     */
    DUK_EXTERNAL duk_ret_t ejs_pcall_function(duk_context *ctx,
                                              duk_c_function func, void *args);

    /**
     * ... string ... -> ...
     */
    DUK_EXTERNAL duk_bool_t ejs_filepath_is_abs(duk_context *ctx, duk_idx_t idx);
    /**
     * * ok  ... string ... -> ... string
     * * err ... string ...
     */
    DUK_EXTERNAL void ejs_filepath_clean(duk_context *ctx, duk_idx_t idx);
    /**
     * * ok  ... string ... -> ... string
     * * err ... string ...
     */
    DUK_EXTERNAL void ejs_filepath_abs(duk_context *ctx, duk_idx_t idx);

#if defined(__cplusplus)
}
#endif
#endif
