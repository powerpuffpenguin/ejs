#include "strings.h"
#include <string.h>
#include <stdio.h>
#include <stdlib.h>
void ejs_string_init(ejs_string_t *s, const char *c, size_t len, ejs_stirng_reference_t *r)
{
    s->c = (char *)c;
    s->len = len;
    if (r)
    {
        s->reference = r;

        r->c = s->c;
        r->len = len;
        r->used = 1;
    }
    else
    {
        s->reference = NULL;
    }
}

void ejs_string_destory(ejs_string_t *s)
{
    ejs_stirng_reference_t *r = s->reference;
    if (r)
    {
        memset(s, 0, sizeof(ejs_string_t));
        switch (r->used)
        {
        case 0:
            break;
        case 1:
        {
            char *c = r->c;
            memset(r, 0, sizeof(ejs_stirng_reference_t));
            free(c);
        }
        break;
        default:
            r->used--;
            break;
        }
    }
}
void ejs_string_println(ejs_string_t *s)
{
    for (int i = 0; i < s->len; i++)
    {
        printf("%c", s->c[i]);
    }
    printf("\n");
}
void ejs_string_set(ejs_string_t *l, ejs_string_t *r)
{
    if (l == r)
    {
        return;
    }
    if (l->reference)
    {
        ejs_string_destory(l);
    }
    l->c = r->c;
    l->len = r->len;
    l->reference = r->reference;
    if (l->reference)
    {
        l->reference->used++;
    }
}
void ejs_string_substr(ejs_string_t *sub, const ejs_string_t *s, size_t offset, size_t n)
{
    if (sub == s)
    {
        sub->len = n;
        sub->c += offset;
        return;
    }
    if (sub->reference)
    {
        ejs_string_destory(sub);
    }
    sub->c = s->c + offset;
    sub->len = n;
    sub->reference = s->reference;
    if (sub->reference)
    {
        sub->reference->used++;
    }
}
void ejs_string_set_string(ejs_string_t *s, const char *c)
{
    if (s->reference)
    {
        ejs_string_destory(s);
    }
    s->reference = NULL;
    s->c = (char *)c;
    s->len = strlen(c);
}
void ejs_string_set_lstring(ejs_string_t *s, const char *c, size_t len)
{
    if (s->reference)
    {
        ejs_string_destory(s);
    }
    s->reference = NULL;
    s->c = (char *)c;
    s->len = len;
}