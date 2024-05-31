#include "buffer.h"
#include <string.h>
#include <errno.h>
void ppp_buffer_init(ppp_buffer_t *buf)
{
    memset(buf, 0, sizeof(ppp_buffer_t));
}
void ppp_buffer_destroy(ppp_buffer_t *buf)
{
    struct ppp_buffer_element *ele = buf->front;
    struct ppp_buffer_element *next;
    while (ele)
    {
        next = ele->next;
        free(ele);
        ele = next;
    }
    buf->front = 0;
    buf->back = 0;
}

int ppp_buffer_write(ppp_buffer_t *buf, const void *src, size_t n, size_t alloc)
{
    if (!n)
    {
        return 0;
    }

    struct ppp_buffer_element *ele = buf->back;
    if (!ele)
    {
        // first write
        size_t cap = n > alloc ? n : alloc;
        if (cap < PPP_BUFFER_MIN_ALLOC_P)
        {
            cap = PPP_BUFFER_MIN_ALLOC_P;
        }
        ele = malloc(sizeof(struct ppp_buffer_element) + cap);
        if (!ele)
        {
            return -1;
        }

        ele->next = 0;
        ele->capacity = cap;
        ele->offset = 0;
        ele->len = n;

        memmove(PPP_BUFFER_ELEMENT_P(ele), src, n);

        buf->front = ele;
        buf->back = ele;
        return n;
    }

    size_t writable = ele->capacity - ele->offset - ele->len;
    if (writable >= n)
    {
        memmove(PPP_BUFFER_ELEMENT_P(ele) + ele->offset + ele->len, src, n);
        ele->len += n;
        return n;
    }

    size_t min_alloc = n - writable;
    size_t cap = min_alloc > alloc ? min_alloc : alloc;
    if (cap < PPP_BUFFER_MIN_ALLOC_P)
    {
        cap = PPP_BUFFER_MIN_ALLOC_P;
    }
    struct ppp_buffer_element *back = malloc(sizeof(struct ppp_buffer_element) + cap);
    if (!back)
    {
        return -1;
    }
    if (writable)
    {
        memmove(PPP_BUFFER_ELEMENT_P(ele) + ele->offset + ele->len, src, writable);
        ele->len += n;
        src = (const uint8_t *)src + writable;
    }

    back->next = 0;
    back->capacity = cap;
    back->offset = 0;
    back->len = min_alloc;
    memmove(PPP_BUFFER_ELEMENT_P(back), src, min_alloc);

    ele->next = back;
    buf->back = back;
    return n;
}
int ppp_buffer_read(ppp_buffer_t *buf, void *dst, size_t n)
{
    if (!buf->front || !n)
    {
        return 0;
    }
    int offset = 0;
    int len;
    struct ppp_buffer_element *ele = buf->front;
    struct ppp_buffer_element *next;
    while (n)
    {
        if (!ele->len)
        {
            next = ele->next;
            free(ele);
            ele = next;
            buf->front = ele;
            if (ele)
            {
                continue;
            }
            else
            {
                buf->back = 0;
                break;
            }
        }
        len = ele->len < n ? ele->len : n;

        memmove((uint8_t *)dst + offset, PPP_BUFFER_ELEMENT_P(ele) + ele->offset, len);

        offset += len;

        n -= len;
        ele->len -= len;
        ele->offset += len;
    }
    return offset;
}