#include "_duk_timer.h"
#include "core.h"
#include "defines.h"
#include "stash.h"
#include "duk.h"
#include "js/timer.h"
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

static duk_ret_t timeout_handler_impl(duk_context *ctx)
{
    ejs_timer_t *timer = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    ejs_stash_get_pointer(ctx, timer, EJS_STASH_TIMEOUT);
    duk_get_prop_lstring(ctx, -1, "cb", 2);
    duk_call(ctx, 0);
    return 0;
}
static void timeout_handler(evutil_socket_t fs, short events, void *arg)
{
    ejs_timer_t *timer = arg;
    if (!timer->interval)
    {
        timer->added = 0;
    }
    ejs_call_callback_noresult(timer->core->duk, timeout_handler_impl, timer, NULL);
}

static duk_ret_t immediate_handler_impl(duk_context *ctx)
{
    // ejs_timer_t *timer = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_IMMEDIATE);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, -1, "cb", 2);
    duk_call(ctx, 0);
    return 0;
}
static void immediate_handler(evutil_socket_t _, short events, void *arg)
{
    if (events)
    {
        return;
    }
    ejs_timer_t *timer = arg;
    ejs_call_callback_noresult(timer->core->duk, immediate_handler_impl, timer, NULL);
}
typedef struct
{
    ejs_timer_t *timer;
} create_immediate_args_t;
static duk_ret_t create_immediate_impl(duk_context *ctx)
{
    create_immediate_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    ejs_core_t *core = ejs_require_core(ctx);

    ejs_timer_t *timer = malloc(sizeof(ejs_timer_t) + event_get_struct_event_size());
    if (!timer)
    {
        ejs_throw_os(ctx, errno, strerror(errno));
    }
    timer->core = core;
    timer->interval = 0;
    timer->added = 0;
    args->timer = timer;

    struct event *ev = _EJS_TIMER_EV_PTR(timer);
    if (event_assign(ev, core->base,
                     -1,
                     EV_PERSIST,
                     immediate_handler,
                     timer))
    {
        free(timer);
        args->timer = NULL;
        ejs_throw_cause(ctx, EJS_ERROR_EVENT_ASSIGN, "event_assign immediate fail");
    }
    if (event_add(ev, 0))
    {
        free(timer);
        args->timer = NULL;
        ejs_throw_cause(ctx, EJS_ERROR_EVENT_ADD, "event_add immediate fail");
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

    duk_push_heap_stash(ctx);
    duk_dup(ctx, -2);
    duk_put_prop_lstring(ctx, -2, EJS_STASH_IMMEDIATE);
    duk_pop(ctx);
    return 1;
}
static duk_ret_t create_immediate(duk_context *ctx)
{
    create_immediate_args_t args = {0};
    if (ejs_pcall_function_n(ctx, create_immediate_impl, &args, 2))
    {
        if (args.timer)
        {
            timer_destroy(args.timer);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t signal_immediate(duk_context *ctx)
{
    timer_t *p = duk_require_pointer(ctx, 0);
    event_active(_EJS_TIMER_EV_PTR(p), 0, 0);
    return 0;
}

typedef struct
{
    ejs_timer_t *timer;
} timeout_args_t;
static duk_ret_t timeout_impl(duk_context *ctx)
{
    timeout_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "interval", 8);
    duk_bool_t interval = EJS_BOOL_VALUE(ctx, -1);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, 0, "ms", 2);
    duk_double_t ms = duk_require_number(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "cb", 2);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    ejs_core_t *core = ejs_require_core(ctx);

    ejs_timer_t *timer = malloc(sizeof(ejs_timer_t) + event_get_struct_event_size());
    if (!timer)
    {
        ejs_throw_os_errno(ctx);
    }
    timer->core = core;
    timer->interval = interval ? 1 : 0;
    timer->added = 0;

    args->timer = timer;
    struct timeval tv = {
        .tv_sec = ms / 1000,
        .tv_usec = ((duk_int_t)(ms * 1000)) % (1000 * 1000),
    };
    struct event *ev = _EJS_TIMER_EV_PTR(timer);
    if (event_assign(ev, core->base,
                     -1,
                     interval ? EV_PERSIST : EV_TIMEOUT,
                     timeout_handler,
                     timer))
    {
        free(timer);
        args->timer = NULL;
        ejs_throw_cause(ctx, EJS_ERROR_EVENT_ASSIGN, "event_assign timeout fail");
    }
    if (event_add(ev, &tv))
    {
        free(timer);
        args->timer = NULL;
        ejs_throw_cause(ctx, EJS_ERROR_EVENT_ADD, "event_add timeout fail");
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

    ejs_stash_put_pointer(ctx, EJS_STASH_TIMEOUT);
    return 1;
}
static duk_ret_t timeout(duk_context *ctx)
{
    timeout_args_t args = {0};
    if (ejs_pcall_function_n(ctx, timeout_impl, &args, 2))
    {
        if (args.timer)
        {
            timer_destroy(args.timer);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t timeout_clear(duk_context *ctx)
{
    ejs_timer_t *timer = ejs_stash_delete_pointer(ctx, 1, EJS_STASH_TIMEOUT);
    if (timer)
    {
        timer_destroy(timer);
    }
    return 0;
}
void _ejs_init_timer(duk_context *ctx)
{
    duk_eval_lstring(ctx, js_ejs_js_timer_min_js, js_ejs_js_timer_min_js_len);

    duk_push_global_object(ctx);
    duk_get_prop_lstring(ctx, -3, EJS_STASH_EJS);
    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, create_immediate, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "create", 6);
        duk_push_c_lightfunc(ctx, signal_immediate, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "signal", 6);

        duk_push_c_lightfunc(ctx, timeout, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "timeout", 7);
        duk_push_c_lightfunc(ctx, timeout_clear, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "clear", 5);
    }
    duk_call(ctx, 3);
    duk_pop(ctx);
}
void _ejs_destroy_timer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, EJS_STASH_IMMEDIATE);
    if (duk_is_undefined(ctx, -1))
    {
        duk_pop(ctx);
    }
    else
    {
        duk_get_prop_lstring(ctx, -1, "p", 1);
        ejs_timer_t *timer = duk_require_pointer(ctx, -1);
        duk_set_finalizer(ctx, -2);
        timer_destroy(timer);
        duk_pop_2(ctx);
    }
}