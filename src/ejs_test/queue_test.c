#include "queue_test.h"
#include "../ejs/internal/queue.h"
#include <stdio.h>

static void checkQueue(CuTest *t, ppp_queue_t *q, size_t capacity, int len, ...)
{
    CuAssertIntEquals(t, len, q->len);
    if (q->len != len)
    {
        return;
    }
    CuAssertIntEquals(t, capacity, q->capacity);
    if (q->capacity != capacity)
    {
        return;
    }

    va_list ap;
    va_start(ap, len);
    for (int i = 0; i < len; i++)
    {
        int ex = va_arg(ap, int);
        CuAssertIntEquals(t, ex, ppp_queue_value(int, q, i));
    }
    va_end(ap);
}

static EJS_TESTS_GROUP_FUNC(queue, basic, t)
{
    ppp_queue_t q;
    int array[5];
    size_t capacity = sizeof(array) / sizeof(int);
    ppp_queue_init(&q, array, capacity);
    checkQueue(t, &q, capacity, 0);

    ppp_queue_push_back(int, &q, 3);
    checkQueue(t, &q, capacity, 1, 3);
    ppp_queue_push_back(int, &q, 4);
    checkQueue(t, &q, capacity, 2, 3, 4);
    ppp_queue_push_back(int, &q, 5);
    checkQueue(t, &q, capacity, 3, 3, 4, 5);
    ppp_queue_push_front(int, &q, 2);
    checkQueue(t, &q, capacity, 4, 2, 3, 4, 5);
    ppp_queue_push_front(int, &q, 1);
    checkQueue(t, &q, capacity, 5, 1, 2, 3, 4, 5);

    ppp_queue_push_front(int, &q, 1);
    ppp_queue_push_back(int, &q, 1);
    checkQueue(t, &q, capacity, 5, 1, 2, 3, 4, 5);

    CuAssertIntEquals(t, 1, ppp_queue_front(int, &q));
    CuAssertIntEquals(t, 1, *ppp_queue_front_pointer(int, &q));
    checkQueue(t, &q, capacity, 5, 1, 2, 3, 4, 5);
    ppp_queue_pop_front(&q);
    checkQueue(t, &q, capacity, 4, 2, 3, 4, 5);

    CuAssertIntEquals(t, 5, ppp_queue_back(int, &q));
    CuAssertIntEquals(t, 5, *ppp_queue_back_pointer(int, &q));
    checkQueue(t, &q, capacity, 4, 2, 3, 4, 5);
    ppp_queue_pop_back(&q);
    checkQueue(t, &q, capacity, 3, 2, 3, 4);

    ppp_queue_push_back(int, &q, 5);
    checkQueue(t, &q, capacity, 4, 2, 3, 4, 5);
    ppp_queue_push_back(int, &q, 6);
    checkQueue(t, &q, capacity, 5, 2, 3, 4, 5, 6);
    CuAssertIntEquals(t, 6, ppp_queue_back(int, &q));
    CuAssertIntEquals(t, 6, *ppp_queue_back_pointer(int, &q));
    checkQueue(t, &q, capacity, 5, 2, 3, 4, 5, 6);
    ppp_queue_pop_back(&q);
    checkQueue(t, &q, capacity, 4, 2, 3, 4, 5);
    CuAssertIntEquals(t, 5, ppp_queue_back(int, &q));
    CuAssertIntEquals(t, 5, *ppp_queue_back_pointer(int, &q));
    checkQueue(t, &q, capacity, 4, 2, 3, 4, 5);
    ppp_queue_pop_back(&q);
    checkQueue(t, &q, capacity, 3, 2, 3, 4);

    ppp_queue_push_front(int, &q, 1);
    checkQueue(t, &q, capacity, 4, 1, 2, 3, 4);
    ppp_queue_push_front(int, &q, 0);
    checkQueue(t, &q, capacity, 5, 0, 1, 2, 3, 4);

    CuAssertIntEquals(t, 0, ppp_queue_front(int, &q));
    CuAssertIntEquals(t, 0, *ppp_queue_front_pointer(int, &q));
    ppp_queue_pop_front(&q);
    checkQueue(t, &q, capacity, 4, 1, 2, 3, 4);
    CuAssertIntEquals(t, 1, ppp_queue_front(int, &q));
    CuAssertIntEquals(t, 1, *ppp_queue_front_pointer(int, &q));
    ppp_queue_pop_front(&q);
    checkQueue(t, &q, capacity, 3, 2, 3, 4);
}
EJS_TESTS_GROUP(suite, queue)
{
    EJS_TESTS_GROUP_ADD_FUNC(suite, queue, basic);
}