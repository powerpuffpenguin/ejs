#include "modules_init.h"
#include "modules_declare.h"
#include "../config.h"
#include "../defines.h"

void __ejs_modules_init(duk_context *ctx)
{
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__TEST0, test0);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__ENCODING_BINARY, encoding_binary);
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__ENCODING_HEX, encoding_hex);
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__ENCODING_BASE64, encoding_base64);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__HASH, hash);
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__CRYPTO, crypto);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__UNICODE_UTF8, unicode_utf8);
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__STRCONC, strconv);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__SYNC, sync);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__PATH, path);

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__OS, os);

#ifdef EJS_OS_WINDOWS
#else
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__OS_EXEC, os_exec);
#endif

    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__NET, net);
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__NET_URL, net_url);
    EJS_SHARED_MODULE__PUSH(ctx, EJS_SHARED_MODULE__NET_HTTP, net_http);
}