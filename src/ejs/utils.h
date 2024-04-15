#ifndef _EMBEDDED_JS_CORE_UTILS_H_
#define _EMBEDDED_JS_CORE_UTILS_H_

#ifndef EJS_SAFE_DELETE_F
#define EJS_SAFE_DELETE_F(f, v) \
    if (v)                      \
    {                           \
        f((v));                 \
        (v) = 0;                \
    }
#endif

#endif