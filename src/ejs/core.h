#ifndef _EMBEDDED_JS_CORE_H_
#define _EMBEDDED_JS_CORE_H_
#include "dns.h"
typedef struct
{
    struct event_base *base;
} ejs_core_t;
ejs_core_t *ejs_core_new(int *err);
void ejs_core_free(ejs_core_t *core);
int ejs_core_dispatch(ejs_core_t *core);
#endif