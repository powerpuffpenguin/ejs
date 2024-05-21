#include "thread_pool.h"
#include <string.h>
#include <stdlib.h>

typedef struct
{

} worker_t;

void thread_pool_free(thread_pool_t *p)
{
    free(p);
}
thread_pool_t *thread_pool_new(thread_pool_options_t opts)
{
    thread_pool_t *pool = malloc(sizeof(thread_pool_t));
    if (!pool)
    {
        return 0;
    }
    pool->opts = opts;
    ppp_list_init(&pool->idle, PPP_LIST_SIZEOF(thread_pool_worker));
    

    return pool;
}