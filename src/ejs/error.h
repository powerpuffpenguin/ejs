#ifndef _EMBEDDED_JS_ERROR_H_
#define _EMBEDDED_JS_ERROR_H_
#include <stdint.h>
typedef int EJS_ERROR_RET;
const char *ejs_error(const EJS_ERROR_RET err);

#define EJS_SAFE_SET_ERROR(p, err) \
    if (p)                         \
    *p = (err)
#define EJS_ERROR_OK 0

#define EJS_ERROR_MALLOC 100

#define EJS_ERROR_DUK_CREATE_HEAP 200
#define EJS_ERROR_DUK_CHECK_STACK_TOP 201
#define EJS_ERROR_DUK_EXTRAS_INIT 210

#define EJS_ERROR_EVENT_BASE_NEW 300
#define EJS_ERROR_NO_EVENT 320
#define EJS_ERROR_NO_EVENT_BASE_DISPATCH 321

#endif