#ifndef _EMBEDDED_JS_ERROR_H_
#define _EMBEDDED_JS_ERROR_H_
#include <stdint.h>
#include "../duk/duktape.h"

#if defined(__cplusplus)
extern "C"
{
#endif

#define EJS_ERROR_RET size_t

    DUK_EXTERNAL const char *ejs_error(const size_t err);

#define EJS_ERROR_OK 0
#define EJS_ERROR_OS 1
#define EJS_ERROR_SHORT_READ 20
#define EJS_ERROR_INVALID_MODULE_NAME 40
#define EJS_ERROR_INVALID_MODULE_FILE 41
#define EJS_ERROR_LARGE_MODULE 42
#define EJS_ERROR_MODULE_READ_FAIL 43
#define EJS_ERROR_MODULE_NOT_EXISTS 44
#define EJS_ERROR_MODULE_NO_PACKAGE 45
#define EJS_ERROR_MODULE_UNKNOW_PACKAGE 46
#define EJS_ERROR_MODULE_PACKAGE_READ_FAIL 47

#define EJS_ERROR_MALLOC 100
#define EJS_ERROR_GETCWD 101

#define EJS_ERROR_DUK_CREATE_HEAP 200
#define EJS_ERROR_DUK_CHECK_STACK_TOP 201
#define EJS_ERROR_DUK_EXTRAS_INIT 210

#define EJS_ERROR_EVENT_BASE_NEW 300
#define EJS_ERROR_NO_EVENT 320
#define EJS_ERROR_NO_EVENT_BASE_DISPATCH 321

#if defined(__cplusplus)
}
#endif

#endif