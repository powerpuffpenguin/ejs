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
    else
    {
        s->len = 0;
        s->str = 0;
    }
}
size_t ppp_c_string_grow_calculate(size_t _cap, size_t _len, size_t n)
{
    if (n)
    {
        size_t available;
        size_t cap;
        if (_cap)
        {
            available = _cap - _len;
            cap = _cap;
        }
        else
        {
            available = 0;
            n += _len;
            cap = 64;
        }

        if (available < n)
        {
            n -= available;

            // calculate capacity
            if (!_cap && n < 64)
            {
                cap = 64;
            }
            else
            {
                size_t c = _len + n;
                cap *= 2;
                if (c >= cap)
                {
                    cap = c;
                }
            }
            // malloc
            return cap;
        }
    }
    return 0;
}
int ppp_c_string_grow(ppp_c_string_t *s, size_t n)
{
    size_t cap = ppp_c_string_grow_calculate(s->cap, s->len, n);
    if (!cap)
    {
        return 0;
    }
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
        memcpy(p, s->str, s->len);
        s->str = p;
    }
    s->cap = cap;
    return 0;
}
int ppp_c_string_grow_to(ppp_c_string_t *s, size_t cap)
{
    if (s->cap < cap)
    {
        if (cap < s->len)
        {
            cap = s->len;
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
            memcpy(p, s->str, s->len);
            s->str = p;
        }
        s->cap = cap;
    }
    return 0;
}
void ppp_c_string_append_raw(ppp_c_string_t *s, const char *str, size_t n)
{
    memmove(s->str + s->len, str, n);
    s->len += n;
}
void ppp_c_string_append_char_raw(ppp_c_string_t *s, const char c)
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
            memcpy(s->str + s->len, str, n);
            s->len += n;
        }
        else
        {
            memmove(s->str + s->len, str, n);
            s->len += n;
        }
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
BOOL ppp_c_string_has_suffix_raw(const char *s, const size_t s_len, const char *suffix, const size_t suffix_len)
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
size_t ppp_c_stirng_first_char_raw(const char *s, const size_t s_len, const char c)
{
    for (size_t i = 0; i != s_len; i++)
    {
        if (s[i] == c)
        {
            return i;
        }
    }
    return -1;
}
size_t ppp_c_stirng_last_char_raw(const char *s, const size_t s_len, const char c)
{
    for (size_t i = s_len - 1; i != -1; i--)
    {
        if (s[i] == c)
        {
            return i;
        }
    }
    return -1;
}
static void __ppp_c_string_iteratorable_state_reset(void *state)
{
    ppp_c_string_iteratorable_state_t *p = state;
    p->i = 0;
}
void __ppp_c_string_iteratorable_state_next(void *state, ppp_c_string_iterator_t *iterator)
{
    ppp_c_string_iteratorable_state_t *p = state;
    if (p->p && p->i < p->n)
    {
        switch (p->t)
        {
        case PPP_C_STRING_TYPE_STRING:
        {
            ppp_c_string_t *s = (ppp_c_string_t *)p->p + p->i++;
            iterator->str = s->str;
            iterator->len = s->len;
            iterator->ok = 1;
        }
            return;
        case PPP_C_STRING_TYPE_STRING_PTR:
        {
            ppp_c_string_t *s = ((ppp_c_string_t **)(p->p))[p->i++];
            iterator->str = s->str;
            iterator->len = s->len;
            iterator->ok = 1;
        }
            return;
        case PPP_C_STRING_TYPE_FAST:
        {
            ppp_c_fast_string_t *s = (ppp_c_fast_string_t *)p->p + p->i++;
            iterator->str = s->str;
            iterator->len = s->len;
            iterator->ok = 1;
        }
            return;
        case PPP_C_STRING_TYPE_FAST_PTR:
        {
            ppp_c_fast_string_t *s = ((ppp_c_fast_string_t **)(p->p))[p->i++];
            iterator->str = s->str;
            iterator->len = s->len;
            iterator->ok = 1;
        }
            return;
        case PPP_C_STRING_TYPE_C:
        {
            char *s = ((char **)(p->p))[p->i++];
            iterator->str = s;
            iterator->len = strlen(s);
            iterator->ok = 1;
        }
            return;
        }
    }

    iterator->str = 0;
    iterator->len = 0;
    iterator->ok = 0;
}
static void __ppp_c_string_iteratorable_init(
    ppp_c_string_iteratorable_t *iteratorable, ppp_c_string_iteratorable_state_t *state,
    size_t t,
    void *p, size_t n)
{
    state->i = 0;
    state->n = n;
    state->p = p;
    state->t = t;

    iteratorable->state = state;
    iteratorable->next = __ppp_c_string_iteratorable_state_next;
    iteratorable->reset = __ppp_c_string_iteratorable_state_reset;
}
void ppp_c_string_iteratorable_init(
    ppp_c_string_iteratorable_t *iteratorable, ppp_c_string_iteratorable_state_t *state,
    ppp_c_string_t *c_string, size_t n)
{
    __ppp_c_string_iteratorable_init(iteratorable, state, PPP_C_STRING_TYPE_STRING, c_string, n);
}
void ppp_c_string_iteratorable_init_ptr(
    ppp_c_string_iteratorable_t *iteratorable, ppp_c_string_iteratorable_state_t *state,
    ppp_c_string_t **c_string_ptr, size_t n)
{
    __ppp_c_string_iteratorable_init(iteratorable, state, PPP_C_STRING_TYPE_STRING_PTR, c_string_ptr, n);
}
void ppp_c_string_iteratorable_init_fast(
    ppp_c_string_iteratorable_t *iteratorable, ppp_c_string_iteratorable_state_t *state,
    ppp_c_fast_string_t *c_fast_string, size_t n)
{
    __ppp_c_string_iteratorable_init(iteratorable, state, PPP_C_STRING_TYPE_FAST, c_fast_string, n);
}
void ppp_c_string_iteratorable_init_fast_ptr(
    ppp_c_string_iteratorable_t *iteratorable, ppp_c_string_iteratorable_state_t *state,
    ppp_c_fast_string_t **c_fast_string_ptr, size_t n)
{
    __ppp_c_string_iteratorable_init(iteratorable, state, PPP_C_STRING_TYPE_FAST_PTR, c_fast_string_ptr, n);
}
void ppp_c_string_iteratorable_init_c(
    ppp_c_string_iteratorable_t *iteratorable, ppp_c_string_iteratorable_state_t *state,
    char **strings, size_t n)
{
    __ppp_c_string_iteratorable_init(iteratorable, state, PPP_C_STRING_TYPE_C, strings, n);
}
int ppp_c_string_join(
    ppp_c_string_t *output,
    ppp_c_string_iteratorable_t *iteratorable,
    const char *sep, const size_t sep_len)
{
    ppp_c_string_iterator_t iter;
    size_t count = 0;
    size_t n = 0;
    for (iteratorable->next(iteratorable->state, &iter); iter.ok; iteratorable->next(iteratorable->state, &iter))
    {
        count++;
        n += iter.len;
    }
    switch (count)
    {
    case 0:
        output->len = 0;
        return 0;
    case 1:
    {
        iteratorable->reset(iteratorable->state);
        iteratorable->next(iteratorable->state, &iter);

        if (!output->cap)
        {
            if (output->str == iter.str)
            {
                output->len = iter.len;
                return 0;
            }
        }
        else if (output->cap >= iter.len)
        {
            output->len = iter.len;
            if (output->str != iter.str)
            {
                memmove(output->str, iter.str, iter.len);
            }
            return 0;
        }
        size_t len = output->len;
        output->len = 0;
        if (ppp_c_string_append(output, iter.str, iter.len))
        {
            output->len = len;
            return -1;
        }
    }
        return 0;
    }
    n += sep_len * (count - 1);

    if (output->cap < n)
    {
        size_t len = output->len;
        output->len = 0;
        if (ppp_c_string_grow(output, n))
        {
            output->len = len;
            return -1;
        }
    }
    else
    {
        output->len = 0;
    }

    iteratorable->reset(iteratorable->state);
    iteratorable->next(iteratorable->state, &iter);
    ppp_c_string_append_raw(output, iter.str, iter.len);
    for (iteratorable->next(iteratorable->state, &iter); iter.ok; iteratorable->next(iteratorable->state, &iter))
    {
        ppp_c_string_append_raw(output, sep, sep_len);
        ppp_c_string_append_raw(output, iter.str, iter.len);
    }
    return 0;
}