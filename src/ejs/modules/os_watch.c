#include "modules_shared.h"
#include "../core.h"

#ifdef EJS_OS_WINDOWS
#else
#include <event2/event.h>
#include <event2/bufferevent.h>

#include "../js/os_watch.h"
#include <stdio.h>
#include <stdlib.h>
#include <errno.h>
#include <unistd.h>
#include <sys/inotify.h>
#include <limits.h>
#include <fcntl.h>

#define EVENT_SIZE (sizeof(struct inotify_event))
#define BUF_LEN (1024 * (EVENT_SIZE + NAME_MAX + 1))

typedef struct
{
    int fd;
} watch_sync_args_t;
static duk_ret_t watch_sync_impl(duk_context *ctx)
{
    watch_sync_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    const char *name = duk_require_string(ctx, 0);
    uint32_t mask = duk_require_number(ctx, 1);
    args->fd = inotify_init();
    if (EJS_IS_INVALID_FD(args->fd))
    {
        ejs_throw_os_errno(ctx);
    }
    int wd = inotify_add_watch(args->fd, name, mask);
    if (EJS_IS_INVALID_FD(wd))
    {
        ejs_throw_os_errno(ctx);
    }

    char buffer[BUF_LEN];
    ssize_t length;
    int i;
    while (1)
    {
        length = read(args->fd, buffer, BUF_LEN);
        if (length < 0)
        {
            ejs_throw_os_errno(ctx);
        }

        i = 0;
        while (i < length)
        {
            struct inotify_event *event = (struct inotify_event *)&buffer[i];
            if (event->len)
            {
                duk_dup_top(ctx);
                duk_push_object(ctx);
                duk_push_number(ctx, event->mask);
                duk_put_prop_lstring(ctx, -2, "mask", 4);
                duk_push_string(ctx, event->name);
                duk_put_prop_lstring(ctx, -2, "name", 4);
                duk_call(ctx, 1);
                if (duk_require_boolean(ctx, -1))
                {
                    return 0;
                }
                duk_pop(ctx);
            }

            i += EVENT_SIZE + event->len;
        }
    }
    return 0;
}
static duk_ret_t watch_sync(duk_context *ctx)
{
    watch_sync_args_t args = {
        .fd = -1,
    };
    int err = ejs_pcall_function_n(ctx, watch_sync_impl, &args, 4);
    if (EJS_IS_VALID_FD(args.fd))
    {
        close(args.fd);
    }
    if (err)
    {
        duk_throw(ctx);
    }
    return 0;
}
typedef struct
{
    int fd;
    struct event *ev;
    ejs_core_t *core;
} watch_t;
static duk_ret_t watch_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    watch_t *p = duk_require_pointer(ctx, -1);
    if (p)
    {
        if (p->ev)
        {
            event_del(p->ev);
            event_free(p->ev);
        }
        if (EJS_IS_VALID_FD(p->fd))
        {
            close(p->fd);
        }
        free(p);
    }
    return 0;
}
static duk_ret_t inotify_callback_impl(duk_context *ctx)
{
    watch_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    duk_bool_t ok = ejs_stash_get_pointer(ctx, args, EJS_STASH_WATCH);

    char buffer[BUF_LEN];
    ssize_t length;
    int i = 0;

    length = read(args->fd, buffer, BUF_LEN);
    if (length <= 0)
    {
        return 0;
    }
    while (i < length)
    {
        struct inotify_event *event = (struct inotify_event *)&buffer[i];
        if (event->len && ok)
        {
            duk_get_prop_lstring(ctx, -1, "cb", 2);
            if (duk_is_function(ctx, -1))
            {
                duk_push_object(ctx);
                duk_push_number(ctx, event->mask);
                duk_put_prop_lstring(ctx, -2, "mask", 4);
                duk_push_string(ctx, event->name);
                duk_put_prop_lstring(ctx, -2, "name", 4);
                duk_call(ctx, 1);
                switch (duk_require_int(ctx, -1))
                {
                case 0:
                    duk_pop(ctx);
                    break;
                case 1:
                    close(args->fd);
                    args->fd = -1;
                    event_del(args->ev);
                    event_free(args->ev);
                    args->ev = 0;

                    duk_pop(ctx);
                    ejs_stash_delete_pointer(ctx, 1, EJS_STASH_WATCH);
                    free(args);
                    return 0;
                default:
                    return 0;
                }
            }
            else
            {
                duk_pop(ctx);
            }
        }
        i += EVENT_SIZE + event->len;
    }
    return 0;
}
static void inotify_callback(evutil_socket_t fd, short events, void *args)
{
    ejs_call_callback_noresult(((watch_t *)args)->core->duk, inotify_callback_impl, args, NULL);
}
typedef struct
{
    int fd;
} watch_args_t;

static duk_ret_t watch_impl(duk_context *ctx)
{
    watch_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    const char *name = duk_require_string(ctx, 0);
    uint32_t mask = duk_require_number(ctx, 1);
    args->fd = inotify_init();
    if (EJS_IS_INVALID_FD(args->fd))
    {
        ejs_throw_os_errno(ctx);
    }
    if (fcntl(args->fd, F_SETFL, O_NONBLOCK) == -1)
    {
        ejs_throw_os_errno(ctx);
    }
    int wd = inotify_add_watch(args->fd, name, mask);
    if (EJS_IS_INVALID_FD(wd))
    {
        ejs_throw_os_errno(ctx);
    }
    ejs_core_t *core = ejs_require_core(ctx);

    watch_t *p = ejs_push_finalizer_object(ctx, sizeof(watch_t), watch_finalizer);
    p->fd = args->fd;
    args->fd = -1;
    p->core = core;
    duk_swap_top(ctx, -2);
    duk_put_prop_lstring(ctx, -2, "cb", 2);

    struct event *ev = event_new(core->base, p->fd, EV_READ | EV_PERSIST, inotify_callback, p);
    if (!ev)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "event_new for watch failed");
        duk_throw(ctx);
    }
    if (event_add(ev, 0))
    {
        event_free(ev);
        duk_push_error_object(ctx, DUK_ERR_ERROR, "event_add for watch failed");
        duk_throw(ctx);
    }
    p->ev = ev;

    ejs_stash_put_pointer(ctx, EJS_STASH_WATCH);
    return 1;
}
static duk_ret_t watch(duk_context *ctx)
{
    watch_args_t args = {
        .fd = -1,
    };
    if (ejs_pcall_function_n(ctx, watch_impl, &args, 4))
    {
        if (EJS_IS_VALID_FD(args.fd))
        {
            close(args.fd);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t watch_close(duk_context *ctx)
{
    watch_t *p = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_WATCH);
    if (p)
    {
        if (p->ev)
        {
            event_del(p->ev);
            event_free(p->ev);
        }
        if (EJS_IS_VALID_FD(p->fd))
        {
            close(p->fd);
        }
        free(p);
    }
    return 0;
}
EJS_SHARED_MODULE__DECLARE(os_watch)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_os_watch_min_js, js_ejs_js_os_watch_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, watch_sync, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "watch_sync", 10);

        duk_push_c_lightfunc(ctx, watch, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "watch", 5);

        duk_push_c_lightfunc(ctx, watch_close, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "watch_close", 11);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);

    duk_push_number(ctx, IN_ACCESS);
    duk_put_prop_lstring(ctx, -2, "IN_ACCESS", 9);
    duk_push_number(ctx, IN_MODIFY);
    duk_put_prop_lstring(ctx, -2, "IN_MODIFY", 9);
    duk_push_number(ctx, IN_ATTRIB);
    duk_put_prop_lstring(ctx, -2, "IN_ATTRIB", 9);
    duk_push_number(ctx, IN_OPEN);
    duk_put_prop_lstring(ctx, -2, "IN_OPEN", 7);
    duk_push_number(ctx, IN_CLOSE_WRITE);
    duk_put_prop_lstring(ctx, -2, "IN_CLOSE_WRITE", 14);
    duk_push_number(ctx, IN_CLOSE_NOWRITE);
    duk_put_prop_lstring(ctx, -2, "IN_CLOSE_NOWRITE", 16);
    duk_push_number(ctx, IN_CREATE);
    duk_put_prop_lstring(ctx, -2, "IN_CREATE", 9);
    duk_push_number(ctx, IN_DELETE);
    duk_put_prop_lstring(ctx, -2, "IN_DELETE", 9);
    duk_push_number(ctx, IN_DELETE_SELF);
    duk_put_prop_lstring(ctx, -2, "IN_DELETE_SELF", 14);
    duk_push_number(ctx, IN_MOVE_SELF);
    duk_put_prop_lstring(ctx, -2, "IN_MOVE_SELF", 12);
    duk_push_number(ctx, IN_MOVED_FROM);
    duk_put_prop_lstring(ctx, -2, "IN_MOVED_FROM", 13);
    duk_push_number(ctx, IN_MOVED_TO);
    duk_put_prop_lstring(ctx, -2, "IN_MOVED_TO", 11);

    duk_push_number(ctx, IN_CLOSE);
    duk_put_prop_lstring(ctx, -2, "IN_CLOSE", 8);
    duk_push_number(ctx, IN_MOVE);
    duk_put_prop_lstring(ctx, -2, "IN_MOVE", 7);
    duk_push_number(ctx, IN_ALL_EVENTS);
    duk_put_prop_lstring(ctx, -2, "IN_ALL_EVENTS", 13);

    duk_push_number(ctx, IN_DONT_FOLLOW);
    duk_put_prop_lstring(ctx, -2, "IN_DONT_FOLLOW", 14);
    duk_push_number(ctx, IN_EXCL_UNLINK);
    duk_put_prop_lstring(ctx, -2, "IN_EXCL_UNLINK", 14);
    duk_push_number(ctx, IN_MASK_ADD);
    duk_put_prop_lstring(ctx, -2, "IN_MASK_ADD", 11);
    duk_push_number(ctx, IN_ONESHOT);
    duk_put_prop_lstring(ctx, -2, "IN_ONESHOT", 10);
    duk_push_number(ctx, IN_ONLYDIR);
    duk_put_prop_lstring(ctx, -2, "IN_ONLYDIR", 10);
    return 0;
}
#endif