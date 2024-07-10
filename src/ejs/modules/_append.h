#ifndef _EMBEDDED_JS__DUK_MODULES__APPEND_H_
#define _EMBEDDED_JS__DUK_MODULES__APPEND_H_

#include "../../duk/duktape.h"

typedef void (*__ejs__modules_append_get)(duk_context *ctx, duk_idx_t idx, void *value);
typedef int (*__ejs__modules_encode)(void *dst, size_t dst_len, void *value);
/**
 * (values:Array<any>, buf?:Unit8Array, len?: number)=>[Uint8Array,number]
 */
duk_ret_t __ejs__modules_append(
    duk_context *ctx,
    void *value, size_t min_element,
    __ejs__modules_append_get get_at,
    __ejs__modules_encode encode);

/**
 * (value:Unit8Array, buf?:Unit8Array, len?: number)=>[Uint8Array,number]
 */
duk_ret_t __ejs__modules_append_value(duk_context *ctx);
#endif