#ifndef _EMBEDDED_JS__DUK_ASYNC_H_
#define _EMBEDDED_JS__DUK_ASYNC_H_
#include "duk.h"
#include "internal/buffer.h"

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

typedef struct
{
    int err;
} _ejs_async_return_void_t;
#define EJS_ASYNC_DEFINE_RETURN_VOID _ejs_async_return_void_t result;
duk_ret_t _ejs_async_return_void_impl(duk_context *ctx);
#define EJS_ASYNC_POST_OR_SEND_VOID(ctx, cb) _ejs_async_post_or_send(ctx, cb, _ejs_async_return_void_impl)

typedef struct
{
    int err;
    duk_double_t n;
} _ejs_async_return_number_t;
#define EJS_ASYNC_DEFINE_RETURN_NUMBER _ejs_async_return_number_t result;
duk_ret_t _ejs_async_return_number_impl(duk_context *ctx);
#define EJS_ASYNC_POST_OR_SEND_NUMBER(ctx, cb) _ejs_async_post_or_send(ctx, cb, _ejs_async_return_number_impl)

typedef struct
{
    int err;
    uint8_t *buffer;
    duk_size_t buffer_len;
} _ejs_async_return_uint8array_t;
#define EJS_ASYNC_DEFINE_RETURN_UINT8ARRAY _ejs_async_return_uint8array_t result;
duk_ret_t _ejs_async_return_uint8array_finalizer(duk_context *ctx);
duk_ret_t _ejs_async_return_uint8array_impl(duk_context *ctx);
#define EJS_ASYNC_POST_OR_SEND_UINT8ARRAY(ctx, cb) _ejs_async_post_or_send(ctx, cb, _ejs_async_return_uint8array_impl)
duk_ret_t _ejs_async_return_uint8array_text_impl(duk_context *ctx);
#define EJS_ASYNC_POST_OR_SEND_UINT8ARRAY_TEXT(ctx, cb) _ejs_async_post_or_send(ctx, cb, _ejs_async_return_uint8array_text_impl)

typedef struct
{
    int err;
    ppp_buffer_t buffer;
} _ejs_async_return_buffer_t;
#define EJS_ASYNC_DEFINE_RETURN_BUFFER _ejs_async_return_buffer_t result;
duk_ret_t _ejs_async_return_buffer_finalizer(duk_context *ctx);
#define EJS_ASYNC_PUSH_RETURN_BUFFER(ctx, size) ejs_push_finalizer_object(ctx, size, _ejs_async_return_buffer_finalizer);

#endif