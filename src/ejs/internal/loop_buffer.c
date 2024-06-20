#include "loop_buffer.h"
#include <string.h>

int ppp_loop_buffer_write(ppp_loop_buffer_t *buf, const void *data, const size_t data_len)
{
    if (data_len && PPP_LOOP_BUFFER_AVAILABLE(buf) >= data_len)
    {
        if (buf->offset || buf->len)
        {
            size_t i = (buf->offset + buf->len) % buf->cap;
            size_t max = buf->cap - i;
            if (max < data_len)
            {
                memcpy(buf->buf + i, data, max);
                memcpy(buf->buf, data + max, data_len - max);
            }
            else
            {
                memcpy(buf->buf + i, data, data_len);
            }
        }
        else
        {
            memcpy(buf->buf, data, data_len);
        }
        buf->len += data_len;
        return 1;
    }
    return 0;
}
void ppp_loop_buffer_undo(ppp_loop_buffer_t *buf, size_t n)
{
    if (n)
    {
        if (buf->len > n)
        {
            buf->len -= n;
        }
        else
        {
            buf->len = buf->offset = 0;
        }
    }
}
size_t ppp_loop_buffer_read(ppp_loop_buffer_t *buf, void *data, size_t data_len)
{
    if (data_len)
    {
        data_len = buf->len < data_len ? buf->len : data_len;
        size_t i = buf->offset;
        size_t max = buf->cap - i;
        if (max < data_len)
        {
            memcpy(data, buf->buf + i, max);
            memcpy(data + max, buf->buf, data_len - max);
        }
        else
        {
            memcpy(data, buf->buf + i, data_len);
        }
        if (data_len == buf->len)
        {
            buf->len = buf->offset = 0;
        }
        else
        {
            buf->len -= data_len;
            buf->offset += data_len;
            buf->offset %= buf->cap;
        }
        return data_len;
    }
    return 0;
}
size_t ppp_loop_buffer_copy(ppp_loop_buffer_t *buf, void *data, size_t data_len)
{
    if (data_len)
    {
        data_len = buf->len < data_len ? buf->len : data_len;
        size_t i = buf->offset;
        size_t max = buf->cap - i;
        if (max < data_len)
        {
            memcpy(data, buf->buf + i, max);
            memcpy(data + max, buf->buf, data_len - max);
        }
        else
        {
            memcpy(data, buf->buf + i, data_len);
        }
        return data_len;
    }
    return 0;
}
size_t ppp_loop_buffer_drain(ppp_loop_buffer_t *buf, size_t n)
{
    if (n)
    {
        if (buf->len > n)
        {
            buf->len -= n;
            buf->offset += n;
            buf->offset %= buf->cap;
            return n;
        }
        else
        {
            n = buf->len;
            buf->len = buf->offset = 0;
            return n;
        }
    }
    return 0;
}