#include "thread_pool_test.h"
#include "../ejs/internal/thread_pool.h"

static void thread_pool_cb(void *userdata)
{
    int *val = userdata;
    *val = (*val) * (*val);
}
static EJS_TESTS_GROUP_FUNC(thread_pool, post, t)
{
    ppp_thread_pool_options_t opts = {
        .worker_of_idle = 0,
        .worker_of_max = 0,
    };
    ppp_thread_pool_t *p = ppp_thread_pool_new(&opts);
    int val[128] = {0};
    size_t count = sizeof(val) / sizeof(int);
    for (size_t i = 0; i < count; i++)
    {
        val[i] = i;
    }
    for (size_t i = 0; i < count; i++)
    {
        CuAssertIntEquals(t, 0, ppp_thread_pool_post(p, thread_pool_cb, &val[i]));
    }
    ppp_thread_pool_free(p);
    for (size_t i = 0; i < count; i++)
    {
        CuAssertIntEquals(t, val[i], i * i);
    }
}
static EJS_TESTS_GROUP_FUNC(thread_pool, send, t)
{
    ppp_thread_pool_options_t opts = {
        .worker_of_idle = 4,
        .worker_of_max = 8,
    };
    ppp_thread_pool_t *p = ppp_thread_pool_new(&opts);
    int val[128] = {0};
    size_t count = sizeof(val) / sizeof(int);
    for (size_t i = 0; i < count; i++)
    {
        val[i] = i;
    }
    for (size_t i = 0; i < count; i++)
    {
        CuAssertIntEquals(t, 0, ppp_thread_pool_send(p, thread_pool_cb, &val[i]));
    }
    ppp_thread_pool_free(p);
    for (size_t i = 0; i < count; i++)
    {
        CuAssertIntEquals(t, val[i], i * i);
    }
}
EJS_TESTS_GROUP(thread_pool)
{
    CuSuite *suite = CuSuiteNew();
    // EJS_TESTS_GROUP_ADD_FUNC(suite, thread_pool, post);
    EJS_TESTS_GROUP_ADD_FUNC(suite, thread_pool, send);
    return suite;
}