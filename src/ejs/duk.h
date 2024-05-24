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
    DUK_EXTERNAL void ejs_throw_os_errno(duk_context *ctx);

    /**
     * * ok  ... -> ... retval
     * * err  ...
     */
    DUK_EXTERNAL void ejs_call_function(duk_context *ctx,
                                        duk_c_function func, void *args,
                                        ejs_finally_function finally_func);
    /**
     * * ok  ... -> ... retval
     * * err  exit(1)
     */
    DUK_EXTERNAL void ejs_call_callback(duk_context *ctx,
                                        duk_c_function func, void *args,
                                        ejs_finally_function finally_func);
    /**
     * * ok  ... -> ... retval
     * * err  exit(1)
     */
    DUK_EXTERNAL void ejs_call_callback_noresult(duk_context *ctx,
                                                 duk_c_function func, void *args,
                                                 ejs_finally_function finally_func);
    /**
     * * ok  ... -> ...
     * * err  ... -> ... err
     */
    DUK_EXTERNAL duk_int_t ejs_pcall_function(duk_context *ctx,
                                              duk_c_function func, void *args);

    /**
     * * ok  ... -> ... retval
     * * err  ... -> ... err
     */
    DUK_EXTERNAL duk_int_t ejs_pcall_function_n(duk_context *ctx,
                                                duk_c_function func, void *args, duk_idx_t n);
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

    /**
     * Store the object associated with c into stash so that it can be called back later
     * * ok ... {p:pointer} -> ... {p:pointer}
     * * err ... {p:pointer}
     */
    DUK_EXTERNAL void *ejs_stash_put_pointer(duk_context *ctx, const char *key, duk_size_t key_len);
    /**
     * The object addresses associated with c are stored in stash to call back the js function. This function deletes these objects from stash.
     * * ok ... {p:pointer} -> ... {p:pointer}
     * * err ... {p:pointer}
     */
    DUK_EXTERNAL void *ejs_stash_delete_pointer(duk_context *ctx,
                                                duk_bool_t clear_finalizer,
                                                const char *key, duk_size_t key_len);
    /**
     * The object addresses associated with c are stored in stash to call back the js function. This function deletes these objects from stash.
     * * ok  true(found) ... -> ... {p:pointer}
     * * ok false(not found) ... -> ...
     * * err ...
     */
    DUK_EXTERNAL duk_bool_t ejs_stash_get_pointer(duk_context *ctx,
                                                  void *pointer,
                                                  const char *key, duk_size_t key_len);
    /**
     * like ejs_stash_get_pointer, but will delete pointer from stash
     */
    DUK_EXTERNAL duk_bool_t ejs_stash_pop_pointer(duk_context *ctx,
                                                  void *pointer,
                                                  const char *key, duk_size_t key_len);

    /**
     * ... exports:{module_destroy:()=>void} -> ... exports
     */
    DUK_EXTERNAL void ejs_stash_set_module_destroy(duk_context *ctx);

    /**
     * free(obj.p)
     */
    DUK_EXTERNAL duk_ret_t ejs_default_finalizer(duk_context *ctx);

    typedef void (*ejs_async_function_t)(void *userdata);
    /**
     * Execute worker_cb in the asynchronous thread, and after worker_cb returns, execute return_cb in the main thread of the script.
     * Throw an error if the worker thread reaches the upper limit.
     */
    DUK_EXTERNAL void ejs_async_post(duk_context *ctx, ejs_async_function_t worker_cb, ejs_async_function_t return_cb, void *userdata);
    /**
     * Execute worker_cb in the asynchronous thread, and after worker_cb returns, execute return_cb in the main thread of the script.
     * If the worker thread reaches the upper limit, it blocks and waits for the idle thread.
     */
    DUK_EXTERNAL void ejs_async_send(duk_context *ctx, ejs_async_function_t worker_cb, ejs_async_function_t return_cb, void *userdata);

    /**
     * ... {p?:pointer} -> ...
     * Execute worker_cb in the asynchronous thread, and after worker_cb returns, execute return_cb in the main thread of the script.
     * Throw an error if the worker thread reaches the upper limit.
     */
    DUK_EXTERNAL void ejs_async_cb_post(duk_context *ctx,
                                        ejs_async_function_t worker_cb,
                                        duk_c_function return_cb);
    /**
     * ... {p?:pointer} -> ...
     * Execute worker_cb in the asynchronous thread, and after worker_cb returns, execute return_cb in the main thread of the script.
     * If the worker thread reaches the upper limit, it blocks and waits for the idle thread.
     */
    DUK_EXTERNAL void ejs_async_cb_send(duk_context *ctx,
                                        ejs_async_function_t worker_cb,
                                        duk_c_function return_cb);

    /**
     * ok ... -> ... {p:pointer}
     * err ...
     */
    DUK_EXTERNAL void *ejs_new_finalizer_object(duk_context *ctx, duk_size_t sz, duk_c_function finalizer);
#if defined(__cplusplus)
}
#endif
#endif
