#ifndef _EMBEDDED_JS_STRING_H_
#define _EMBEDDED_JS_STRING_H_
#include <stdint.h>
#include <stdlib.h>
#include "utils.h"
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

void ejs_string_init(ejs_string_t *s, const char *c, size_t len, ejs_stirng_reference_t *r);
#define EJS_STRING_DESTORY(s) \
    if ((s)->reference)       \
    ejs_string_destory((s))
void ejs_string_destory(ejs_string_t *s);
void ejs_string_println(ejs_string_t *s);
#define EJS_CONST_LSTRING(s, c, len) \
    ejs_string_t s;                  \
    ejs_string_init(&s, c, len, 0)
#define EJS_LSTRING(s, r, c, len) \
    ejs_string_t s;               \
    ejs_stirng_reference_t r;     \
    ejs_string_init(&s, c, len, &r)
void ejs_string_set(ejs_string_t *l, ejs_string_t *r);
void ejs_string_substr(ejs_string_t *sub, const ejs_string_t *s, size_t start, size_t end);
void ejs_string_set_string(ejs_string_t *s, const char *c);
void ejs_string_set_lstring(ejs_string_t *s, const char *c, size_t len);
#endif
