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
    l->flags |= SYNC_EVCONN_LISTENER_QUIT;
    evutil_closesocket(l->s);
    pthread_cond_signal(&l->cond);
    pthread_mutex_unlock(&l->mutex);

    pthread_join(l->thread, 0);

    pthread_mutex_destroy(&l->mutex);
    pthread_cond_destroy(&l->cond);

    event_del(SYNC_EVCONN_LISTENER_EV(l));
    free(l);
}
static void *_sync_evconn_listener_worker(void *arg)
{
    sync_evconn_listener_t *l = arg;
    struct event *ev = SYNC_EVCONN_LISTENER_EV(l);

    while (1)
    {
        pthread_mutex_lock(&l->mutex);
        while (1)
        {
            // quit
            if (l->flags & SYNC_EVCONN_LISTENER_QUIT)
            {
                if (l->flags & SYNC_EVCONN_LISTENER_HAS_CONN)
                {
                    l->flags -= SYNC_EVCONN_LISTENER_HAS_CONN;
                    evutil_closesocket(l->args.s);
                }
                pthread_mutex_unlock(&l->mutex);
                return 0;
            }

            // wait
            if (l->flags & SYNC_EVCONN_LISTENER_ACCEPT &&
                !(l->flags & SYNC_EVCONN_LISTENER_HAS_CONN))
            {
                break;
            }
            pthread_cond_wait(&l->cond, &l->mutex);
        }
        // produce
        while (1)
        {
            l->args.s = accept(l->s, (struct sockaddr *)&l->args.addr, &l->args.socklen);
            if (l->args.s < 0)
            {
                if (l->flags & SYNC_EVCONN_LISTENER_ERROR)
                {
                    l->flags | SYNC_EVCONN_LISTENER_HAS_ERROR;
                    l->error = EVUTIL_SOCKET_ERROR();
                }
                else
                {
                    continue;
                }
            }
            else
            {
                l->flags |= SYNC_EVCONN_LISTENER_HAS_CONN;
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
    if (l->flags & SYNC_EVCONN_LISTENER_HAS_CONN)
    {
        l->flags -= SYNC_EVCONN_LISTENER_HAS_CONN;
        sync_evconn_listener_cb cb = l->cb;
        if (cb)
        {
            cb(l, l->args.s, (struct sockaddr *)&l->args.addr, l->args.socklen, l->userdata);
        }
        else
        {
            evutil_closesocket(l->args.s);
        }
    }
    else if (l->flags & SYNC_EVCONN_LISTENER_HAS_ERROR)
    {
        l->flags -= SYNC_EVCONN_LISTENER_HAS_ERROR;
        sync_evconn_listener_error_cb cb = l->error_cb;
        if (cb)
        {
            cb(l, l->userdata);
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
        l->flags |= SYNC_EVCONN_LISTENER_ACCEPT;
    }
    if (error_cb)
    {
        l->flags |= SYNC_EVCONN_LISTENER_ERROR;
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
            if (!(l->flags & SYNC_EVCONN_LISTENER_ACCEPT))
            {
                l->flags |= SYNC_EVCONN_LISTENER_ACCEPT;
                pthread_cond_signal(&l->cond);
            }
        }
        else
        {
            if (l->flags & SYNC_EVCONN_LISTENER_ACCEPT)
            {
                l->flags -= SYNC_EVCONN_LISTENER_ACCEPT;
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
            if (!(l->flags & SYNC_EVCONN_LISTENER_ERROR))
            {
                l->flags |= SYNC_EVCONN_LISTENER_ERROR;
            }
        }
        else
        {
            if (l->flags & SYNC_EVCONN_LISTENER_ERROR)
            {
                l->flags -= SYNC_EVCONN_LISTENER_ERROR;

                if (l->flags | SYNC_EVCONN_LISTENER_HAS_ERROR)
                {
                    l->flags -= SYNC_EVCONN_LISTENER_HAS_ERROR;
                }
            }
        }
        l->error_cb = cb;
    }
    pthread_mutex_unlock(&l->mutex);
}
