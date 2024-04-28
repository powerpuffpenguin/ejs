#ifndef _EMBEDDED_JS__DUK_NET_H_
#define _EMBEDDED_JS__DUK_NET_H_
#include "../duk/duktape.h"
duk_ret_t _ejs_native_net_init(duk_context *ctx);

#ifndef IPv6len
#define IPv6len 16
#endif

#ifndef IPv4len
#define IPv4len 4
#endif

#endif