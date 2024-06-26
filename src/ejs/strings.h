#ifndef _EMBEDDED_JS_STRING_H_
#define _EMBEDDED_JS_STRING_H_
#include <stdint.h>
#include <stdlib.h>
#include "defines.h"
#include "../duk/duktape.h"

#if defined(__cplusplus)
extern "C"
{
#endif

    typedef struct
    {
        char *c;
        size_t len;
        unsigned int used;
    } ejs_stirng_reference_t;

    typedef struct
    {
        char *c;
        size_t len;
        ejs_stirng_reference_t *reference;
    } ejs_string_t;

    DUK_EXTERNAL void ejs_string_init(ejs_string_t *s, const char *c, size_t len, ejs_stirng_reference_t *r);

#define EJS_STRING_DESTROY(s) \
    if ((s)->reference)       \
    ejs_string_destroy((s))
    void ejs_string_destroy(ejs_string_t *s);
    void ejs_string_println(ejs_string_t *s);

#define EJS_CONST_LSTRING(s, c, len) \
    ejs_string_t s;                  \
    ejs_string_init(&s, c, len, 0)

#define EJS_LSTRING(s, r, c, len) \
    ejs_string_t s;               \
    ejs_stirng_reference_t r;     \
    ejs_string_init(&s, c, len, &r)

    DUK_EXTERNAL void ejs_string_set(ejs_string_t *l, const ejs_string_t *r);
    DUK_EXTERNAL void ejs_string_substr(ejs_string_t *sub, const ejs_string_t *s, size_t start, size_t end);
    DUK_EXTERNAL void ejs_string_set_string(ejs_string_t *s, const char *c);
    DUK_EXTERNAL void ejs_string_set_lstring(ejs_string_t *s, const char *c, size_t len);

#if defined(__cplusplus)
}
#endif

#endif
