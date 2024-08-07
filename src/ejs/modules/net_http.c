#include "modules_shared.h"
#include "net.h"
#include "net_http.h"
#include "../core.h"
#include <stdio.h>
#include <errno.h>
#include "../js/net_http.h"
#include "../internal/sync_evconn_listener.h"
#include "../internal/utf8.h"
#include "../internal/strconv.h"

#include <event2/buffer.h>
#include <event2/event.h>
#include <event2/http.h>
#include <event2/ws.h>
#include <event2/bufferevent_ssl.h>

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
static duk_ret_t request_input_header(duk_context *ctx)
{
    struct evhttp_request *req = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    duk_push_pointer(ctx, evhttp_request_get_input_headers(req));
    return 1;
}
static duk_ret_t request_output_header(duk_context *ctx)
{
    struct evhttp_request *req = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    duk_push_pointer(ctx, evhttp_request_get_output_headers(req));
    return 1;
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
    case EJS_HTTP_StatusContinue:
        return "Continue";
    case EJS_HTTP_StatusSwitchingProtocols:
        return "Switching Protocols";
    case EJS_HTTP_StatusProcessing:
        return "Processing";
    case EJS_HTTP_StatusEarlyHints:
        return "Early Hints";
    case EJS_HTTP_StatusOK:
        return "OK";
    case EJS_HTTP_StatusCreated:
        return "Created";
    case EJS_HTTP_StatusAccepted:
        return "Accepted";
    case EJS_HTTP_StatusNonAuthoritativeInfo:
        return "Non-Authoritative Information";
    case EJS_HTTP_StatusNoContent:
        return "No Content";
    case EJS_HTTP_StatusResetContent:
        return "Reset Content";
    case EJS_HTTP_StatusPartialContent:
        return "Partial Content";
    case EJS_HTTP_StatusMultiStatus:
        return "Multi-Status";
    case EJS_HTTP_StatusAlreadyReported:
        return "Already Reported";
    case EJS_HTTP_StatusIMUsed:
        return "IM Used";
    case EJS_HTTP_StatusMultipleChoices:
        return "Multiple Choices";
    case EJS_HTTP_StatusMovedPermanently:
        return "Moved Permanently";
    case EJS_HTTP_StatusFound:
        return "Found";
    case EJS_HTTP_StatusSeeOther:
        return "See Other";
    case EJS_HTTP_StatusNotModified:
        return "Not Modified";
    case EJS_HTTP_StatusUseProxy:
        return "Use Proxy";
    case EJS_HTTP_StatusTemporaryRedirect:
        return "Temporary Redirect";
    case EJS_HTTP_StatusPermanentRedirect:
        return "Permanent Redirect";
    case EJS_HTTP_StatusBadRequest:
        return "Bad Request";
    case EJS_HTTP_StatusUnauthorized:
        return "Unauthorized";
    case EJS_HTTP_StatusPaymentRequired:
        return "Payment Required";
    case EJS_HTTP_StatusForbidden:
        return "Forbidden";
    case EJS_HTTP_StatusNotFound:
        return "Not Found";
    case EJS_HTTP_StatusMethodNotAllowed:
        return "Method Not Allowed";
    case EJS_HTTP_StatusNotAcceptable:
        return "Not Acceptable";
    case EJS_HTTP_StatusProxyAuthRequired:
        return "Proxy Authentication Required";
    case EJS_HTTP_StatusRequestTimeout:
        return "Request Timeout";
    case EJS_HTTP_StatusConflict:
        return "Conflict";
    case EJS_HTTP_StatusGone:
        return "Gone";
    case EJS_HTTP_StatusLengthRequired:
        return "Length Required";
    case EJS_HTTP_StatusPreconditionFailed:
        return "Precondition Failed";
    case EJS_HTTP_StatusRequestEntityTooLarge:
        return "Request Entity Too Large";
    case EJS_HTTP_StatusRequestURITooLong:
        return "Request URI Too Long";
    case EJS_HTTP_StatusUnsupportedMediaType:
        return "Unsupported Media Type";
    case EJS_HTTP_StatusRequestedRangeNotSatisfiable:
        return "Requested Range Not Satisfiable";
    case EJS_HTTP_StatusExpectationFailed:
        return "Expectation Failed";
    case EJS_HTTP_StatusTeapot:
        return "I'm a teapot";
    case EJS_HTTP_StatusMisdirectedRequest:
        return "Misdirected Request";
    case EJS_HTTP_StatusUnprocessableEntity:
        return "Unprocessable Entity";
    case EJS_HTTP_StatusLocked:
        return "Locked";
    case EJS_HTTP_StatusFailedDependency:
        return "Failed Dependency";
    case EJS_HTTP_StatusTooEarly:
        return "Too Early";
    case EJS_HTTP_StatusUpgradeRequired:
        return "Upgrade Required";
    case EJS_HTTP_StatusPreconditionRequired:
        return "Precondition Required";
    case EJS_HTTP_StatusTooManyRequests:
        return "Too Many Requests";
    case EJS_HTTP_StatusRequestHeaderFieldsTooLarge:
        return "Request Header Fields Too Large";
    case EJS_HTTP_StatusUnavailableForLegalReasons:
        return "Unavailable For Legal Reasons";
    case EJS_HTTP_StatusInternalServerError:
        return "Internal Server Error";
    case EJS_HTTP_StatusNotImplemented:
        return "Not Implemented";
    case EJS_HTTP_StatusBadGateway:
        return "Bad Gateway";
    case EJS_HTTP_StatusServiceUnavailable:
        return "Service Unavailable";
    case EJS_HTTP_StatusGatewayTimeout:
        return "Gateway Timeout";
    case EJS_HTTP_StatusHTTPVersionNotSupported:
        return "HTTP Version Not Supported";
    case EJS_HTTP_StatusVariantAlsoNegotiates:
        return "Variant Also Negotiates";
    case EJS_HTTP_StatusInsufficientStorage:
        return "Insufficient Storage";
    case EJS_HTTP_StatusLoopDetected:
        return "Loop Detected";
    case EJS_HTTP_StatusNotExtended:
        return "Not Extended";
    case EJS_HTTP_StatusNetworkAuthenticationRequired:
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
        if (evbuffer_add(reply, buf, len) == -1)
        {
            evbuffer_free(reply);
            duk_push_error_object(ctx, DUK_ERR_ERROR, "evbuffer_add fail");
            duk_throw(ctx);
        }
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
typedef struct
{
    ejs_core_t *core;
    struct evhttp_request *req;
    struct evbuffer *databuf;
} chunk_writer_t;
static duk_ret_t chunk_writer_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    chunk_writer_t *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        evhttp_send_reply_end(p->req);
        if (p->databuf)
        {
            evbuffer_free(p->databuf);
        }
        free(p);
    }
    return 0;
}
typedef struct
{
    chunk_writer_t *writer;

} create_chunk_writer_args_t;
static duk_ret_t create_chunk_writer_impl(duk_context *ctx)
{
    create_chunk_writer_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "r", 1);
    struct evhttp_request *req = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "code", 4);
    int code = EJS_REQUIRE_NUMBER_VALUE_DEFAULT(ctx, -1, 200);
    duk_pop(ctx);
    ejs_core_t *core = ejs_require_core(ctx);

    args->writer = malloc(sizeof(chunk_writer_t));
    if (!args->writer)
    {
        ejs_throw_os_errno(ctx);
    }
    args->writer->core = core;
    args->writer->databuf = 0;

    evhttp_send_reply_start(req, code, _status_text(code));
    args->writer->req = req;

    duk_push_pointer(ctx, args->writer);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_push_c_lightfunc(ctx, chunk_writer_finalizer, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->writer = 0;

    ejs_stash_put_pointer(ctx, EJS_STASH_NET_HTTP_SERVER_CHUNK);
    return 1;
}
static duk_ret_t create_chunk_writer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "f", 1);
    uint8_t *flags = duk_require_buffer_data(ctx, -1, 0);
    duk_pop(ctx);

    create_chunk_writer_args_t args = {0};
    if (ejs_pcall_function_n(ctx, create_chunk_writer_impl, &args, 2))
    {
        if (args.writer)
        {
            if (args.writer->req)
            {
                flags[0] = 0;
                evhttp_send_reply_end(args.writer->req);
            }
            free(args.writer);
        }
        duk_throw(ctx);
    }
    flags[0] = 0;
    return 1;
}
static duk_ret_t close_chunk_writer(duk_context *ctx)
{
    chunk_writer_t *p = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_NET_HTTP_SERVER_CHUNK);
    if (p)
    {
        evhttp_send_reply_end(p->req);
        if (p->databuf)
        {
            evbuffer_free(p->databuf);
        }
        free(p);
    }
    return 0;
}
static duk_ret_t write_chunk_writer_cb_impl(duk_context *ctx)
{
    chunk_writer_t *p = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    if (ejs_stash_get_pointer(ctx, p, EJS_STASH_NET_HTTP_SERVER_CHUNK))
    {
        duk_get_prop_lstring(ctx, -1, "cb", 2);
        duk_call(ctx, 0);
    }
    return 0;
}
static void write_chunk_writer_cb(struct evhttp_connection *conn, void *userdata)
{
    ejs_call_callback_noresult(
        ((chunk_writer_t *)userdata)->core->duk,
        write_chunk_writer_cb_impl, userdata,
        0);
}
static duk_ret_t write_chunk_writer(duk_context *ctx)
{
    chunk_writer_t *p = duk_require_pointer(ctx, 0);
    duk_size_t s_len;
    const char *s = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &s_len);
    if (!p->databuf)
    {
        p->databuf = evbuffer_new();
        if (!p->databuf)
        {
            duk_pop_2(ctx);
            duk_push_error_object(ctx, DUK_ERR_ERROR, "evbuffer_new fail");
            duk_throw(ctx);
        }
    }
    if (evbuffer_add(p->databuf, s, s_len) == -1)
    {
        duk_pop_2(ctx);
        duk_push_error_object(ctx, DUK_ERR_ERROR, "evbuffer_add fail");
        duk_throw(ctx);
    }
    evhttp_send_reply_chunk_with_cb(
        p->req,
        p->databuf,
        write_chunk_writer_cb, p);
    return 0;
}
typedef struct
{
    ejs_core_t *core;
    struct evws_connection *ws;
} ws_conn_t;
static duk_ret_t ws_conn_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    ws_conn_t *ws = duk_get_pointer_default(ctx, -1, 0);
    if (ws)
    {
        evws_connection_free(ws->ws);
        free(ws);
    }
    return 0;
}
static void on_server_ws_msg_cb(struct evws_connection *ws, int type, const unsigned char *data, size_t data_len, void *userdata)
{
    puts("on_server_ws_msg_cb");
}
typedef struct
{
    ws_conn_t *p;
    uint8_t *flags;
    struct evhttp_request *req;
} ws_upgrade_args_t;
static duk_ret_t ws_upgrade_args(duk_context *ctx)
{
    ws_upgrade_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    ejs_core_t *core = ejs_require_core(ctx);

    args->p = malloc(sizeof(ws_conn_t));
    if (!args->p)
    {
        ejs_throw_os_errno(ctx);
    }
    args->p->core = core;
    args->p->ws = evws_new_session(args->req, on_server_ws_msg_cb, args->p, 0);
    if (!args->p->ws)
    {
        duk_push_undefined(ctx);
        return 1;
    }
    struct bufferevent *buf = evws_connection_get_bufferevent(args->p->ws);
    bufferevent_disable(buf, EV_READ);

    duk_push_object(ctx);
    duk_push_pointer(ctx, args->p);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_push_c_lightfunc(ctx, ws_conn_finalizer, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->p = 0;

    ejs_stash_put_pointer(ctx, EJS_STASH_NET_HTTP_WEBSOCKET);
    return 1;
}
static duk_ret_t ws_upgrade(duk_context *ctx)
{
    ws_upgrade_args_t args = {
        .p = 0,
        .flags = duk_require_buffer_data(ctx, 0, 0),
        .req = duk_require_pointer(ctx, 1),
    };
    duk_pop_2(ctx);
    if (ejs_pcall_function(ctx, ws_upgrade_args, &args))
    {
        if (args.p)
        {
            if (args.p->ws)
            {
                evws_connection_free(args.p->ws);
            }
            free(args.p);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t ws_free(duk_context *ctx)
{
    ws_conn_t *ws = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_NET_HTTP_WEBSOCKET);
    if (ws)
    {
        evws_connection_free(ws->ws);
        free(ws);
    }
    return 0;
}
static duk_ret_t ws_write(duk_context *ctx)
{
    ws_conn_t *ws = duk_require_pointer(ctx, 0);
    if (duk_is_string(ctx, 1))
    {
        const uint8_t *s = duk_require_string(ctx, 1);
        evws_send_text(ws, s);
    }
    else
    {
        duk_size_t s_len;
        const uint8_t *s = duk_require_buffer_data(ctx, 1, &s_len);
        evws_send_binary(ws, s, s_len);
    }
    return 0;
}
static duk_ret_t ws_close(duk_context *ctx)
{
    ws_conn_t *ws = duk_require_pointer(ctx, 0);
    uint16_t reason = (uint16_t)duk_require_number(ctx, 1);
    evws_close(ws, reason);

    return 0;
}
static duk_ret_t header_set(duk_context *ctx)
{
    struct evkeyvalq *headers = duk_require_pointer(ctx, 0);
    const char *key = duk_require_string(ctx, 1);
    const char *value = duk_require_string(ctx, 2);
    while (!evhttp_remove_header(headers, key))
    {
    }
    evhttp_add_header(headers, key, value);
    return 0;
}
static duk_ret_t header_add(duk_context *ctx)
{
    struct evkeyvalq *headers = duk_require_pointer(ctx, 0);
    const char *key = duk_require_string(ctx, 1);
    const char *value = duk_require_string(ctx, 2);
    evhttp_add_header(headers, key, value);
    return 0;
}
static duk_ret_t header_get(duk_context *ctx)
{
    struct evkeyvalq *headers = duk_require_pointer(ctx, 0);
    const char *s = duk_require_string(ctx, 1);

    s = evhttp_find_header(headers, s);

    duk_pop_2(ctx);
    duk_push_string(ctx, s);

    return 1;
}
static duk_ret_t header_del(duk_context *ctx)
{
    struct evkeyvalq *headers = duk_require_pointer(ctx, 0);
    const char *key = duk_require_string(ctx, 1);
    evhttp_remove_header(headers, key);
    return 0;
}
static duk_ret_t header_del_all(duk_context *ctx)
{
    struct evkeyvalq *headers = duk_require_pointer(ctx, 0);
    const char *key = duk_require_string(ctx, 1);
    while (!evhttp_remove_header(headers, key))
    {
    }
    return 0;
}
static duk_ret_t header_clear(duk_context *ctx)
{
    struct evkeyvalq *headers = duk_require_pointer(ctx, 0);
    evhttp_clear_headers(headers);
    return 0;
}
typedef struct
{
    const uint8_t *s;
    duk_size_t s_len;
    uint8_t *p;
    duk_size_t cap;
} html_escape_args_t;
static duk_ret_t html_escape_impl(duk_context *ctx)
{
    html_escape_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    args->p = malloc(args->cap);
    if (!args->p)
    {
        ejs_throw_os_errno(ctx);
    }

    duk_size_t index = 0;
    for (duk_size_t i = 0; i < args->s_len; i++)
    {
        switch (args->s[i])
        {
        case '&':
            memcpy(args->p + index, "&amp;", 5);
            index += 5;
            break;
        case '"':
            memcpy(args->p + index, "&#34;", 5);
            index += 5;
            break;
        case '\'':
            memcpy(args->p + index, "&#39;", 5);
            index += 5;
            break;
        case '<':
            memcpy(args->p + index, "&lt;", 4);
            index += 4;
            break;
        case '>':
            memcpy(args->p + index, "&gt;", 4);
            index += 4;
            break;
        default:
            args->p[index++] = args->s[i];
            break;
        }
    }
    duk_push_lstring(ctx, args->p, args->cap);

    free(args->p);
    args->p = 0;

    return 1;
}
static duk_ret_t html_escape(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = duk_require_lstring(ctx, 0, &s_len);
    if (s_len)
    {
        duk_size_t n = 0;
        for (duk_size_t i = 0; i < s_len; i++)
        {
            switch (s[i])
            {
            case '&':
            case '"':
            case '\'':
                n += 5;
                break;
            case '<':
            case '>':
                n += 4;
                break;
            }
        }
        if (n)
        {
            html_escape_args_t args = {
                .s = s,
                .s_len = s_len,
                .p = 0,
                .cap = s_len + n,
            };
            if (ejs_pcall_function(ctx, html_escape_impl, &args))
            {
                if (args.p)
                {
                    free(args.p);
                }
                duk_throw(ctx);
            }
        }
    }
    return 1;
}
static duk_ret_t hexEscapeNonASCII_impl(duk_context *ctx)
{
    html_escape_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    args->p = malloc(args->cap);
    if (!args->p)
    {
        ejs_throw_os_errno(ctx);
    }

    duk_size_t pos = 0;
    uint8_t *p = args->p;
    for (duk_size_t i = 0; i < args->s_len; i++)
    {
        if (args->s[i] >= PPP_UTF8_RUNE_SELF)
        {
            if (pos < i)
            {
                pos = i - pos;
                memcpy(p, args->s + pos, pos);
                p += pos;
            }
            p[0] = '%';
            ppp_strconv_format_bits_a_t a;
            size_t n = sizeof(a.a);
            ppp_strconv_format_bits(0, &a, (uint64_t)(args->s[i]), 16, 0, 0);
            memcpy(p + 1, a.a + a.i, 2);

            p += 3;
            pos = i + 1;
        }
    }

    duk_push_lstring(ctx, args->p, args->cap);

    free(args->p);
    args->p = 0;

    return 1;
}
static duk_ret_t hexEscapeNonASCII(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = duk_require_lstring(ctx, 0, &s_len);
    duk_size_t new_len = 0;
    for (duk_size_t i = 0; i < s_len; i++)
    {
        if (s[i] >= PPP_UTF8_RUNE_SELF)
        {
            new_len += 3;
        }
        else
        {
            new_len++;
        }
    }
    if (new_len == s_len)
    {
        return 1;
    }
    html_escape_args_t args = {
        .s = s,
        .s_len = s_len,
        .p = 0,
        .cap = new_len,
    };
    if (ejs_pcall_function(ctx, hexEscapeNonASCII_impl, &args))
    {
        if (args.p)
        {
            free(args.p);
        }
        duk_throw(ctx);
    }

    return 1;
}
EJS_SHARED_MODULE__DECLARE(net_http)
{
    /*
     *  Entry stack: [ require exports ]
     */

    duk_eval_lstring(ctx, js_ejs_js_net_http_min_js, js_ejs_js_net_http_min_js_len);
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
        duk_push_c_lightfunc(ctx, request_input_header, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "request_input_header", 20);
        duk_push_c_lightfunc(ctx, request_output_header, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "request_output_header", 21);

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
        duk_push_c_lightfunc(ctx, create_chunk_writer, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "create_chunk_writer", 19);
        duk_push_c_lightfunc(ctx, close_chunk_writer, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "close_chunk_writer", 18);
        duk_push_c_lightfunc(ctx, write_chunk_writer, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "write_chunk_writer", 18);

        duk_push_c_lightfunc(ctx, ws_upgrade, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "ws_upgrade", 10);
        duk_push_c_lightfunc(ctx, ws_free, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "ws_free", 7);
        duk_push_c_lightfunc(ctx, ws_write, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "ws_write", 8);
        duk_push_c_lightfunc(ctx, ws_close, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "ws_close", 8);
        

        duk_push_c_lightfunc(ctx, header_set, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "header_set", 10);
        duk_push_c_lightfunc(ctx, header_add, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "header_add", 10);
        duk_push_c_lightfunc(ctx, header_get, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "header_get", 10);
        duk_push_c_lightfunc(ctx, header_del, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "header_del", 10);
        duk_push_c_lightfunc(ctx, header_del_all, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "header_del_all", 14);
        duk_push_c_lightfunc(ctx, header_clear, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "header_clear", 12);

        duk_push_c_lightfunc(ctx, html_escape, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "html_escape", 11);
        duk_push_c_lightfunc(ctx, hexEscapeNonASCII, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "hexEscapeNonASCII", 17);
    }
    duk_call(ctx, 3);
    return 0;
}