#ifndef _EMBEDDED_JS__DUK_HELPER_H_
#define _EMBEDDED_JS__DUK_HELPER_H_

#include "../duk/duktape.h"
#include <sys/stat.h>

#define EJS_HEX_DIGIT "0123456789abcdef"

// (a:buffer,b:buffer)=>bool
duk_ret_t _ejs_helper_bytes_equal(duk_context *ctx);

// (dst:buffer,src:buffer)=>number
duk_ret_t _ejs_helper_bytes_copy(duk_context *ctx);

// ... -> ... string
void _ejs_helper_c_hex_string(duk_context *ctx, const uint8_t *b, const duk_size_t length);
// (b:buffer)=>string
duk_ret_t _ejs_helper_hex_string(duk_context *ctx);

// (b:evbuffer)=>number
duk_ret_t _ejs_evbuffer_len(duk_context *ctx);
// (b:evbuffer,dst:Uint8Array)=>number
duk_ret_t _ejs_evbuffer_read(duk_context *ctx);
// (b:evbuffer,dst:Uint8Array,skip?:number)=>number
duk_ret_t _ejs_evbuffer_copy(duk_context *ctx);
// (b:evbuffer,n:number)=>number
duk_ret_t _ejs_evbuffer_drain(duk_context *ctx);

/**
 * Open a file for reading and return stat
 */
int _ejs_open_file(const char *path, struct stat *info);

/**
 * Read n bytes from archive
 * success return 0, fail return -1
 */
int _ejs_read_fd(int fd, void *buf, size_t n);

/**
 * ... -> ... Uint8Array
 */
duk_ret_t _ejs_read_file(duk_context *ctx, const char *name);
/**
 * ... -> ... Uint8Array
 */
duk_ret_t _ejs_read_text_file(duk_context *ctx, const char *name);

/**
 * ... {post?:boolean}, cb -> ...
 */
duk_ret_t _ejs_async_read_file(duk_context *ctx, const char *name);
/**
 * ... {post?:boolean}, cb -> ... Uint8Array
 */
duk_ret_t _ejs_async_read_text_file(duk_context *ctx, const char *name);

/**
 * ... {} ... -> ... {} ...
 */
const char *_ejs_require_lprop_lstring(
    duk_context *ctx, duk_idx_t idx,
    const char *key, duk_size_t key_len,
    duk_size_t *out_len);
/**
 * ... {} ... -> ... {} ...
 */
duk_double_t _ejs_require_lprop_number(
    duk_context *ctx, duk_idx_t idx,
    const char *key, duk_size_t key_len);

/**
 * ... {} ... -> ... {} ...
 */
duk_bool_t _ejs_require_lprop_bool(
    duk_context *ctx, duk_idx_t idx,
    const char *key, duk_size_t key_len);

#endif