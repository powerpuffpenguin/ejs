#ifndef _SYNC_EVCONN_LISTENER_H_
#define _SYNC_EVCONN_LISTENER_H_

#include <event2/util.h>
#include <event2/listener.h>
#include <pthread.h>
#include <sys/socket.h>

evutil_socket_t sync_evconn_create_listen(int domain, int type, int protocol,
                                          const struct sockaddr *, socklen_t socklen,
                                          int backlog);
typedef struct
{
    evutil_socket_t s;
    struct sockaddr_in6 addr;
    int socklen;
} _sync_evconn_listener_cb_args_t;
typedef struct
{
    evutil_socket_t s;
    struct event_base *base;
    void *cb;
    void *error_cb;
    void *userdata;

    pthread_t thread;
    pthread_cond_t cond;
    pthread_mutex_t mutex;

    uint8_t _accept : 1;
    uint8_t _error : 1;
    uint8_t _quit : 1;
    uint8_t _has_conn : 1;
    uint8_t _has_err : 1;
    uint8_t _on_cb : 1;
    uint8_t _delay_free : 1;

    int error;
    _sync_evconn_listener_cb_args_t args;
} sync_evconn_listener_t;

#define SYNC_EVCONN_LISTENER_EV(p) (struct event *)((uint8_t *)(p) + sizeof(sync_evconn_listener_t))
void sync_evconn_listener_free(sync_evconn_listener_t *listener);

typedef void (*sync_evconn_listener_cb)(sync_evconn_listener_t *, evutil_socket_t, struct sockaddr *, int socklen, void *);
typedef void (*sync_evconn_listener_error_cb)(sync_evconn_listener_t *, void *);

sync_evconn_listener_t *sync_evconn_listener_new(struct event_base *base,
                                                 const sync_evconn_listener_cb cb,
                                                 const sync_evconn_listener_error_cb error_cb,
                                                 void *userdata,
                                                 evutil_socket_t s);
void sync_evconn_listener_set_cb(sync_evconn_listener_t *l, const sync_evconn_listener_cb cb);
void sync_evconn_listener_set_error_cb(sync_evconn_listener_t *l, const sync_evconn_listener_error_cb cb);

#endif