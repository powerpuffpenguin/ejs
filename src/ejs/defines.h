#ifndef _EMBEDDED_JS_UTILS_H_
#define _EMBEDDED_JS_UTILS_H_

#include <stdint.h>

#ifndef BOOL
#define BOOL uint8_t
#endif
#ifndef TRUE
#define TRUE 1
#endif
#ifndef FALSE
#define FALSE 0
#endif

#ifndef NULL
#define NULL 0
#endif

#define EJS_SAFE_DELETE_F(f, v) \
    if (v)                      \
    {                           \
        f((v));                 \
        (v) = 0;                \
    }

#define EJS_SAFE_FREE(v) EJS_SAFE_DELETE_F(free, v)

#define EJS_VAR_TYPE(type, name) type name = {0}
#define EJS_VAR_FREE(p) \
    if (p)              \
    free(p)

#define EJS_INVALID_FD(fd) ((fd) == -1)
#define EJS_VALID_FD(fd) ((fd) != -1)
#define EJS_SYSTEM_ERROR(code) (code == -1)

#define DUK_PUSH_FD(ctx, fd) duk_push_pointer((ctx), (void *)(size_t)(fd))
#define DUK_REQUIRE_FD(ctx, idx) ((size_t)duk_require_pointer((ctx), (idx)));
#define DUK_GET_FD(ctx, idx) ((size_t)duk_get_pointer((ctx), (idx)));

/* Windows, both 32-bit and 64-bit */
#if defined(_WIN32) || defined(WIN32) || defined(_WIN64) || defined(WIN64) || \
    defined(__WIN32__) || defined(__TOS_WIN__) || defined(__WINDOWS__)
#define EJS_OS_WINDOWS
#if defined(_WIN64) || defined(WIN64)
#define EJS_OS_WIN64
#else
#define EJS_OS_WIN32
#endif
#endif

/* Linux */
#if defined(__linux) || defined(__linux__) || defined(linux)
#define EJS_OS_LINUX
#endif

#define EJS_BOOL_VALUE_DEFAULT(ctx, idx, def) (duk_is_null_or_undefined(ctx, idx) ? (def) : (duk_is_boolean(ctx, idx) ? duk_require_boolean(ctx, idx) : duk_to_boolean(ctx, idx)))
#define EJS_BOOL_VALUE(ctx, idx) EJS_BOOL_VALUE_DEFAULT(ctx, idx, 0)

#define EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, idx, def) (duk_is_null_or_undefined(ctx, idx) ? (def) : duk_require_number(ctx, idx))

#endif