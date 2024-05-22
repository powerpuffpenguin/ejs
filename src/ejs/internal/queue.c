#include "queue.h"

void ppp_queue_init(ppp_queue_t *q, void *array, size_t capacity)
{
    q->array = array;
    q->capacity = capacity;
    q->len = 0;
    q->offset = 0;
}
BOOL ppp_queue_pop_front(ppp_queue_t *q)
{
    if (ppp_queue_is_empty(q))
    {
        return FALSE;
    }
    q->len--;
    if (++q->offset == q->capacity)
    {
        q->offset = 0;
    }
    return TRUE;
}
BOOL ppp_queue_pop_back(ppp_queue_t *q)
{
    if (ppp_queue_is_empty(q))
    {
        return FALSE;
    }
    q->len--;
    return TRUE;
}