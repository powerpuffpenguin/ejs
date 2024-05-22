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
    }
    return "unknow";
}

void ppp_thread_pool_free(ppp_thread_pool_t *p)
{
    pthread_mutex_lock(&p->mutex);
    p->closed = 1;
    pthread_mutex_unlock(&p->mutex);
    pthread_cond_broadcast(&p->cv_producer);
    pthread_cond_broadcast(&p->cv_consumer);
    // wait

    // destroy
    pthread_mutex_destroy(&p->mutex);
    pthread_cond_destroy(&p->cv_producer);
    pthread_cond_destroy(&p->cv_consumer);
    free(p);
}
ppp_thread_pool_t *thread_pool_new(ppp_thread_pool_options_t opts)
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

    p->opts = opts;
    if (p->opts.worker_of_idle < 0)
    {
        p->opts.worker_of_idle = 0;
    }
    if (p->opts.worker_of_max < p->opts.worker_of_idle)
    {
        p->opts.worker_of_max = p->opts.worker_of_idle;
    }

    ppp_list_init(&p->worker, PPP_LIST_SIZEOF(ppp_thread_pool_worker));
    for (int i = 0; i < p->opts.worker_of_idle; i++)
    {
    }
    return p;
}
PPP_THREAD_POOL_ERROR _ppp_thread_pool_create_thread(ppp_thread_pool_t *p)
{
    return PPP_THREAD_POOL_ERROR_OK;
}
PPP_THREAD_POOL_ERROR _ppp_thread_pool_post(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata, BOOL async)
{
    if (cb)
    {
        return PPP_THREAD_POOL_ERROR_CB;
    }

    PPP_THREAD_POOL_ERROR err = PPP_THREAD_POOL_ERROR_OK;
    pthread_mutex_lock(&p->mutex);
    while (TRUE)
    {
        if (p->closed)
        {
            err = PPP_THREAD_POOL_ERROR_CLOSED;
            break;
        }
        else if (p->_cb)
        {
            if (p->idle)
            {
                p->_cb = cb;
                p->_userdata = userdata;
                if (p->wait_consumer)
                {
                    pthread_cond_signal(&p->cv_consumer);
                }
            }
            else
            {
                err = _ppp_thread_pool_create_thread(p);
                if (!err)
                {
                    p->_cb = cb;
                    p->_userdata = userdata;
                }
            }
            break;
        }
    }
    pthread_mutex_unlock(&p->mutex);
    return err;
}

PPP_THREAD_POOL_ERROR ppp_thread_pool_post(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata)
{
    if (cb)
    {
        return PPP_THREAD_POOL_ERROR_CB;
    }

    PPP_THREAD_POOL_ERROR err = PPP_THREAD_POOL_ERROR_OK;
    pthread_mutex_lock(&p->mutex);
    while (TRUE)
    {
        if (p->closed)
        {
            err = PPP_THREAD_POOL_ERROR_CLOSED;
            break;
        }
        else if (p->_cb)
        {
            if (p->idle)
            {
                p->_cb = cb;
                p->_userdata = userdata;
                if (p->wait_consumer)
                {
                    pthread_cond_signal(&p->cv_consumer);
                }
            }
            else
            {
                err = _ppp_thread_pool_create_thread(p);
                if (!err)
                {
                    p->_cb = cb;
                    p->_userdata = userdata;
                }
            }
            break;
        }
    }
    pthread_mutex_unlock(&p->mutex);
    return err;
}
PPP_THREAD_POOL_ERROR ppp_thread_pool_send(ppp_thread_pool_t *p, ppp_thread_pool_task_function_t cb, void *userdata)
{
    return _ppp_thread_pool_post(p, cb, userdata, FALSE);
}
