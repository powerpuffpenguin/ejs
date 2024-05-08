#include "_duk_timer.h"
#include "core.h"
#include "defines.h"
#include "stash.h"
#include "duk.h"
#include "js/timer.h"
static void timer_handler(evutil_socket_t fs, short events, void *arg);
#define _EJS_TIMER_INTERVAL_ 0x1
#define _EJS_TIMER_INTERVAL_0_ 0x2
#define _EJS_TIMER_INTERVAL_DEL_ 0x4

typedef struct
{
    ejs_core_t *core;
    struct event *ev;
    uint8_t flags;
} ejs_timer_t;
static void timer_destroy(ejs_timer_t *timer)
{
    if (timer->ev)
    {
        if (!(timer->flags & _EJS_TIMER_INTERVAL_DEL_))
        {
            event_del(timer->ev);
        }
        free(timer->ev);
    }
    free(timer);
}
static duk_ret_t timer_finalizer(duk_context *ctx)
{
    // puts("timer_finalizer");
    duk_get_prop_lstring(ctx, 0, "p", 1);
    ejs_timer_t *p = duk_get_pointer_default(ctx, -1, NULL);
    if (p)
    {
        timer_destroy(p);
    }
    return 0;
}
typedef struct
{
    ejs_timer_t *timer;
    BOOL interval;
} timer_handler_args_t;

static duk_ret_t timer_handler_impl(duk_context *ctx)
{
    ejs_timer_t *timer = duk_require_pointer(ctx, 0);

    duk_push_heap_stash(ctx);
    if (timer->flags & _EJS_TIMER_INTERVAL_)
    {
        // puts("interval_handler");
        duk_get_prop_lstring(ctx, -1, EJS_STASH_INTERVAL);
    }
    else
    {
        // puts("timeout_handler");
        duk_get_prop_lstring(ctx, -1, EJS_STASH_TIMEOUT);
        timer->flags |= _EJS_TIMER_INTERVAL_DEL_;
    }
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_swap_top(ctx, -2);
    duk_get_prop(ctx, -2);

    duk_get_prop_lstring(ctx, -1, "cb", 2);
    duk_int_t err = duk_pcall(ctx, 0);
    if (err)
    {
        duk_push_pointer(ctx, timer);
        duk_del_prop(ctx, 0);
        duk_throw(ctx);
    }
    if (!(timer->flags & _EJS_TIMER_INTERVAL_))
    {
        duk_put_prop_lstring(ctx, -2, "p", 1);
        timer_destroy(timer);
        duk_push_pointer(ctx, timer);
        duk_del_prop(ctx, 0);
    }
    else if (timer->flags & _EJS_TIMER_INTERVAL_0_)
    {
        struct event *ev = timer->ev;
        timer->ev = NULL;
        struct timeval tv = {
            .tv_sec = 0,
            .tv_usec = 0,
        };
        if (event_assign(ev, timer->core->base, -1, EV_TIMEOUT, timer_handler, timer))
        {
            free(ev);
            ejs_throw_cause(ctx, EJS_ERROR_EVENT_ASSIGN, "event_new timer fail");
        }
        if (event_add(ev, &tv))
        {
            free(ev);
            ejs_throw_cause(ctx, EJS_ERROR_EVENT_ADD, "event_add timer fail");
        }
        timer->ev = ev;
    }
    return 0;
}
static void timer_handler(evutil_socket_t fs, short events, void *arg)
{
    ejs_timer_t *timer = arg;
    duk_context *ctx = timer->core->duk;
    if (ejs_pcall_function(ctx, timer_handler_impl, timer))
    {
        puts(duk_safe_to_string(ctx, -1));
        exit(1);
    }
    else
    {
        duk_pop(ctx);
    }
}

typedef struct
{
    uint8_t flags;
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
    duk_pop(ctx);

    ejs_timer_t *timer = malloc(sizeof(ejs_timer_t));
    if (!timer)
    {
        ejs_throw_os(ctx, errno, strerror(errno));
    }
    timer->core = core;
    timer->flags = args->flags;
    timer->ev = NULL;
    args->timer = timer;
    struct timeval tv = {
        .tv_sec = ms / 1000,
        .tv_usec = ((duk_int_t)(ms * 1000)) % (1000 * 1000),
    };
    short flags = EV_TIMEOUT;
    if (timer->flags & _EJS_TIMER_INTERVAL_)
    {
        if (!tv.tv_sec && !tv.tv_usec)
        {
            timer->flags |= _EJS_TIMER_INTERVAL_0_;
        }
        else
        {
            flags = EV_PERSIST;
        }
    }
    struct event *ev = malloc(event_get_struct_event_size());
    if (!ev)
    {
        ejs_throw_cause(ctx, EJS_ERROR_EVENT_NEW, "event_new timer fail");
    };
    if (event_assign(ev, core->base,
                     -1,
                     flags,
                     timer_handler,
                     timer))
    {
        free(ev);
        ejs_throw_cause(ctx, EJS_ERROR_EVENT_ASSIGN, "event_assign timer fail");
    }
    if (event_add(ev, &tv))
    {
        free(ev);
        ejs_throw_cause(ctx, EJS_ERROR_EVENT_ADD, "event_add timer fail");
    }
    timer->ev = ev;

    duk_push_heap_stash(ctx);
    if (args->flags & _EJS_TIMER_INTERVAL_)
    {
        duk_get_prop_lstring(ctx, -1, EJS_STASH_INTERVAL);
    }
    else
    {
        duk_get_prop_lstring(ctx, -1, EJS_STASH_TIMEOUT);
    }
    duk_swap_top(ctx, -3);
    duk_pop_2(ctx);

    duk_swap_top(ctx, -2);

    duk_push_object(ctx);
    duk_push_pointer(ctx, timer);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_swap_top(ctx, -2);
    duk_put_prop_lstring(ctx, -2, "cb", 2);
    duk_push_c_lightfunc(ctx, timer_finalizer, 1, 1, 0);
    duk_set_finalizer(ctx, -2);
    args->timer = NULL;

    duk_push_pointer(ctx, timer);
    duk_push_pointer(ctx, timer);
    duk_swap_top(ctx, -3);

    duk_put_prop(ctx, -4);

    return 1;
}
static duk_ret_t set_timer(duk_context *ctx, BOOL interval)
{
    /*
     *  Entry stack: [ cb ms ]
     */
    duk_push_c_lightfunc(ctx, set_timer_impl, 3, 3, 0);
    duk_insert(ctx, 0);

    set_timer_args_t args = {
        .timer = NULL,
        .flags = interval ? _EJS_TIMER_INTERVAL_ : 0,
    };
    duk_push_pointer(ctx, &args);
    if (duk_pcall(ctx, 3))
    {
        if (args.timer)
        {
            timer_destroy(args.timer);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t setTimeout(duk_context *ctx)
{
    return set_timer(ctx, FALSE);
}
static duk_ret_t setInterval(duk_context *ctx)
{
    return set_timer(ctx, TRUE);
}
static duk_ret_t clear_timer(duk_context *ctx, BOOL interval)
{
    ejs_timer_t *timer = duk_get_pointer_default(ctx, 0, NULL);
    if (!timer)
    {
        return 0;
    }
    duk_push_heap_stash(ctx);
    if (interval)
    {
        if (!(timer->flags & _EJS_TIMER_INTERVAL_))
        {
            return 0;
        }
        duk_get_prop_lstring(ctx, -1, EJS_STASH_INTERVAL);
    }
    else
    {
        if (timer->flags & _EJS_TIMER_INTERVAL_)
        {
            return 0;
        }
        duk_get_prop_lstring(ctx, -1, EJS_STASH_TIMEOUT);
    }
    duk_swap_top(ctx, -2);
    duk_pop(ctx);
    duk_swap_top(ctx, -2);

    duk_dup_top(ctx);

    duk_get_prop(ctx, -3);
    if (duk_is_undefined(ctx, -1))
    {
        return 0;
    }
    duk_swap_top(ctx, -2);
    duk_del_prop(ctx, -3);

    return 0;
}
static duk_ret_t clearTimeout(duk_context *ctx)
{
    return clear_timer(ctx, FALSE);
}
static duk_ret_t clearInterval(duk_context *ctx)
{
    return clear_timer(ctx, TRUE);
}
void _ejs_init_timer(duk_context *ctx)
{
    // cb
    duk_push_heap_stash(ctx);
    duk_push_object(ctx);
    duk_put_prop_lstring(ctx, -2, EJS_STASH_INTERVAL);
    duk_push_object(ctx);
    duk_put_prop_lstring(ctx, -2, EJS_STASH_TIMEOUT);
    duk_pop(ctx);

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