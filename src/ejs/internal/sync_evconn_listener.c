#include "sync_evconn_listener.h"
#include <stdlib.h>
#include <pthread.h>
#include <string.h>
evutil_socket_t sync_evconn_create_listen(int domain, int type, int protocol,
                                          const struct sockaddr *sin, socklen_t socklen,
                                          int backlog)
{
    evutil_socket_t s = socket(domain, type, protocol);
    if (s < 0)
    {
        return -1;
    }
    if (bind(s, sin, socklen) < 0)
    {
        evutil_closesocket(s);
        return -1;
    }
    if (listen(s, backlog) < 0)
    {
        evutil_closesocket(s);
        return -1;
    }
    return s;
}
void sync_evconn_listener_free(sync_evconn_listener_t *l)
{
    pthread_mutex_lock(&l->mutex);
    l->_quit = 1;
    shutdown(l->s, SHUT_RDWR);
    evutil_closesocket(l->s);
    pthread_cond_signal(&l->cond);
    pthread_mutex_unlock(&l->mutex);

    pthread_join(l->thread, 0);

    if (l->_on_cb)
    {
        l->_delay_free = 1;
    }
    else
    {
        pthread_mutex_destroy(&l->mutex);
        pthread_cond_destroy(&l->cond);

        event_del(SYNC_EVCONN_LISTENER_EV(l));
        free(l);
    }
}
static int _sync_evconn_listener_wait(sync_evconn_listener_t *l)
{
    pthread_mutex_lock(&l->mutex);
    int quit = 0;
    while (1)
    {
        // quit
        if (l->_quit)
        {
            if (l->_has_conn)
            {
                evutil_closesocket(l->args.s);
                l->_has_conn = 0;
            }
            quit = 1;
            break;
        }

        // wait
        if (l->_accept && !l->_has_conn)
        {
            break;
        }
        pthread_cond_wait(&l->cond, &l->mutex);
    }
    pthread_mutex_unlock(&l->mutex);
    return quit;
}
static void *_sync_evconn_listener_worker(void *arg)
{
    sync_evconn_listener_t *l = arg;
    struct event *ev = SYNC_EVCONN_LISTENER_EV(l);

    while (1)
    {
        if (_sync_evconn_listener_wait(l))
        {
            break;
        }

        // produce
        while (1)
        {
            memset(&l->args.addr, 0, sizeof(l->args.addr));
            l->args.socklen = sizeof(l->args.addr);
            l->args.s = accept(l->s, (struct sockaddr *)&l->args.addr, &l->args.socklen);
            pthread_mutex_lock(&l->mutex);
            if (l->_quit)
            {
                if (l->args.s >= 0)
                {
                    evutil_closesocket(l->args.s);
                }
                return 0;
            }

            if (l->args.s < 0)
            {
                if (l->_error)
                {
                    l->_has_err = 1;
                    l->error = EVUTIL_SOCKET_ERROR();
                }
                else
                {
                    pthread_mutex_unlock(&l->mutex);
                    continue;
                }
            }
            else
            {
                l->_has_conn = 1;
            }
            break;
        }
        event_active(ev, 0, 0);
        pthread_mutex_unlock(&l->mutex);
    }
    return 0;
}
static void _sync_evconn_listener_cb(evutil_socket_t _, short events, void *arg)
{
    if (events)
    {
        return;
    }
    sync_evconn_listener_t *l = arg;
    pthread_mutex_lock(&l->mutex);
    if (l->_has_conn)
    {
        l->_has_conn = 0;
        sync_evconn_listener_cb cb = l->cb;
        if (cb)
        {
            pthread_mutex_unlock(&l->mutex);
            l->_on_cb = 1;
            cb(l, l->args.s, (struct sockaddr *)&l->args.addr, l->args.socklen, l->userdata);
            pthread_mutex_lock(&l->mutex);
            if (l->_delay_free)
            {
                pthread_mutex_destroy(&l->mutex);
                pthread_cond_destroy(&l->cond);

                event_del(SYNC_EVCONN_LISTENER_EV(l));
                free(l);
            }
            else
            {
                pthread_mutex_unlock(&l->mutex);
                l->_on_cb = 0;
                pthread_cond_signal(&l->cond);
            }
            return;
        }
        else
        {
            evutil_closesocket(l->args.s);
        }
    }
    else if (l->_has_err)
    {
        l->_has_err = 0;
        sync_evconn_listener_error_cb cb = l->error_cb;
        if (cb)
        {
            pthread_mutex_unlock(&l->mutex);
            l->_on_cb = 1;
            cb(l, l->userdata);
            pthread_mutex_lock(&l->mutex);
            if (l->_delay_free)
            {
                pthread_mutex_destroy(&l->mutex);
                pthread_cond_destroy(&l->cond);

                event_del(SYNC_EVCONN_LISTENER_EV(l));
                free(l);
            }
            else
            {
                pthread_mutex_unlock(&l->mutex);
                l->_on_cb = 0;
                pthread_cond_signal(&l->cond);
            }
            return;
        }
    }
    pthread_mutex_unlock(&l->mutex);
    pthread_cond_signal(&l->cond);
}
sync_evconn_listener_t *sync_evconn_listener_new(struct event_base *base,
                                                 const sync_evconn_listener_cb cb,
                                                 const sync_evconn_listener_error_cb error_cb,
                                                 void *userdata,
                                                 evutil_socket_t s)
{
    sync_evconn_listener_t *l = malloc(sizeof(sync_evconn_listener_t) + event_get_struct_event_size());
    if (!l)
    {
        return 0;
    }
    memset(l, 0, sizeof(sync_evconn_listener_t));
    l->base = base;
    l->s = s;
    l->cb = cb;
    l->error_cb = error_cb;
    l->userdata = userdata;
    if (cb)
    {
        l->_accept = 1;
    }
    if (error_cb)
    {
        l->_error = 1;
    }

    if (pthread_mutex_init(&l->mutex, 0))
    {
        free(l);
        return 0;
    }
    if (pthread_cond_init(&l->cond, 0))
    {
        pthread_mutex_destroy(&l->mutex);

        free(l);
        return 0;
    }

    struct event *ev = SYNC_EVCONN_LISTENER_EV(l);
    if (event_assign(ev, base, -1, EV_PERSIST, _sync_evconn_listener_cb, l))
    {
        pthread_mutex_destroy(&l->mutex);
        pthread_cond_destroy(&l->cond);

        free(l);
        return 0;
    }
    struct timeval tv =
        {
            .tv_sec = 3600 * 24 * 365,
            .tv_usec = 0,
        };
    if (event_add(ev, &tv))
    {
        pthread_mutex_destroy(&l->mutex);
        pthread_cond_destroy(&l->cond);

        free(l);
        return 0;
    }

    if (pthread_create(&l->thread, 0, _sync_evconn_listener_worker, l))
    {
        pthread_mutex_destroy(&l->mutex);
        pthread_cond_destroy(&l->cond);

        event_del(ev);
        free(l);
        return 0;
    }

    return l;
}
void sync_evconn_listener_set_cb(sync_evconn_listener_t *l, const sync_evconn_listener_cb cb)
{
    pthread_mutex_lock(&l->mutex);
    if (cb != l->cb)
    {

        if (cb)
        {
            if (!l->_accept)
            {
                l->_accept = 1;
                pthread_cond_signal(&l->cond);
            }
        }
        else
        {
            if (l->_accept)
            {
                l->_accept = 0;
                pthread_cond_signal(&l->cond);
            }
        }
        l->cb = cb;
    }
    pthread_mutex_unlock(&l->mutex);
}
void sync_evconn_listener_set_error_cb(sync_evconn_listener_t *l, const sync_evconn_listener_error_cb cb)
{
    pthread_mutex_lock(&l->mutex);
    if (cb != l->error_cb)
    {

        if (cb)
        {
            if (!l->_error)
            {
                l->_error = 1;
            }
        }
        else
        {
            if (l->_error)
            {
                l->_error = 0;
                l->_has_err = 0;
            }
        }
        l->error_cb = cb;
    }
    pthread_mutex_unlock(&l->mutex);
}
