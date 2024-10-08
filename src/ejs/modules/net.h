#ifndef _EMBEDDED_JS__DUK_MODULES_NET_H_
#define _EMBEDDED_JS__DUK_MODULES_NET_H_

#ifndef IPv6len
#define IPv6len 16
#endif

#ifndef IPv4len
#define IPv4len 4
#endif

#include <mbedtls/net_sockets.h>
#include <mbedtls/debug.h>
#include <mbedtls/ssl.h>
#include <mbedtls/entropy.h>
#include <mbedtls/ctr_drbg.h>
#include <mbedtls/error.h>
#include <mbedtls/timing.h>

typedef struct
{
    mbedtls_entropy_context entropy;
    mbedtls_ctr_drbg_context ctr_drbg;
    mbedtls_ssl_config conf;
    mbedtls_x509_crt srvcert;
    mbedtls_pk_context pkey;
} tcp_server_tls_t;

typedef struct
{
    mbedtls_entropy_context entropy;
    mbedtls_ctr_drbg_context ctr_drbg;
    mbedtls_ssl_config conf;
    mbedtls_x509_crt cacert;
} tcp_tls_t;
duk_ret_t __ejs_net_create_tls(duk_context *ctx);
#endif