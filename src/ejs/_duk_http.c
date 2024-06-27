#include "_duk_http.h"
#include "core.h"
#include <stdio.h>
#include <errno.h>

#include <event2/buffer.h>
#include <event2/event.h>
#include <event2/http.h>
#include <event2/bufferevent_ssl.h>
#include "internal/sync_evconn_listener.h"

#include <mbedtls/net_sockets.h>
#include <mbedtls/debug.h>
#include <mbedtls/ssl.h>
#include <mbedtls/entropy.h>
#include <mbedtls/ctr_drbg.h>
#include <mbedtls/error.h>
#include <mbedtls/timing.h>
static void
my_debug(void *ctx, int level, const char *file, int line, const char *str)
{
    ((void)level);

    fprintf(ctx, "%s:%04d: %s\n", file, line, str);
}
static void generic_request_handler(struct evhttp_request *req, void *ctx)
{
    struct evbuffer *reply = evbuffer_new();

    printf("%s\n", evhttp_request_get_host(req));
    evbuffer_add_printf(reply, "It works!");
    evhttp_send_reply(req, HTTP_OK, NULL, reply);
    evbuffer_free(reply);
}

static void listener_cb(sync_evconn_listener_t *l, evutil_socket_t s, struct sockaddr *sa, int salen, void *userdata)
{
    puts("listener_cb");
    evhttp_serve(userdata, s, sa, salen, 0);
}

static duk_ret_t http_server(duk_context *ctx)
{

    ejs_core_t *core = ejs_require_core(ctx);
    struct evhttp *http_server = evhttp_new(core->base);

    struct sockaddr_in sin;
    memset(&sin, 0, sizeof(sin));
    sin.sin_family = AF_INET;
    sin.sin_port = htons(9000);
    sin.sin_addr.s_addr = INADDR_ANY;

    int s = sync_evconn_create_listen(AF_INET, SOCK_STREAM, IPPROTO_TCP,
                                      (struct sockaddr *)&sin, sizeof(sin),
                                      128);
    if (s < 0)
    {
        ejs_throw_os_errno(ctx);
        return 0;
    }
    sync_evconn_listener_t *l = sync_evconn_listener_new(core->base,
                                                         (sync_evconn_listener_cb)listener_cb,
                                                         0,
                                                         http_server, s);
    if (!l)
    {
        ejs_throw_os_errno(ctx);
        return 0;
    }

    // sin.sin_port = htons(9090);

    {
        // evhttp_bind_socket(http_server, "0.0.0.0", 9000);
        // struct evconnlistener *l = evconnlistener_new_bind(
        //     core->base,
        //     listener_cb, core,
        //     LEV_OPT_CLOSE_ON_FREE | LEV_OPT_REUSEABLE | LEV_OPT_DISABLED,
        //     5,
        //     (struct sockaddr *)&sin, sizeof(sin));
        // if (!l)
        // {
        //     puts("evconnlistener_new_bind fail");
        //     return 0;
        // }
        // evconnlistener_enable(l);
        // evhttp_bind_listener(http_server, l);
        evhttp_set_gencb(http_server, generic_request_handler, NULL);
        printf("listen on: 0.0.0.0:9000 \n");
    }
    return 0;
}
static void tcp_connection_write_cb(struct bufferevent *bev, void *ptr)
{
    puts("tcp_connection_write_cb");
}
static void tcp_connection_event_cb(struct bufferevent *bev, short what, void *ptr)
{
    puts("tcp_connection_event_cb");
    if (what & BEV_EVENT_TIMEOUT)
    {

        puts("connect timeout");
    }
    else if (what & BEV_EVENT_ERROR)
    {
        printf("err: %d %s\n", errno, strerror(errno));
    }
    else
    {
        puts("connect ok");
        bufferevent_free(bev);
        bufferevent_free(ptr);
        exit(1);
    }
}
static void tcp_connection_read_cb(struct bufferevent *bev, void *ptr)
{
    puts("tcp_connection_read_cb");
}
static void
err_mbedtls(const char *func, int err)
{
    char buf[1024];
    mbedtls_strerror(err, buf, sizeof(buf));
    fprintf(stderr, "%s failed:%d, %s\n", func, err, buf);
}
static int cert_verify_callback(void *userdata, mbedtls_x509_crt *crt,
                                int depth, uint32_t *flags)
{
    puts("cert_verify_callback------------");
    *flags = 0;
    return 0;
}
#define TEST_CA_CRT_RSA_SHA256_PEM                                         \
    "-----BEGIN CERTIFICATE-----\r\n"                                      \
    "MIIDQTCCAimgAwIBAgIBAzANBgkqhkiG9w0BAQsFADA7MQswCQYDVQQGEwJOTDER\r\n" \
    "MA8GA1UECgwIUG9sYXJTU0wxGTAXBgNVBAMMEFBvbGFyU1NMIFRlc3QgQ0EwHhcN\r\n" \
    "MTkwMjEwMTQ0NDAwWhcNMjkwMjEwMTQ0NDAwWjA7MQswCQYDVQQGEwJOTDERMA8G\r\n" \
    "A1UECgwIUG9sYXJTU0wxGTAXBgNVBAMMEFBvbGFyU1NMIFRlc3QgQ0EwggEiMA0G\r\n" \
    "CSqGSIb3DQEBAQUAA4IBDwAwggEKAoIBAQDA3zf8F7vglp0/ht6WMn1EpRagzSHx\r\n" \
    "mdTs6st8GFgIlKXsm8WL3xoemTiZhx57wI053zhdcHgH057Zk+i5clHFzqMwUqny\r\n" \
    "50BwFMtEonILwuVA+T7lpg6z+exKY8C4KQB0nFc7qKUEkHHxvYPZP9al4jwqj+8n\r\n" \
    "YMPGn8u67GB9t+aEMr5P+1gmIgNb1LTV+/Xjli5wwOQuvfwu7uJBVcA0Ln0kcmnL\r\n" \
    "R7EUQIN9Z/SG9jGr8XmksrUuEvmEF/Bibyc+E1ixVA0hmnM3oTDPb5Lc9un8rNsu\r\n" \
    "KNF+AksjoBXyOGVkCeoMbo4bF6BxyLObyavpw/LPh5aPgAIynplYb6LVAgMBAAGj\r\n" \
    "UDBOMAwGA1UdEwQFMAMBAf8wHQYDVR0OBBYEFLRa5KWz3tJS9rnVppUP6z68x/3/\r\n" \
    "MB8GA1UdIwQYMBaAFLRa5KWz3tJS9rnVppUP6z68x/3/MA0GCSqGSIb3DQEBCwUA\r\n" \
    "A4IBAQA4qFSCth2q22uJIdE4KGHJsJjVEfw2/xn+MkTvCMfxVrvmRvqCtjE4tKDl\r\n" \
    "oK4MxFOek07oDZwvtAT9ijn1hHftTNS7RH9zd/fxNpfcHnMZXVC4w4DNA1fSANtW\r\n" \
    "5sY1JB5Je9jScrsLSS+mAjyv0Ow3Hb2Bix8wu7xNNrV5fIf7Ubm+wt6SqEBxu3Kb\r\n" \
    "+EfObAT4huf3czznhH3C17ed6NSbXwoXfby7stWUDeRJv08RaFOykf/Aae7bY5PL\r\n" \
    "yTVrkAnikMntJ9YI+hNNYt3inqq11A5cN0+rVTst8UKCxzQ4GpvroSwPKTFkbMw4\r\n" \
    "/anT1dVxr/BtwJfiESoK3/4CeXR1\r\n"                                     \
    "-----END CERTIFICATE-----\r\n"
const char mbedtls_test_cas_pem[] = TEST_CA_CRT_RSA_SHA256_PEM;
const size_t mbedtls_test_cas_pem_len = sizeof(mbedtls_test_cas_pem);

static duk_ret_t http_dial(duk_context *ctx)
{
    const char *s = duk_require_string(ctx, 0);
    mbedtls_debug_set_threshold(4);

    const char *pers = "ssl_client1";

    static mbedtls_entropy_context entropy;
    static mbedtls_ctr_drbg_context ctr_drbg;
    static mbedtls_dyncontext *ssl;
    static mbedtls_ssl_config conf;
    static mbedtls_x509_crt cacert;

    /*
     * 0. Initialize the RNG and the session data
     */
    mbedtls_ssl_config_init(&conf);
    mbedtls_x509_crt_init(&cacert);
    mbedtls_ctr_drbg_init(&ctr_drbg);

    mbedtls_entropy_init(&entropy);
    int ret;
    if ((ret = mbedtls_ctr_drbg_seed(&ctr_drbg, mbedtls_entropy_func, &entropy,
                                     (const unsigned char *)pers, strlen(pers))) != 0)
    {
        printf(" failed\n  ! mbedtls_ctr_drbg_seed returned %d\n", ret);
        return 0;
    }
    psa_crypto_init();
    puts(mbedtls_test_cas_pem);

    printf("s %d %d:\n%s\n",
           mbedtls_test_cas_pem_len, strlen(s),
           "");
    // for (size_t i = 0; i < mbedtls_test_cas_pem_len; i++)
    // {
    //     int ok = s[i] == mbedtls_test_cas_pem[i];
    //     printf("%03d. %d %d %d\n", i, s[i], mbedtls_test_cas_pem[i], ok);
    //     if (!ok)
    //     {
    //         printf("%03d. %d %d %d\n", i, s[i + 1], mbedtls_test_cas_pem[i + 1], ok);
    //         printf("%03d. %d %d %d\n", i, s[i + 2], mbedtls_test_cas_pem[i + 2], ok);
    //         break;
    //     }
    // }

    // ret = mbedtls_x509_crt_parse(&cacert,
    //                              (const unsigned char *)mbedtls_test_cas_pem, mbedtls_test_cas_pem_len);
    ret = mbedtls_x509_crt_parse(&cacert,
                                 (const unsigned char *)s, strlen(s) + 1);
    if (ret < 0)
    {
        printf(
            " failed\n  !  mbedtls_x509_crt_parse returned -0x%x\n\n", -ret);
        return 0;
    }

    return 0;
}
duk_ret_t _ejs_native_http_init(duk_context *ctx)
{
    /*
     *  Entry stack: [ require exports ]
     */

    // duk_eval_lstring(ctx, js_ejs_js_net_min_js, js_ejs_js_net_min_js_len);
    // duk_swap_top(ctx, -2);

    // duk_push_heap_stash(ctx);
    // duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    // duk_swap_top(ctx, -2);
    // duk_pop(ctx);

    // duk_push_object(ctx);
    // {
    // }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    // duk_call(ctx, 3);

    duk_push_c_lightfunc(ctx, http_server, 0, 0, 0);
    duk_put_prop_lstring(ctx, -2, "server", 6);

    duk_push_c_lightfunc(ctx, http_dial, 1, 1, 0);
    duk_put_prop_lstring(ctx, -2, "dial", 4);
    return 0;
}