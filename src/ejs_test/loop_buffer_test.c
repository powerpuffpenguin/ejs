#include "loop_buffer_test.h"
#include "../ejs/internal/loop_buffer.h"
#include <string.h>
static void checkQueue(CuTest *t, ppp_loop_buffer_t *q, size_t capacity, int len, ...)
{
    CuAssertIntEquals(t, len, q->len);
    if (q->len != len)
    {
        return;
    }
    CuAssertIntEquals(t, capacity, q->cap);
    if (q->cap != capacity)
    {
        return;
    }

    va_list ap;
    va_start(ap, len);
    for (int i = 0; i < len; i++)
    {
        int ex = va_arg(ap, int);
        CuAssertIntEquals(t, ex, PPP_LOOP_BUFFER_AT(q, i));
    }
    va_end(ap);
}
static int ppp_queue_push_back(ppp_loop_buffer_t *q, uint8_t v)
{
    char c = v;
    return ppp_loop_buffer_write(q, &c, 1);
}
static uint8_t ppp_queue_pop_front(ppp_loop_buffer_t *q)
{
    uint8_t c;
    return ppp_loop_buffer_read(q, &c, 1) ? c : 0;
}
static uint8_t ppp_queue_front(ppp_loop_buffer_t *q)
{
    uint8_t c;
    return ppp_loop_buffer_copy(q, &c, 1) ? c : 0;
}

static EJS_TESTS_GROUP_FUNC(loop_buffer, basic, t)
{
    uint8_t array[6];
    size_t capacity = sizeof(array) / sizeof(uint8_t);
    array[capacity--] = 0;

    ppp_loop_buffer_t q = {
        .buf = array,
        .cap = capacity,
        .len = 0,
        .offset = 0,
    };
    checkQueue(t, &q, capacity, 0);

    ppp_queue_push_back(&q, 3);
    checkQueue(t, &q, capacity, 1, 3);
    ppp_queue_push_back(&q, 4);
    checkQueue(t, &q, capacity, 2, 3, 4);
    ppp_queue_push_back(&q, 5);
    checkQueue(t, &q, capacity, 3, 3, 4, 5);

    ppp_loop_buffer_drain(&q, 1);
    checkQueue(t, &q, capacity, 2, 4, 5);
    ppp_loop_buffer_write(&q, "abcd", 4);
    checkQueue(t, &q, capacity, 2, 4, 5);

    CuAssertIntEquals(t, 1, ppp_loop_buffer_write(&q, "abc", 3));
    checkQueue(t, &q, capacity, 5, 4, 5, 'a', 'b', 'c');
    CuAssertIntEquals(t, 0, ppp_queue_push_back(&q, 5));
    checkQueue(t, &q, capacity, 5, 4, 5, 'a', 'b', 'c');

    CuAssertIntEquals(t, 4, ppp_queue_front(&q));
    checkQueue(t, &q, capacity, 5, 4, 5, 'a', 'b', 'c');
    CuAssertIntEquals(t, 4, ppp_queue_pop_front(&q));
    checkQueue(t, &q, capacity, 4, 5, 'a', 'b', 'c');

    CuAssertIntEquals(t, 5, ppp_queue_front(&q));
    checkQueue(t, &q, capacity, 4, 5, 'a', 'b', 'c');
    CuAssertIntEquals(t, 5, ppp_queue_pop_front(&q));
    checkQueue(t, &q, capacity, 3, 'a', 'b', 'c');
}
EJS_TESTS_GROUP(suite, loop_buffer)
{
    EJS_TESTS_GROUP_ADD_FUNC(suite, loop_buffer, basic);
}