#ifndef _EMBEDDED_JS_STASH_H_
#define _EMBEDDED_JS_STASH_H_

#define EJS_STASH_EJS "ejs", 3
#define EJS_STASH_EJS_ARGS "args", 4
#define EJS_STASH_EJS_OS "os", 2
#define EJS_STASH_EJS_VERSION "version", 7
#define EJS_STASH_EJS_ARCH "arch", 4
#define EJS_STASH_EJS_BITS "bits", 4
#define EJS_STASH_EJS_ERROR "Error", 5
#define EJS_STASH_EJS_OS_ERROR "OsError", 7

#define EJS_STASH_MODULE "module", 6
#define EJS_STASH_FOUND "found", 5
#define EJS_STASH_MODULE_DESTROY "module_destroy", 14

#define EJS_STASH_CORE "core", 4

#define EJS_STASH_JSON "JSON", 4

#define EJS_STASH_TIMEOUT "timeout", 7
#define EJS_STASH_IMMEDIATE "immediate", 9

#define EJS_STASH_ASYNC "async", 5

#define EJS_STASH_DEFINE_OBJECT(name)        \
    duk_get_prop_lstring(ctx, -1, name);     \
    if (!duk_is_object(ctx, -1))             \
    {                                        \
        duk_push_object(ctx);                \
        duk_put_prop_lstring(ctx, -3, name); \
    }                                        \
    duk_pop(ctx)

#define EJS_STASH_NET_RESOLVER "net.resolver", 12
#define EJS_STASH_NET_RESOLVER_REQUEST "net.resolver_r", 14
#define EJS_STASH_NET_TCP_LISTENER "net.tcp_listener", 16
#define EJS_STASH_NET_TCP_CONN "net.tcp_conn", 12
#define EJS_STASH_NET_UDP_CONN "net.udp_conn", 12

#define EJS_STASH_NET_HTTP_SERVER "http.server", 11
#define EJS_STASH_NET_HTTP_SERVER_CHUNK "http.server.chunk", 17
#define EJS_STASH_NET_HTTP_WEBSOCKET "http.ws", 7
#define EJS_STASH_NET_HTTP_CLIENT "http.client", 11

#endif