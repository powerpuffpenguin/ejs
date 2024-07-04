#include "_duk_http.h"
#include "_duk_net.h"
#include "core.h"
#include <stdio.h>
#include <errno.h>
#include "js/http.h"
#include "internal/sync_evconn_listener.h"
#include "internal/c_string.h"

#include <event2/buffer.h>
#include <event2/event.h>
#include <event2/http.h>
#include <event2/bufferevent_ssl.h>

#include "stash.h"

typedef struct
{
    struct evhttp *server;
    ejs_core_t *core;
} http_server_t;
static void http_evconnlistener_tcp_cb(struct evconnlistener *listener, evutil_socket_t fd, struct sockaddr *sa, int salen, void *ptr)
{
    evhttp_serve(ptr, fd, sa, salen, 0);
}
static struct bufferevent *https_bevcb(struct event_base *base, void *p)
{
    tcp_server_tls_t *tls = p;
    mbedtls_dyncontext *ssl = bufferevent_mbedtls_dyncontext_new(&tls->conf);
    if (!ssl)
    {
        return 0;
    }
    return bufferevent_mbedtls_socket_new(base, -1, ssl, BUFFEREVENT_SSL_ACCEPTING, BEV_OPT_CLOSE_ON_FREE);
}
int http_errorcb(struct evhttp_request *req, struct evbuffer *buffer, int error, const char *reason, void *cbarg)
{
    printf("reason: %d %s\n", error, reason);
    return 0;
}

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

    tcp_tls_t *tls = duk_is_undefined(ctx, -1) ? 0 : duk_require_pointer(ctx, -1);
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
static duk_ret_t request_free_raw(duk_context *ctx)
{
    struct evhttp_request *req = duk_require_pointer(ctx, 0);
    evhttp_request_free(req);
    return 0;
}
static duk_ret_t request_get_host(duk_context *ctx)
{
    struct evhttp_request *req = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_string(ctx, evhttp_request_get_host(req));
    return 1;
}
static duk_ret_t request_get_method(duk_context *ctx)
{
    struct evhttp_request *req = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    duk_push_int(ctx, evhttp_request_get_command(req));
    return 1;
}

static duk_ret_t request_get_uri(duk_context *ctx)
{
    struct evhttp_request *req = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_array(ctx);
    duk_push_string(ctx, evhttp_request_get_uri(req));
    duk_put_prop_index(ctx, -2, 0);
    duk_push_pointer(ctx, (void *)evhttp_request_get_evhttp_uri(req));
    duk_put_prop_index(ctx, -2, 1);
    return 1;
}
static duk_ret_t request_get_uri_s(duk_context *ctx)
{
    struct evhttp_request *req = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    duk_push_string(ctx, evhttp_request_get_uri(req));
    return 1;
}

static duk_ret_t uri_join_impl(duk_context *ctx)
{
    struct evhttp_uri *uri = duk_require_pointer(ctx, 0);
    ppp_c_string_t *s = duk_require_pointer(ctx, 1);
    duk_pop_2(ctx);

    const char *v = evhttp_uri_get_scheme(uri);
    size_t len;
    if (v)
    {
        len = strlen(v);
        if (ppp_c_string_grow(s, len + 1))
        {
            ejs_throw_os_errno(ctx);
        }
        ppp_c_string_append_raw(s, v, len);
        ppp_c_string_append_raw(s, ":", 1);
    }
#ifndef _WIN32
    v = evhttp_uri_get_unixsocket(uri);
    if (v)
    {
        if (ppp_c_string_append(s, "//", 2))
        {
            ejs_throw_os_errno(ctx);
        }

        const char *userinfo = evhttp_uri_get_userinfo(uri);
        if (userinfo)
        {
            len = strlen(userinfo);
            if (ppp_c_string_grow(s, len + 1))
            {
                ejs_throw_os_errno(ctx);
            }
            ppp_c_string_append_raw(s, userinfo, len);
            ppp_c_string_append_raw(s, "@", 1);
        }

        len = strlen(v);
        if (ppp_c_string_grow(s, 5 + len + 1))
        {
            ejs_throw_os_errno(ctx);
        }
        ppp_c_string_append_raw(s, "unix:", 5);
        ppp_c_string_append_raw(s, v, len);
        ppp_c_string_append_raw(s, ":", 1);
    }
    else
#endif
    {
        v = evhttp_uri_get_host(uri);
        if (v)
        {
            if (ppp_c_string_append(s, "//", 2))
            {
                ejs_throw_os_errno(ctx);
            }

            const char *userinfo = evhttp_uri_get_userinfo(uri);
            if (userinfo)
            {
                len = strlen(userinfo);
                if (ppp_c_string_grow(s, len + 1))
                {
                    ejs_throw_os_errno(ctx);
                }
                ppp_c_string_append_raw(s, userinfo, len);
                ppp_c_string_append_raw(s, "@", 1);
            }
            len = strlen(v);
            duk_bool_t v6 = 0;
            for (size_t i = 0; i < len; i++)
            {
                if (v[i] == ':')
                {
                    v6 = 1;
                }
            }
            if (v6)
            {
                if (ppp_c_string_grow(s, 1 + len + 1))
                {
                    ejs_throw_os_errno(ctx);
                }
                ppp_c_string_append_raw(s, "[", 1);
                ppp_c_string_append_raw(s, v, len);
                ppp_c_string_append_raw(s, "]", 1);
            }
            else
            {
                if (ppp_c_string_append(s, v, len))
                {
                    ejs_throw_os_errno(ctx);
                }
            }
            int port = evhttp_uri_get_port(uri);
            if (port >= 0)
            {
                if (ppp_c_string_grow(s, 21))
                {
                    ejs_throw_os_errno(ctx);
                }

                s->len += evutil_snprintf(s->str + s->len, 21, ":%d", port);
            }
            v = evhttp_uri_get_path(uri);
            if (v && v[0] != '/' && v[0] != '\0')
            {
                duk_push_error_object(ctx, DUK_ERR_ERROR, "uri invalid");
            }
        }
    }
    v = evhttp_uri_get_path(uri);
    if (v)
    {
        len = strlen(v);
        if (ppp_c_string_append(s, v, len))
        {
            ejs_throw_os_errno(ctx);
        }
    }

    v = evhttp_uri_get_query(uri);
    if (v)
    {
        len = strlen(v);
        if (ppp_c_string_grow(s, 1 + len))
        {
            ejs_throw_os_errno(ctx);
        }
        ppp_c_string_append_raw(s, "?", 1);
        ppp_c_string_append_raw(s, v, len);
    }

    v = evhttp_uri_get_fragment(uri);
    if (v)
    {
        len = strlen(v);
        if (ppp_c_string_grow(s, 1 + len))
        {
            ejs_throw_os_errno(ctx);
        }
        ppp_c_string_append_raw(s, "#", 1);
        ppp_c_string_append_raw(s, v, len);
    }

    duk_push_lstring(ctx, s->str, s->len);
    if (s->cap)
    {
        free(s->str);
        s->cap = 0;
    }
    return 1;
}
static duk_ret_t uri_join(duk_context *ctx)
{
    ppp_c_string_t s = {0};
    if (ejs_pcall_function_n(ctx, uri_join_impl, &s, 2))
    {
        if (s.cap)
        {
            free(s.str);
        }
        duk_throw(ctx);
    }
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

static const char *_status_text(int code)
{
    switch (code)
    {
    case StatusContinue:
        return "Continue";
    case StatusSwitchingProtocols:
        return "Switching Protocols";
    case StatusProcessing:
        return "Processing";
    case StatusEarlyHints:
        return "Early Hints";
    case StatusOK:
        return "OK";
    case StatusCreated:
        return "Created";
    case StatusAccepted:
        return "Accepted";
    case StatusNonAuthoritativeInfo:
        return "Non-Authoritative Information";
    case StatusNoContent:
        return "No Content";
    case StatusResetContent:
        return "Reset Content";
    case StatusPartialContent:
        return "Partial Content";
    case StatusMultiStatus:
        return "Multi-Status";
    case StatusAlreadyReported:
        return "Already Reported";
    case StatusIMUsed:
        return "IM Used";
    case StatusMultipleChoices:
        return "Multiple Choices";
    case StatusMovedPermanently:
        return "Moved Permanently";
    case StatusFound:
        return "Found";
    case StatusSeeOther:
        return "See Other";
    case StatusNotModified:
        return "Not Modified";
    case StatusUseProxy:
        return "Use Proxy";
    case StatusTemporaryRedirect:
        return "Temporary Redirect";
    case StatusPermanentRedirect:
        return "Permanent Redirect";
    case StatusBadRequest:
        return "Bad Request";
    case StatusUnauthorized:
        return "Unauthorized";
    case StatusPaymentRequired:
        return "Payment Required";
    case StatusForbidden:
        return "Forbidden";
    case StatusNotFound:
        return "Not Found";
    case StatusMethodNotAllowed:
        return "Method Not Allowed";
    case StatusNotAcceptable:
        return "Not Acceptable";
    case StatusProxyAuthRequired:
        return "Proxy Authentication Required";
    case StatusRequestTimeout:
        return "Request Timeout";
    case StatusConflict:
        return "Conflict";
    case StatusGone:
        return "Gone";
    case StatusLengthRequired:
        return "Length Required";
    case StatusPreconditionFailed:
        return "Precondition Failed";
    case StatusRequestEntityTooLarge:
        return "Request Entity Too Large";
    case StatusRequestURITooLong:
        return "Request URI Too Long";
    case StatusUnsupportedMediaType:
        return "Unsupported Media Type";
    case StatusRequestedRangeNotSatisfiable:
        return "Requested Range Not Satisfiable";
    case StatusExpectationFailed:
        return "Expectation Failed";
    case StatusTeapot:
        return "I'm a teapot";
    case StatusMisdirectedRequest:
        return "Misdirected Request";
    case StatusUnprocessableEntity:
        return "Unprocessable Entity";
    case StatusLocked:
        return "Locked";
    case StatusFailedDependency:
        return "Failed Dependency";
    case StatusTooEarly:
        return "Too Early";
    case StatusUpgradeRequired:
        return "Upgrade Required";
    case StatusPreconditionRequired:
        return "Precondition Required";
    case StatusTooManyRequests:
        return "Too Many Requests";
    case StatusRequestHeaderFieldsTooLarge:
        return "Request Header Fields Too Large";
    case StatusUnavailableForLegalReasons:
        return "Unavailable For Legal Reasons";
    case StatusInternalServerError:
        return "Internal Server Error";
    case StatusNotImplemented:
        return "Not Implemented";
    case StatusBadGateway:
        return "Bad Gateway";
    case StatusServiceUnavailable:
        return "Service Unavailable";
    case StatusGatewayTimeout:
        return "Gateway Timeout";
    case StatusHTTPVersionNotSupported:
        return "HTTP Version Not Supported";
    case StatusVariantAlsoNegotiates:
        return "Variant Also Negotiates";
    case StatusInsufficientStorage:
        return "Insufficient Storage";
    case StatusLoopDetected:
        return "Loop Detected";
    case StatusNotExtended:
        return "Not Extended";
    case StatusNetworkAuthenticationRequired:
        return "Network Authentication Required";
    default:
        // return "";
        return 0;
    }
}
static duk_ret_t status_text(duk_context *ctx)
{
    const char *s = _status_text(duk_require_int(ctx, 0));
    duk_pop(ctx);
    if (s)
    {
        duk_push_string(ctx, s);
    }
    else
    {
        duk_push_lstring(ctx, "", 0);
    }
    return 1;
}

static duk_ret_t create_flags(duk_context *ctx)
{
    uint8_t *p = duk_push_fixed_buffer(ctx, 1);
    p[0] = 0;
    return 1;
}
static duk_ret_t writer_response(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "f", 1);
    uint8_t *flags = duk_require_buffer_data(ctx, -1, 0);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "r", 1);
    struct evhttp_request *req = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "code", 4);
    int code = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, -1, 200);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "t", 1);
    const char *content_type = EJS_REQUIRE_STRING_VALUE_DEFAULT(ctx, -1, 0);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "body", 4);
    duk_size_t len;
    const void *buf;
    if (duk_is_null_or_undefined(ctx, -1))
    {
        len = 0;
    }
    if (duk_is_buffer_data(ctx, -1))
    {
        buf = duk_require_buffer_data(ctx, -1, &len);
    }
    else
    {
        if (!duk_is_string(ctx, -1))
        {
            duk_to_string(ctx, -1);
        }
        buf = duk_require_lstring(ctx, -1, &len);
    }
    duk_pop(ctx);

    if (content_type)
    {
        struct evkeyvalq *headers = evhttp_request_get_output_headers(req);
        if (!evhttp_find_header(headers, "Content-Type"))
        {
            evhttp_add_header(headers, "Content-Type", content_type);
        }
    }
    if (len)
    {
        struct evbuffer *reply = evbuffer_new();
        if (!reply)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "evbuffer_new fail");
            duk_throw(ctx);
        }
        evbuffer_add(reply, buf, len);
        evhttp_send_reply(req, code, _status_text(code), reply);
        evbuffer_free(reply);
    }
    else
    {
        evhttp_send_reply(req, code, _status_text(code), 0);
    }
    flags[0] = 0;
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
        duk_push_uint(ctx, EVHTTP_REQ_GET);
        duk_put_prop_lstring(ctx, -2, "GET", 3);
        duk_push_uint(ctx, EVHTTP_REQ_POST);
        duk_put_prop_lstring(ctx, -2, "POST", 4);
        duk_push_uint(ctx, EVHTTP_REQ_HEAD);
        duk_put_prop_lstring(ctx, -2, "HEAD", 4);
        duk_push_uint(ctx, EVHTTP_REQ_PUT);
        duk_put_prop_lstring(ctx, -2, "PUT", 3);
        duk_push_uint(ctx, EVHTTP_REQ_DELETE);
        duk_put_prop_lstring(ctx, -2, "DELETE", 6);
        duk_push_uint(ctx, EVHTTP_REQ_OPTIONS);
        duk_put_prop_lstring(ctx, -2, "OPTIONS", 7);
        duk_push_uint(ctx, EVHTTP_REQ_TRACE);
        duk_put_prop_lstring(ctx, -2, "TRACE", 5);
        duk_push_uint(ctx, EVHTTP_REQ_CONNECT);
        duk_put_prop_lstring(ctx, -2, "CONNECT", 7);
        duk_push_uint(ctx, EVHTTP_REQ_PATCH);
        duk_put_prop_lstring(ctx, -2, "PATCH", 5);

        duk_push_c_lightfunc(ctx, create_server, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "create_server", 13);

        duk_push_c_lightfunc(ctx, close_server, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "close_server", 12);

        duk_push_c_lightfunc(ctx, serve, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "serve", 5);

        duk_push_c_lightfunc(ctx, request_free_raw, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "request_free_raw", 16);

        duk_push_c_lightfunc(ctx, request_get_host, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "request_get_host", 16);
        duk_push_c_lightfunc(ctx, request_get_method, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "request_get_method", 18);
        duk_push_c_lightfunc(ctx, request_get_uri, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "request_get_uri", 15);
        duk_push_c_lightfunc(ctx, request_get_uri_s, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "request_get_uri_s", 17);

        duk_push_c_lightfunc(ctx, uri_join, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "uri_join", 8);
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

        duk_push_c_lightfunc(ctx, status_text, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "status_text", 11);

        duk_push_c_lightfunc(ctx, create_flags, 0, 0, 0);
        duk_put_prop_lstring(ctx, -2, "create_flags", 12);

        duk_push_c_lightfunc(ctx, writer_response, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "writer_response", 15);
    }
    duk_call(ctx, 3);
    return 0;
}