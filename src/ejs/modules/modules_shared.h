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

#define EJS_SHARED_UPPER_HEX_DIGIT "0123456789ABCDEF";
#define EJS_SHARED_LOWER_HEX_DIGIT "0123456789abcdef";

duk_bool_t __ejs_modules_shared_ishex(char c);
uint8_t __ejs_modules_shared_unhex(uint8_t c);

#endif