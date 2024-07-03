#include "_duk_http.h"
#include "_duk_net.h"
#include "core.h"
#include <stdio.h>
#include <errno.h>
#include "js/http.h"
#include "internal/sync_evconn_listener.h"

#include <event2/buffer.h>
#include <event2/event.h>
#include <event2/http.h>
#include <event2/bufferevent_ssl.h>

#include "stash.h"

static void http_evconnlistener_tcp_cb(struct evconnlistener *listener, evutil_socket_t fd, struct sockaddr *sa, int salen, void *ptr)
{
    evhttp_serve(ptr, fd, sa, salen, 0);
}
static struct bufferevent *https_bevcb(struct event_base *base, void *p)
{
    tcp_server_tls_t *tls = p;
    mbedtls_dyncontext *ssl = bufferevent_mbedtls_dyncontext_new(&tls->conf);
    return bufferevent_mbedtls_socket_new(base, -1, ssl, BUFFEREVENT_SSL_ACCEPTING, BEV_OPT_CLOSE_ON_FREE);
}
int http_errorcb(struct evhttp_request *req, struct evbuffer *buffer, int error, const char *reason, void *cbarg)
{
    printf("reason: %s\n", reason);
    return 0;
}
typedef struct
{
    struct evhttp *server;
    ejs_core_t *core;
} http_server_t;
typedef struct
{
    http_server_t *server;
    struct evhttp_request *req;
} http_handler_args_t;
static duk_ret_t http_handler_impl(duk_context *ctx)
{
    http_handler_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    if (ejs_stash_get_pointer(ctx, args->server, EJS_STASH_NET_HTTP_SERVER))
    {
        duk_get_prop_lstring(ctx, -1, "cb", 2);
        duk_swap_top(ctx, -2);
        duk_pop(ctx);
        duk_push_pointer(ctx, args->req);
        duk_call(ctx, 1);
    }
    return 0;
}
static void http_handler(struct evhttp_request *req, void *ctx)
{
    http_server_t *server = ctx;
    http_handler_args_t args = {
        .server = server,
        .req = req,
    };
    ejs_call_callback(server->core->duk, http_handler_impl, &args, 0);
}

static duk_ret_t http_server_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    http_server_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        if (p->server)
        {
            evhttp_free(p->server);
        }
        free(p);
    }
    return 0;
}
typedef struct
{
    http_server_t *p;
} create_server_args_t;

static duk_ret_t create_server_impl(duk_context *ctx)
{
    create_server_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    ejs_core_t *core = ejs_require_core(ctx);
    http_server_t *p = malloc(sizeof(http_server_t));
    if (!p)
    {
        ejs_throw_os_errno(ctx);
    }
    p->core = core;
    p->server = evhttp_new(core->base);
    if (!p->server)
    {
        free(p);
        duk_push_error_object(ctx, DUK_ERR_ERROR, "evhttp_new fail");
        duk_throw(ctx);
    }
    evhttp_set_gencb(p->server, http_handler, p);
    evhttp_set_errorcb(p->server, http_errorcb, p);

    args->p = p;
    duk_push_object(ctx);
    duk_swap_top(ctx, -2);
    duk_put_prop_lstring(ctx, -2, "cb", 2);
    duk_push_pointer(ctx, p);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_push_c_lightfunc(ctx, http_server_finalizer, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->p = 0;

    ejs_stash_put_pointer(ctx, EJS_STASH_NET_HTTP_SERVER);
    return 1;
}
static duk_ret_t create_server(duk_context *ctx)
{
    create_server_args_t args = {0};
    if (ejs_pcall_function_n(ctx, create_server_impl, &args, 2))
    {
        if (args.p)
        {
            if (args.p->server)
            {
                evhttp_free(args.p->server);
            }
            free(args.p);
        }
        duk_throw(ctx);
    }
    return 1;
}
duk_ret_t close_server(duk_context *ctx)
{
    http_server_t *p = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_NET_HTTP_SERVER);
    if (p)
    {
        if (p->server)
        {
            evhttp_free(p->server);
        }
        free(p);
    }
    return 0;
}
static duk_ret_t serve(duk_context *ctx)
{

    http_server_t *server = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    tcp_server_tls_t *tls = duk_is_undefined(ctx, -1) ? 0 : duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "sync", 4);
    duk_bool_t isSync = EJS_BOOL_VALUE(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "p", 1);
    void *listener = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    if (isSync)
    {
        sync_evconn_listener_t *l = listener;
        l->userdata = server->server;
        sync_evconn_listener_set_cb(listener, (sync_evconn_listener_cb)http_evconnlistener_tcp_cb);
    }
    else
    {
        evconnlistener_set_cb(listener, http_evconnlistener_tcp_cb, server->server);
        evconnlistener_enable(listener);
    }
    if (tls)
    {
        evhttp_set_bevcb(server->server, https_bevcb, tls);
    }
    return 0;
}
static duk_ret_t request_get_host(duk_context *ctx)
{
    struct evhttp_request *req = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_string(ctx, evhttp_request_get_host(req));
    return 1;
}
static duk_ret_t request_get_uri(duk_context *ctx)
{
    struct evhttp_request *req = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_pointer(ctx, (void *)evhttp_request_get_evhttp_uri(req));
    return 1;
}
static duk_ret_t uri_get_fragment(duk_context *ctx)
{
    struct evhttp_uri *uri = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_string(ctx, evhttp_uri_get_fragment(uri));
    return 1;
}
static duk_ret_t uri_get_host(duk_context *ctx)
{
    struct evhttp_uri *uri = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_string(ctx, evhttp_uri_get_host(uri));
    return 1;
}
static duk_ret_t uri_get_port(duk_context *ctx)
{
    struct evhttp_uri *uri = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_int(ctx, evhttp_uri_get_port(uri));
    return 1;
}
static duk_ret_t uri_get_path(duk_context *ctx)
{
    struct evhttp_uri *uri = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_string(ctx, evhttp_uri_get_path(uri));
    return 1;
}
static duk_ret_t uri_get_query(duk_context *ctx)
{
    struct evhttp_uri *uri = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_string(ctx, evhttp_uri_get_query(uri));
    return 1;
}
static duk_ret_t uri_get_scheme(duk_context *ctx)
{
    struct evhttp_uri *uri = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_string(ctx, evhttp_uri_get_scheme(uri));
    return 1;
}
static duk_ret_t uri_get_userinfo(duk_context *ctx)
{
    struct evhttp_uri *uri = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_string(ctx, evhttp_uri_get_userinfo(uri));
    return 1;
}

static duk_ret_t writer_response_text(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "req", 3);
    struct evhttp_request *req = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "code", 4);
    int code = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, -1, 200);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "text", 4);
    if (!duk_is_string(ctx, -1))
    {
        duk_to_string(ctx, -1);
    }
    duk_size_t len;
    const char *s = duk_require_lstring(ctx, -1, &len);
    duk_pop(ctx);

    struct evbuffer *reply = evbuffer_new();
    if (!reply)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "evbuffer_new fail");
        duk_throw(ctx);
    }
    evbuffer_add(reply, s, len);
    evhttp_send_reply(req, code, NULL, reply);
    evbuffer_free(reply);
    return 0;
}
duk_ret_t _ejs_native_http_init(duk_context *ctx)
{
    /*
     *  Entry stack: [ require exports ]
     */

    duk_eval_lstring(ctx, js_ejs_js_http_min_js, js_ejs_js_http_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, create_server, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "create_server", 13);

        duk_push_c_lightfunc(ctx, close_server, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "close_server", 12);

        duk_push_c_lightfunc(ctx, serve, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "serve", 5);

        duk_push_c_lightfunc(ctx, request_get_host, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "request_get_host", 16);
        duk_push_c_lightfunc(ctx, request_get_uri, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "request_get_uri", 15);

        duk_push_c_lightfunc(ctx, uri_get_fragment, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "uri_get_fragment", 16);
        duk_push_c_lightfunc(ctx, uri_get_host, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "uri_get_host", 12);
        duk_push_c_lightfunc(ctx, uri_get_port, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "uri_get_port", 12);
        duk_push_c_lightfunc(ctx, uri_get_path, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "uri_get_path", 12);
        duk_push_c_lightfunc(ctx, uri_get_query, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "uri_get_query", 13);
        duk_push_c_lightfunc(ctx, uri_get_scheme, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "uri_get_scheme", 14);
        duk_push_c_lightfunc(ctx, uri_get_userinfo, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "uri_get_userinfo", 16);

        duk_push_c_lightfunc(ctx, writer_response_text, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "writer_response_text", 20);
    }
    duk_call(ctx, 3);
    return 0;
}