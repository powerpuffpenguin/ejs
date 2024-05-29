#ifndef _EMBEDDED_JS__DUK_ASYNC_H_
#define _EMBEDDED_JS__DUK_ASYNC_H_
#include "duk.h"

/**
 * ... opts cb finalizer -> ... finalizer{cb:cb,opts:opts}
 */
void _ejs_async_post_or_send(duk_context *ctx, ejs_async_function_t worker_cb, duk_c_function return_cb);

/**
 * ... finalizer{cb:cb,opts:opts} -> finalizer{cb:cb,opts:opts} cb
 */
void *_ejs_async_return(duk_context *ctx);

/**
 * ... idx{args:finalizer} ... -> ... idx ... finalizer
 */
void *_ejs_async_args(duk_context *ctx, duk_idx_t idx);

#endif