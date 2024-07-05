#ifndef _EMBEDDED_JS__DUK_NET_URL_H_
#define _EMBEDDED_JS__DUK_NET_URL_H_
#include "../duk/duktape.h"
duk_ret_t _ejs_native_net_url_init(duk_context *ctx);

#define EJS_NET_URL_EncodePath 1
#define EJS_NET_URL_EncodePathSegment 2
#define EJS_NET_URL_EncodeHost 3
#define EJS_NET_URL_EncodeZone 4
#define EJS_NET_URL_EncodeUserPassword 5
#define EJS_NET_URL_EncodeQueryComponent 6
#define EJS_NET_URL_EncodeFragment 7

#endif