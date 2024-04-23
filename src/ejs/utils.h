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

#define EJS_VAR_TYPE(type, name) \
    type name;                   \
    memset(&name, 0, sizeof(type))
#define EJS_VAR_FREE(p) \
    if (p)              \
    free(p)

#endif