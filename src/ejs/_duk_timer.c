#include "_duk_timer.h"
#include "core.h"
#include "defines.h"
#include "stash.h"
#include "duk.h"
#include <event2/event.h>
#include <errno.h>

#define _EJS_TIMER_EV_PTR(p) (struct event *)(((uint8_t *)p) + sizeof(ejs_timer_t))

typedef struct
{
    ejs_core_t *core;
    uint8_t interval : 1;
    uint8_t added : 1;
} ejs_timer_t;
static void timer_destroy(ejs_timer_t *timer)
{
    if (timer->added)
    {
        event_del(_EJS_TIMER_EV_PTR(timer));
    }
    free(timer);
}
static duk_ret_t timer_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, 0, "p", 1);
    ejs_timer_t *p = duk_get_pointer_default(ctx, -1, NULL);
    if (p)
    {
        timer_destroy(p);
    }
    return 0;
}

static duk_ret_t interval_handler_impl(duk_context *ctx)
{
    ejs_timer_t *timer = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    ejs_stash_get_pointer(ctx, timer, EJS_STASH_INTERVAL);
    duk_get_prop_lstring(ctx, -1, "cb", 2);
    duk_call(ctx, 0);
    return 0;
}
static void interval_handler(evutil_socket_t fs, short events, void *arg)
{
    ejs_timer_t *timer = arg;
    ejs_call_callback_noresult(timer->core->duk, interval_handler_impl, timer, NULL);
}
static void timeout_handler(evutil_socket_t fs, short events, void *arg);
static duk_ret_t timeout_handler_impl(duk_context *ctx)
{
    ejs_timer_t *timer = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    if (timer->interval)
    {
        struct event *ev = _EJS_TIMER_EV_PTR(timer);
        struct timeval tv = {
            .tv_sec = 0,
            .tv_usec = 0,
        };
        if (event_assign(ev, timer->core->base, -1, EV_TIMEOUT, timeout_handler, timer))
        {
            free(timer);
            ejs_throw_cause(ctx, EJS_ERROR_EVENT_ASSIGN, "event_assign timer fail");
        }
        if (event_add(ev, &tv))
        {
            free(timer);
            ejs_throw_cause(ctx, EJS_ERROR_EVENT_ADD, "event_add timer fail");
        }
        timer->added = 1;

        ejs_stash_get_pointer(ctx, timer, EJS_STASH_INTERVAL);
        duk_get_prop_lstring(ctx, -1, "cb", 2);
        duk_call(ctx, 0);
    }
    else
    {
        ejs_stash_pop_pointer(ctx, timer, EJS_STASH_TIMEOUT);
        duk_get_prop_lstring(ctx, -1, "cb", 2);
        duk_call(ctx, 0);
        duk_set_finalizer(ctx, -2);
        timer_destroy(timer);
    }
    return 0;
}
static void timeout_handler(evutil_socket_t fs, short events, void *arg)
{
    ejs_timer_t *timer = arg;
    timer->added = 0;
    ejs_call_callback_noresult(timer->core->duk, timeout_handler_impl, timer, NULL);
}
typedef struct
{
    uint8_t interval;
    ejs_timer_t *timer;
} set_timer_args_t;
static duk_ret_t set_timer_impl(duk_context *ctx)
{
    /*
     *  Entry stack: [ cb ms set_timer_args_t ]
     */
    if (!duk_is_callable(ctx, 0))
    {
        ejs_throw_cause(ctx, EJS_ERROR_INVALID_ARGUMENT, "Callback must be a function");
    }
    duk_to_number(ctx, 1);

    duk_double_t ms = 0;
    if (!duk_is_nan(ctx, 1))
    {
        ms = duk_get_number_default(ctx, 1, 0);
    }
    else if (ms < 0)
    {
        ms = 0;
    }

    ejs_core_t *core = ejs_require_core(ctx);
    set_timer_args_t *args = duk_require_pointer(ctx, 2);
    duk_pop_2(ctx);

    // ms
    ejs_timer_t *timer = malloc(sizeof(ejs_timer_t) + event_get_struct_event_size());
    if (!timer)
    {
        ejs_throw_os(ctx, errno, strerror(errno));
    }
    timer->core = core;
    timer->interval = args->interval ? 1 : 0;

    args->timer = timer;
    struct timeval tv = {
        .tv_sec = ms / 1000,
        .tv_usec = ((duk_int_t)(ms * 1000)) % (1000 * 1000),
    };
    short flags = EV_TIMEOUT;
    if (args->interval)
    {
        if (tv.tv_sec || tv.tv_usec)
        {
            flags = EV_PERSIST;
        }
    }
    struct event *ev = _EJS_TIMER_EV_PTR(timer);
    if (event_assign(ev, core->base,
                     -1,
                     flags,
                     flags == EV_PERSIST ? interval_handler : timeout_handler,
                     timer))
    {
        free(timer);
        args->timer = NULL;
        ejs_throw_cause(ctx, EJS_ERROR_EVENT_ASSIGN, "event_assign timer fail");
    }
    if (event_add(ev, &tv))
    {
        free(timer);
        args->timer = NULL;
        ejs_throw_cause(ctx, EJS_ERROR_EVENT_ADD, "event_add timer fail");
    }
    timer->added = 1;

    duk_push_object(ctx);
    duk_push_pointer(ctx, timer);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_swap_top(ctx, -2);
    duk_put_prop_lstring(ctx, -2, "cb", 2);
    duk_push_c_lightfunc(ctx, timer_finalizer, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->timer = NULL;

    if (args->interval)
    {
        ejs_stash_put_pointer(ctx, EJS_STASH_INTERVAL);
    }
    else
    {
        ejs_stash_put_pointer(ctx, EJS_STASH_TIMEOUT);
    }
    return 1;
}

static duk_ret_t setTimeout(duk_context *ctx)
{
    set_timer_args_t args = {
        .timer = NULL,
        .interval = 0,
    };
    if (ejs_pcall_function_n(ctx, set_timer_impl, &args, 3))
    {
        if (args.timer)
        {
            timer_destroy(args.timer);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t setInterval(duk_context *ctx)
{
    set_timer_args_t args = {
        .timer = NULL,
        .interval = 1,
    };
    if (ejs_pcall_function_n(ctx, set_timer_impl, &args, 3))
    {
        if (args.timer)
        {
            timer_destroy(args.timer);
        }
        duk_throw(ctx);
    }
    return 1;
}

static duk_ret_t clearTimeout(duk_context *ctx)
{
    ejs_timer_t *timer = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_TIMEOUT);
    if (timer)
    {
        timer_destroy(timer);
    }
    return 0;
}
static duk_ret_t clearInterval(duk_context *ctx)
{
    ejs_timer_t *timer = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_INTERVAL);
    if (timer)
    {
        timer_destroy(timer);
    }
    return 0;
}
void _ejs_init_timer(duk_context *ctx)
{
    // func
    duk_push_global_object(ctx);

    duk_push_c_lightfunc(ctx, setTimeout, 2, 2, 0);
    duk_put_prop_lstring(ctx, -2, "setTimeout", 10);
    duk_push_c_lightfunc(ctx, setInterval, 2, 2, 0);
    duk_put_prop_lstring(ctx, -2, "setInterval", 11);

    duk_push_c_lightfunc(ctx, clearTimeout, 1, 1, 0);
    duk_put_prop_lstring(ctx, -2, "clearTimeout", 12);
    duk_push_c_lightfunc(ctx, clearInterval, 1, 1, 0);
    duk_put_prop_lstring(ctx, -2, "clearInterval", 13);

    duk_pop(ctx);
}