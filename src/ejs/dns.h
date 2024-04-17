#ifndef _EMBEDDED_JS_DNS_H_
#define _EMBEDDED_JS_DNS_H_
#include <event2/event.h>
#include <event2/dns.h>
#include <netinet/in.h>
typedef struct
{
    struct event_base *base;
    struct evdns_base *dns;
    uint64_t count;
} ejs_dns_t;
ejs_dns_t *ejs_dns_new(struct event_base *base, int nameservers);
#endif