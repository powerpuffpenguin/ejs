#ifndef _PPP_THREAD_POOL_H_
#define _PPP_THREAD_POOL_H_

#include <pthread.h>
#include <stdint.h>
#include "list.h"
#include "queue.h"

#define PPP_THREAD_POOL_ERROR uint8_t
#define PPP_THREAD_POOL_ERROR_OK 0
#define PPP_THREAD_POOL_ERROR_CLOSED 1
#define PPP_THREAD_POOL_ERROR_OS 2
#define PPP_THREAD_POOL_ERROR_BUSY 3
#define PPP_THREAD_POOL_ERROR_CB 4
#define PPP_THREAD_POOL_ERROR_NEW_THREAD 5

const char *ppp_thread_pool_error(const PPP_THREAD_POOL_ERROR err);

typedef struct
{
    int worker_of_idle;
    int worker_of_max;
} ppp_thread_pool_options_t;

typedef void (*ppp_thread_pool_task_function_t)(void *userdata);

typedef struct
{
    int worker_of_idle;
    int worker_of_max;

    ppp_list_t worker;
    pthread_mutex_t mutex;
    pthread_cond_t cv_producer;
    pthread_cond_t cv_consumer;
    size_t wait_producer;
    size_t wait_consumer;
    size_t idle;

    pthread_cond_t cv_wait;
    size_t wait;

    uint8_t closed : 1;

    ppp_thread_pool_task_function_t cb;
    void *userdata;
} ppp_thread_pool_t;

typedef struct
{
    pthread_t thread;
    ppp_thread_pool_t *pool;
    ppp_thread_pool_task_function_t cb;
    void *userdata;
} ppp_thread_pool_worker_t;

PPP_LIST_DEFINE(ppp_thread_pool_worker, ppp_thread_pool_worker_t value);

ppp_thread_pool_t *ppp_thread_pool_new(ppp_thread_pool_options_t *opts);
void ppp_thread_pool_close(ppp_thread_pool_t *p);
void ppp_thread_pool_wait(ppp_thread_pool_t *p);
void ppp_thread_pool_free(ppp_thread_pool_t *p);

PPP_THREAD_POOL_ERROR ppp_thread_pool_post(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata);
PPP_THREAD_POOL_ERROR ppp_thread_pool_send(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata);

#endif