#ifndef _EMBEDDED_JS__DUK_MODULES__DECLARE_H_
#define _EMBEDDED_JS__DUK_MODULES__DECLARE_H_

#include "../../duk/duktape.h"

#define EJS_SHARED_MODULE__FUNC(name) __ejs_modules__init_f__##name
#define EJS_SHARED_MODULE__PUSH(ctx, name, func)                       \
    duk_push_c_lightfunc(ctx, EJS_SHARED_MODULE__FUNC(func), 2, 2, 0); \
    duk_put_prop_lstring(ctx, -2, name);

#define EJS_SHARED_MODULE__DECLARE(name) duk_ret_t EJS_SHARED_MODULE__FUNC(name)(duk_context * ctx)

#define EJS_SHARED_MODULE__TEST0 "ejs/test0", 9
EJS_SHARED_MODULE__DECLARE(test0);

#define EJS_SHARED_MODULE__UNICODE_UTF8 "ejs/unicode/utf8", 16
EJS_SHARED_MODULE__DECLARE(unicode_utf8);

#define EJS_SHARED_MODULE__SYNC "ejs/sync", 8
EJS_SHARED_MODULE__DECLARE(sync);

#define EJS_SHARED_MODULE__OS "ejs/os", 6
EJS_SHARED_MODULE__DECLARE(os);

#define EJS_SHARED_MODULE__NET "ejs/net", 7
EJS_SHARED_MODULE__DECLARE(net);
#define EJS_SHARED_MODULE__NET_URL "ejs/net/url", 11
EJS_SHARED_MODULE__DECLARE(net_url);
#define EJS_SHARED_MODULE__NET_HTTP "ejs/net/http", 12
EJS_SHARED_MODULE__DECLARE(net_http);

#endif