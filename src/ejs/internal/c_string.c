#include "c_string.h"

ppp_c_fast_string_t ppp_c_fast_string_create(const char *str, const size_t len)
{
    ppp_c_fast_string_t s = {
        .str = str,
        .len = len,
    };
    return s;
}
ppp_c_string_t ppp_c_string_create(char *str, size_t len, size_t cap)
{
    ppp_c_string_t s = {
        .str = str,
        .len = len,
        .cap = cap,
    };
    return s;
}
char *ppp_c_string_c_str(ppp_c_string_t *s)
{
    if (s->cap)
    {
        s->str[s->len] = 0;
        return s->str;
    }
    return s->str ? s->str : "";
}
void ppp_c_string_destroy(ppp_c_string_t *s)
{
    if (s->cap)
    {
        free(s->str);
        s->cap = s->len = 0;
        s->str = 0;
    }
}
int ppp_c_string_grow(ppp_c_string_t *s, size_t n)
{
    if (n)
    {
        size_t available = s->cap ? s->cap - s->len : 0;
        if (available < n)
        {
            n -= available;

            // calculate capacity
            size_t cap;
            if (!s->cap && n < 64)
            {
                cap = 64;
            }
            else
            {
                size_t c = s->len + n;
                cap = s->cap ? (s->cap * 2) : (64 * 2);
                if (c >= cap)
                {
                    cap = c;
                }
            }
            // malloc
            if (s->cap)
            {
                void *p = realloc(s->str, cap + 1);
                if (!p)
                {
                    return -1;
                }
                s->str = p;
            }
            else
            {
                void *p = malloc(cap + 1);
                if (!p)
                {
                    return -1;
                }
                memmove(p, s->str, s->len);
                s->str = p;
            }
            s->cap = cap;
        }
    }
    return 0;
}
void ppp_c_string_append_raw(ppp_c_string_t *s, const char *str, size_t n)
{
    memmove(s->str + s->len, str, n);
    s->len += n;
}
void ppp_c_string_append_raw_char(ppp_c_string_t *s, const char c)
{
    s->str[s->len++] = c;
}
int ppp_c_string_append(ppp_c_string_t *s, const char *str, size_t n)
{
    if (n)
    {
        size_t available = s->cap ? s->cap - s->len : 0;
        if (available < n)
        {
            if (ppp_c_string_grow(s, n - available))
            {
                return -1;
            }
        }

        memmove(s->str + s->len, str, n);
        s->len += n;
    }
    return 0;
}
int ppp_c_string_append_char(ppp_c_string_t *s, const char c)
{
    size_t available = s->cap ? s->cap - s->len : 0;
    if (available < 1)
    {
        if (ppp_c_string_grow(s, 1))
        {
            return -1;
        }
    }
    s->str[s->len++] = c;
    return 0;
}

BOOL ppp_c_string_has_prefix_raw(const char *s, const size_t s_len, const char *prefix, const size_t prefix_len)
{
    if (s_len < prefix_len)
    {
        return FALSE;
    }
    switch (prefix_len)
    {
    case 0:
        return TRUE;
    case 1:
        return s[0] == prefix[0] ? TRUE : FALSE;
    default:
        return memcmp(s, prefix, prefix_len) ? FALSE : TRUE;
    }
}
BOOL ppp_c_string_has_suffix(const char *s, const size_t s_len, const char *suffix, const size_t suffix_len)
{
    if (s_len < suffix_len)
    {
        return FALSE;
    }
    switch (suffix_len)
    {
    case 0:
        return TRUE;
    case 1:
        return s[s_len - 1] == suffix[0] ? TRUE : FALSE;
    default:
        return memcmp(s + s_len - suffix_len, suffix, suffix_len) ? FALSE : TRUE;
    }
}