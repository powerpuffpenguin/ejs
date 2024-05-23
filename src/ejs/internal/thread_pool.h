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

#define PPP_THREAD_POOL_ERROR_INIT_MUTEX 20
#define PPP_THREAD_POOL_ERROR_INIT_CV_PRODUCER 21
#define PPP_THREAD_POOL_ERROR_INIT_CV_CONSUMER 22
#define PPP_THREAD_POOL_ERROR_INIT_CV_WAIT 23

/**
 * Convert error code to string
 */
const char *ppp_thread_pool_error(const PPP_THREAD_POOL_ERROR err);

typedef void (*ppp_thread_pool_task_function_t)(void *userdata);

/**
 * Initialization options
 */
typedef struct
{
    /**
     * The maximum number of idle threads allowed, if less than 1 use the default value of 8
     */
    int worker_of_idle;
    /**
     * The maximum number of worker threads allowed, if less than 1, there is no limit.
     * When the upper limit is reached, the post function will return the PPP_THREAD_POOL_ERROR_BUSY error, and the send function will block waiting for an idle thread or the thread pool to close.
     */
    int worker_of_max;
} ppp_thread_pool_options_t;

/**
 * Thread pool definition
 */
typedef struct
{
    ppp_thread_pool_options_t options;

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
/**
 * Worker thread definition, internal use caller does not need to care
 */
typedef struct
{
    pthread_t thread;
    ppp_thread_pool_t *pool;
    ppp_thread_pool_task_function_t cb;
    void *userdata;
} ppp_thread_pool_worker_t;
PPP_LIST_DEFINE(ppp_thread_pool_worker, ppp_thread_pool_worker_t value);

/**
 * Initialize thread pool
 */
PPP_THREAD_POOL_ERROR ppp_thread_pool_init(ppp_thread_pool_t *p, ppp_thread_pool_options_t *opts);
/**
 * Destroy the thread pool after calling ppp_thread_pool_close and ppp_thread_pool_wait
 */
void ppp_thread_pool_destroy(ppp_thread_pool_t *p);

/**
 * ppp_thread_pool_init(malloc(sizeof(ppp_thread_pool_t)), opts)
 */
ppp_thread_pool_t *ppp_thread_pool_new(ppp_thread_pool_options_t *opts);
/**
 * ppp_thread_pool_destroy(p); free(p);
 */
void ppp_thread_pool_free(ppp_thread_pool_t *p);
/**
 * Close the thread pool, after which send/post will return PPP_THREAD_POOL_ERROR_CLOSED
 */
void ppp_thread_pool_close(ppp_thread_pool_t *p);
/**
 * Blocks and waits until the thread pool is closed and all worker threads exit
 */
void ppp_thread_pool_wait(ppp_thread_pool_t *p);

/**
 * Call cb(userdata) in the worker thread.
 * If there are no idle threads, try to create a new thread. If the thread limit is reached, the PPP_THREAD_POOL_ERROR_BUSY error is returned.
 */
PPP_THREAD_POOL_ERROR ppp_thread_pool_post(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata);
/**
 * Call cb(userdata) in the worker thread.
 * If there is no idle thread, try to create a new thread. If the thread limit is reached, block and wait for the thread to be idle.
 */
PPP_THREAD_POOL_ERROR ppp_thread_pool_send(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata);

/**
 * Return to settings
 */
void ppp_thread_pool_get(ppp_thread_pool_t *p, ppp_thread_pool_options_t *opts);
/**
 * Modify settings
 */
void ppp_thread_pool_set(ppp_thread_pool_t *p, ppp_thread_pool_options_t *opts);

#endif