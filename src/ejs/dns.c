#include "dns.h"
#include <stdlib.h>
ejs_dns_t *ejs_dns_new(struct event_base *base, int nameservers)
{
    struct evdns_base *base_dns = evdns_base_new(base, nameservers != 0 ? nameservers : EVDNS_BASE_INITIALIZE_NAMESERVERS | EVDNS_BASE_DISABLE_WHEN_INACTIVE);
    if (!base_dns)
    {
        return 0;
    }
    ejs_dns_t *p = (ejs_dns_t *)malloc(sizeof(ejs_dns_t));
    if (p)
    {
        p->base = base;
        p->dns = base_dns;
        p->count = 1;
    }
    else
    {
        evdns_base_free(base_dns, 0);
    }
    return p;
}