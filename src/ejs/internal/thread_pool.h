#ifndef _THREAD_POOL_H_
#define _THREAD_POOL_H_

#include <pthread.h>
#include <stdint.h>
#include "list.h"

typedef struct
{

} _thread_pool_worker_t;

PPP_LIST_DEFINE(thread_pool_worker, _thread_pool_worker_t value);

typedef struct
{
    int worker_of_idle;
    int worker_of_max;
} thread_pool_options_t;

typedef struct
{
    thread_pool_options_t opts;
    ppp_list_t idle;
} thread_pool_t;

thread_pool_t *thread_pool_new(thread_pool_options_t opts);
void thread_pool_free(thread_pool_t *p);
#endif