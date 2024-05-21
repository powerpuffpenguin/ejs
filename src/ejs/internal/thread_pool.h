#ifndef _THREAD_POOL_H_
#define _THREAD_POOL_H_

#include <pthread.h>
#include <stdint.h>

typedef struct
{
    void *root;
    int len;
} _thread_pool_worker_t;


typedef struct
{
    void *root;
    int len;
} _thread_pool_worker_list_t;


typedef struct
{
    int worker_of_idle;
    int worker_of_max;
} thread_pool_options_t;

typedef struct
{
    thread_pool_options_t opts;
    _thread_pool_worker_list_t list;

} thread_pool_t;

thread_pool_t *thread_pool_new(thread_pool_options_t opts);
void thread_pool_free(thread_pool_t *p);
#endif