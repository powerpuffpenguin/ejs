#include "c_string.h"
#include <string.h>
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
BOOL ppp_c_string_end_with(ppp_c_string_t *s, const char *str, size_t n)
{
    if (s->len < n)
    {
        return FALSE;
    }
    switch (n)
    {
    case 0:
        break;
    case 1:
        if (s->str[s->len - 1] != str[0])
        {
            return FALSE;
        }
    default:
        if (memcmp(s->str + s->len - n, str, n))
        {
            return FALSE;
        }
        break;
    }
    return TRUE;
}

BOOL ppp_c_string_start_with(ppp_c_string_t *s, const char *str, size_t n)
{
    if (s->len < n)
    {
        return FALSE;
    }
    switch (n)
    {
    case 0:
        break;
    case 1:
        if (s->str[0] != str[0])
        {
            return FALSE;
        }
    default:
        if (memcmp(s->str, str, n))
        {
            return FALSE;
        }
        break;
    }
    return TRUE;
}