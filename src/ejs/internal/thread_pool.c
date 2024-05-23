#include "thread_pool.h"
#include <string.h>
#include <stdlib.h>

const char *ppp_thread_pool_error(const PPP_THREAD_POOL_ERROR err)
{
    switch (err)
    {
    case PPP_THREAD_POOL_ERROR_OK:
        return "ok";
    case PPP_THREAD_POOL_ERROR_CLOSED:
        return "already closed";
    case PPP_THREAD_POOL_ERROR_OS:
        return "os api error";
    case PPP_THREAD_POOL_ERROR_BUSY:
        return "busy";
    case PPP_THREAD_POOL_ERROR_CB:
        return "cb NULL";
    case PPP_THREAD_POOL_ERROR_NEW_THREAD:
        return "create new thread fail";
    }
    return "unknow";
}
void ppp_thread_pool_close(ppp_thread_pool_t *p)
{
    pthread_mutex_lock(&p->mutex);
    if (!p->closed)
    {
        p->closed = 1;

        if (p->wait_producer)
        {
            pthread_cond_broadcast(&p->cv_producer);
        }
        if (p->wait_consumer)
        {
            pthread_cond_broadcast(&p->cv_consumer);
        }
    }
    pthread_mutex_unlock(&p->mutex);
}
void ppp_thread_pool_wait(ppp_thread_pool_t *p)
{
    pthread_mutex_lock(&p->mutex);
    while (ppp_list_len(&p->worker))
    {
        ++p->wait;
        pthread_cond_wait(&p->cv_wait, &p->mutex);
        --p->wait;
    }
    pthread_mutex_unlock(&p->mutex);
}
void ppp_thread_pool_free(ppp_thread_pool_t *p)
{
    ppp_thread_pool_close(p);
    ppp_thread_pool_wait(p);

    // destroy
    pthread_mutex_destroy(&p->mutex);
    pthread_cond_destroy(&p->cv_producer);
    pthread_cond_destroy(&p->cv_consumer);
    pthread_cond_destroy(&p->cv_wait);
    free(p);
}
static void *_thread_pool_worker_quit(ppp_thread_pool_t *pool, ppp_list_element_t *element)
{
    ppp_list_remove(&pool->worker, element, TRUE);
    if (!ppp_list_len(&pool->worker))
    {
        if (pool->wait)
        {
            pthread_cond_signal(&pool->cv_wait);
        }
    }
}
static void *_thread_pool_worker(void *arg)
{
    ppp_list_element_t *element = arg;
    ppp_thread_pool_worker_t *worker = &PPP_LIST_CAST_VALUE(ppp_thread_pool_worker, element);
    worker->cb(worker->userdata);

    pthread_mutex_lock(&worker->pool->mutex);
    if (!(!worker->pool->wait_producer &&
          worker->pool->worker_of_idle &&
          worker->pool->idle >= worker->pool->worker_of_idle))
    {
        ++worker->pool->idle;
        while (TRUE)
        {
            if (!worker->pool->cb)
            {
                if (worker->pool->closed)
                {
                    break;
                }
                ++worker->pool->wait_consumer;
                pthread_cond_wait(&worker->pool->cv_consumer, &worker->pool->mutex);
                --worker->pool->wait_consumer;
                continue;
            }
            worker->cb = worker->pool->cb;
            worker->userdata = worker->pool->userdata;

            worker->pool->cb = 0;
            worker->pool->userdata = 0;

            --worker->pool->idle;
            if (worker->pool->wait_producer)
            {
                pthread_cond_signal(&worker->pool->cv_producer);
            }
            pthread_mutex_unlock(&worker->pool->mutex);

            worker->cb(worker->userdata);
            pthread_mutex_lock(&worker->pool->mutex);
            if (!worker->pool->wait_producer &&
                worker->pool->worker_of_idle &&
                worker->pool->idle >= worker->pool->worker_of_idle)
            {
                break;
            }
            ++worker->pool->idle;
        }
    }
    _thread_pool_worker_quit(worker->pool, element);
    pthread_mutex_unlock(&worker->pool->mutex);
    return 0;
}

ppp_list_element_t *_ppp_thread_pool_create_thread(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata)
{
    ppp_list_element_t *e = ppp_list_push_back(&p->worker);
    if (!e)
    {
        return 0;
    }

    ppp_thread_pool_worker_t *value = &PPP_LIST_CAST_VALUE(ppp_thread_pool_worker, e);
    value->pool = p;
    value->cb = cb;
    value->userdata = userdata;

    if (pthread_create(&value->thread, 0, _thread_pool_worker, e))
    {
        ppp_list_remove(&p->worker, e, TRUE);
        return 0;
    }
    return e;
}
ppp_thread_pool_t *ppp_thread_pool_new(ppp_thread_pool_options_t *opts)
{
    ppp_thread_pool_t *p = malloc(sizeof(ppp_thread_pool_t));
    if (!p)
    {
        return 0;
    }
    memset(p, 0, sizeof(ppp_thread_pool_t));

    if (pthread_mutex_init(&p->mutex, 0))
    {
        free(p);
        return 0;
    }
    if (pthread_cond_init(&p->cv_producer, 0))
    {
        pthread_mutex_destroy(&p->mutex);
        free(p);
        return 0;
    }
    if (pthread_cond_init(&p->cv_consumer, 0))
    {
        pthread_mutex_destroy(&p->mutex);
        pthread_cond_destroy(&p->cv_producer);
        free(p);
        return 0;
    }
    if (pthread_cond_init(&p->cv_wait, 0))
    {
        pthread_mutex_destroy(&p->mutex);
        pthread_cond_destroy(&p->cv_producer);
        pthread_cond_destroy(&p->cv_consumer);
        free(p);
        return 0;
    }
    if (opts)
    {
        p->worker_of_idle = opts->worker_of_idle < 1 ? 8 : opts->worker_of_idle;
        if (p->worker_of_max > 0 && p->worker_of_max < p->worker_of_idle)
        {
            p->worker_of_max = p->worker_of_idle;
        }
    }
    else
    {
        p->worker_of_idle = 8;
    }
    ppp_list_init(&p->worker, PPP_LIST_SIZEOF(ppp_thread_pool_worker));
    return p;
}
PPP_THREAD_POOL_ERROR _ppp_thread_pool_post_or_send(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata, BOOL post)
{
    pthread_mutex_lock(&p->mutex);
    while (TRUE)
    {
        if (p->closed)
        {
            pthread_mutex_unlock(&p->mutex);
            return PPP_THREAD_POOL_ERROR_CLOSED;
        }
        else if (!p->idle)
        {
            // no idle thread, create new thread
            if (p->worker_of_max && ppp_list_len(&p->worker) >= p->worker_of_max)
            {
                if (post)
                {
                    pthread_mutex_unlock(&p->mutex);
                    return PPP_THREAD_POOL_ERROR_BUSY;
                }
                else
                {
                    ++p->wait_producer;
                    pthread_cond_wait(&p->cv_producer, &p->mutex);
                    --p->wait_producer;
                    continue;
                }
            }
            if (!_ppp_thread_pool_create_thread(p, cb, userdata))
            {
                pthread_mutex_unlock(&p->mutex);
                return PPP_THREAD_POOL_ERROR_NEW_THREAD;
            }
            break;
        }

        if (p->cb)
        {
            if (p->wait_consumer)
            {
                pthread_cond_signal(&p->cv_consumer);
            }
            ++p->wait_producer;
            pthread_cond_wait(&p->cv_producer, &p->mutex);
            --p->wait_producer;
            continue;
        }

        p->cb = cb;
        p->userdata = userdata;
        if (p->wait_consumer)
        {
            pthread_cond_signal(&p->cv_consumer);
        }
        break;
    }
    pthread_mutex_unlock(&p->mutex);
    return PPP_THREAD_POOL_ERROR_OK;
}

PPP_THREAD_POOL_ERROR ppp_thread_pool_post(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata)
{
    if (!cb)
    {
        return PPP_THREAD_POOL_ERROR_CB;
    }
    return _ppp_thread_pool_post_or_send(p, cb, userdata, TRUE);
}

PPP_THREAD_POOL_ERROR ppp_thread_pool_send(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata)
{
    if (!cb)
    {
        return PPP_THREAD_POOL_ERROR_CB;
    }
    return _ppp_thread_pool_post_or_send(p, cb, userdata, FALSE);
}
