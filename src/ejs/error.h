#ifndef _EMBEDDED_JS_CORE_ERROR_H_
#define _EMBEDDED_JS_CORE_ERROR_H_
#include <stdint.h>
const char *ejs_error(const int err);

#define EJS_SAFE_SET_ERROR(p, err) \
    if ((p))                       \
    {                              \
        *(p) = (err);              \
    }
#define EJS_ERROR_OK 0

#define EJS_ERROR_MALLOC 100

#define EJS_ERROR_EVENT_BASE_NEW 200
#define EJS_ERROR_NO_EVENT 220
#define EJS_ERROR_NO_EVENT_BASE_DISPATCH 221
#endif