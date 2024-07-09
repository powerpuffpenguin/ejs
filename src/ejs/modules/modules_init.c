#include "modules_init.h"
#include "modules_declare.h"

void __ejs_modules_init(duk_context *ctx)
{
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__TEST0, test0);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__STRCONC, strconv);
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__UNICODE_UTF8, unicode_utf8);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__SYNC, sync);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__OS, os);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__NET, net);
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__NET_URL, net_url);
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__NET_HTTP, net_http);
}