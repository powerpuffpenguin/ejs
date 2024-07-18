#ifndef _EMBEDDED_JS__DUK_MODULES__SHARED_H_
#define _EMBEDDED_JS__DUK_MODULES__SHARED_H_

#include "modules_declare.h"

#include "../config.h"
#include "../defines.h"
#include "../stash.h"
#include "../duk.h"
#include "../_duk_helper.h"
#include "../_duk_async.h"
#include "../_duk_rand.h"

#include "../internal/buffer.h"
#include "../internal/c_filepath.h"
#include "../internal/c_string.h"
#include "../internal/encoding_hex.h"
#include "../internal/encoding_binary.h"

#define EJS_SHARED_UPPER_HEX_DIGIT "0123456789ABCDEF";
#define EJS_SHARED_LOWER_HEX_DIGIT "0123456789abcdef";

duk_bool_t __ejs_modules_shared_ishex(char c);
uint8_t __ejs_modules_shared_unhex(uint8_t c, duk_bool_t *ok);
/**
 * reports whether s contains any ASCII control character
 */
duk_bool_t __ejs_modules_shared_strings_contains_ctl(const uint8_t *s, const size_t s_len);
/**
 * returns the index of the first instance of c in s, or -1 if missing.
 */
size_t __ejs_modules_shared_strings_index(const uint8_t *s, const size_t s_len, uint8_t c);

/**
 * reports whether the string contains the byte c.
 */
duk_bool_t __ejs_modules_shared_strings_contains(const uint8_t *s, const size_t s_len, uint8_t c);
/**
 * reports whether the string contains the byte c.
 */
duk_bool_t __ejs_modules_shared_strings_contains_any(const uint8_t *s, const size_t s_len, const uint8_t *c, const size_t c_len);

uint64_t __ejs_modules_shared_get_hex_uint64(duk_context *ctx, duk_size_t idx);
int64_t __ejs_modules_shared_get_hex_int64(duk_context *ctx, duk_size_t idx);
#endif