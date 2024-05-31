#include "config.h"
#include "duk.h"
#include "stash.h"
#include "defines.h"
#include "strings.h"
#include "path.h"
#include "core.h"

#include <unistd.h>
#include <event2/event.h>
#include <errno.h>

DUK_EXTERNAL void ejs_dump_context_stdout(duk_context *ctx)
{
    duk_push_context_dump(ctx);
    fprintf(stdout, "%s\n", duk_safe_to_string(ctx, -1));
    duk_pop(ctx);
}
DUK_EXTERNAL void ejs_throw_cause(duk_context *ctx, EJS_ERROR_RET cause, const char *message)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_ERROR);
    duk_push_string(ctx, message ? message : ejs_error(cause));
    duk_push_object(ctx);
    duk_push_int(ctx, cause);
    duk_put_prop_lstring(ctx, -2, "cause", 5);
    duk_new(ctx, 2);
    duk_throw(ctx);
}
DUK_EXTERNAL void ejs_throw_cause_format(duk_context *ctx, EJS_ERROR_RET cause, const char *fmt, ...)
{
    va_list ap;

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_ERROR);

    va_start(ap, fmt);
    duk_push_vsprintf(ctx, fmt, ap);
    va_end(ap);

    duk_push_object(ctx);
    duk_push_int(ctx, cause);
    duk_put_prop_lstring(ctx, -2, "cause", 5);
    duk_new(ctx, 2);
    duk_throw(ctx);
}
DUK_EXTERNAL void ejs_new_os_error(duk_context *ctx, int err, const char *message)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_OS_ERROR);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_int(ctx, err);
    if (message)
    {
        duk_push_string(ctx, message);
    }
    else
    {
        duk_push_string(ctx, strerror(err));
    }
    duk_new(ctx, 2);
}
DUK_EXTERNAL void ejs_throw_os(duk_context *ctx, int err, const char *message)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_OS_ERROR);
    duk_push_int(ctx, err);
    if (message)
    {
        duk_push_string(ctx, message);
    }
    else
    {
        duk_push_string(ctx, strerror(err));
    }
    duk_new(ctx, 2);
    duk_throw(ctx);
}
DUK_EXTERNAL void ejs_throw_os_errno(duk_context *ctx)
{
    int err = errno;
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_OS_ERROR);
    duk_push_int(ctx, err);
    duk_push_string(ctx, strerror(err));
    duk_new(ctx, 2);
    duk_throw(ctx);
}
DUK_EXTERNAL void ejs_throw_os_format(duk_context *ctx, int err, const char *fmt, ...)
{
    va_list ap;

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_OS_ERROR);
    duk_push_int(ctx, err);

    va_start(ap, fmt);
    duk_push_vsprintf(ctx, fmt, ap);
    va_end(ap);

    duk_throw(ctx);
}
DUK_EXTERNAL duk_bool_t ejs_filepath_is_abs(duk_context *ctx, duk_idx_t idx)
{
    size_t len;
    const char *s = duk_require_lstring(ctx, idx, &len);
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    if (len > 1 &&
        s[1] == ':' &&
        (('a' <= s[0] && s[0] <= 'z') ||
         ('A' <= s[0] && s[0] <= 'Z')) &&
        (len == 2 || s[2] == '\\' || s[2] == '/'))
#else
    if (len > 0 && s[0] == '/')
#endif
    {
        return TRUE;
    }
    return FALSE;
}
DUK_EXTERNAL void ejs_call_function(duk_context *ctx, duk_c_function func, void *args, ejs_finally_function finally_func)
{
    duk_push_c_lightfunc(ctx, func, 1, 1, 0);
    duk_push_pointer(ctx, args);
    duk_ret_t err = duk_pcall(ctx, 1);
    if (finally_func)
    {
        finally_func(args);
    }
    if (err)
    {
        duk_throw(ctx);
    }
}
/**
 * * ok  ... -> ...
 * * err  exit(1)
 */
DUK_EXTERNAL void ejs_call_callback(duk_context *ctx,
                                    duk_c_function func, void *args,
                                    ejs_finally_function finally_func)
{
    duk_push_c_lightfunc(ctx, func, 1, 1, 0);
    duk_push_pointer(ctx, args);
    duk_ret_t err = duk_pcall(ctx, 1);
    if (finally_func)
    {
        finally_func(args);
    }
    if (err)
    {
        puts(duk_safe_to_string(ctx, -1));
        exit(1);
    }
}
DUK_EXTERNAL void ejs_call_callback_noresult(duk_context *ctx,
                                             duk_c_function func, void *args,
                                             ejs_finally_function finally_func)
{
    ejs_call_callback(ctx, func, args, finally_func);
    duk_pop(ctx);
}
DUK_EXTERNAL duk_int_t ejs_pcall_function(duk_context *ctx,
                                          duk_c_function func, void *args)
{
    duk_push_c_lightfunc(ctx, func, 1, 1, 0);
    duk_push_pointer(ctx, args);
    return duk_pcall(ctx, 1);
}
DUK_EXTERNAL duk_int_t ejs_pcall_function_n(duk_context *ctx,
                                            duk_c_function func, void *args, duk_idx_t n)
{
    duk_push_c_lightfunc(ctx, func, n, n, 0);
    switch (n)
    {
    case 1:
        break;
    case 2:
        duk_swap_top(ctx, -2);
        break;
    default:
        duk_insert(ctx, -n);
        break;
    }
    duk_push_pointer(ctx, args);
    return duk_pcall(ctx, n);
}
typedef struct
{
    ejs_string_t path_s;
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    ejs_stirng_reference_t path_windows_r0;
    ejs_stirng_reference_t path_windows_r1;
#endif
    ejs_stirng_reference_t out_r;
} ejs_filepath_clean_args_t;
static void ejs_filepath_clean_args_destroy(ejs_filepath_clean_args_t *args)
{
    EJS_STRING_DESTROY(&args->path_s);
}
static duk_ret_t ejs_filepath_clean_impl(duk_context *ctx)
{
    ejs_filepath_clean_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    EJS_ERROR_RET err = ejs_path_from_windows(&args->path_s, &args->path_s, &args->path_windows_r0);
    if (err)
    {
        ejs_throw_cause(ctx, err, NULL);
    }
    char root[2];
    BOOL abs = ejs_path_is_windows_abs(&args->path_s);
    if (abs)
    {
        root[0] = args->path_s.c[0];
        root[1] = args->path_s.c[1];
        args->path_s.c += 2;
        args->path_s.len -= 2;
    }
#else
    EJS_ERROR_RET err;
#endif
    err = ejs_path_clean(&args->path_s, &args->path_s, &args->out_r);
    if (err)
    {
        ejs_throw_cause(ctx, err, NULL);
    }
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    if (abs)
    {
        if (args->path_s.len == 1 && (args->path_s.c[0] == '.' || args->path_s.c[0] == '/'))
        {
            duk_push_lstring(ctx, args->path_s.c - 2, 2);
            return 1;
        }
        err = ejs_path_to_windows(&args->path_s, &args->path_s, &args->path_windows_r1);
        if (err)
        {
            ejs_throw_cause(ctx, err, NULL);
        }

        duk_push_lstring(ctx, root, 2);
        duk_push_lstring(ctx, args->path_s.c, args->path_s.len);
        duk_concat(ctx, 2);
    }
    else
    {
        err = ejs_path_to_windows(&args->path_s, &args->path_s, &args->path_windows_r1);
        if (err)
        {
            ejs_throw_cause(ctx, err, NULL);
        }
        duk_push_lstring(ctx, args->path_s.c, args->path_s.len);
    }
#else
    duk_push_lstring(ctx, args->path_s.c, args->path_s.len);
#endif
    return 1;
}
DUK_EXTERNAL void ejs_filepath_clean(duk_context *ctx, duk_idx_t idx)
{
    EJS_VAR_TYPE(ejs_filepath_clean_args_t, args);
    args.path_s.c = (char *)duk_require_lstring(ctx, idx, &args.path_s.len);
    ejs_call_function(ctx,
                      ejs_filepath_clean_impl, &args,
                      (ejs_finally_function)ejs_filepath_clean_args_destroy);
}

typedef struct
{
    const char *path;
    size_t len;
    ejs_string_t dir_s;
    ejs_stirng_reference_t dir_r;
} ejs_filepath_abs_args_t;
static void ejs_filepath_abs_args_destroy(ejs_filepath_abs_args_t *args)
{
    EJS_STRING_DESTROY(&args->dir_s);
}
static duk_ret_t ejs_filepath_abs_impl(duk_context *ctx)
{
    ejs_filepath_abs_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    char *dir = malloc(MAXPATHLEN);
    if (!dir)
    {
        ejs_throw_os(ctx, errno, strerror(errno));
    }
    args->dir_r.c = dir;
    args->dir_r.len = MAXPATHLEN;
    args->dir_r.used = 1;

    args->dir_s.c = dir;
    args->dir_s.len = 0;
    args->dir_s.reference = &args->dir_r;
    if (!getcwd(dir, MAXPATHLEN))
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_GETCWD, "getcwd error(%d): %s", errno, strerror(errno));
    }
    args->dir_s.len = strlen(dir);
    if (!args->len)
    {
        duk_push_lstring(ctx, args->dir_s.c, args->dir_s.len);
        return 1;
    }

#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    BOOL sp = args->path[0] == '/' ||
              args->path[0] == '\\' ||
              (args->dir_s.len > 0 &&
               (args->dir_s.c[args->dir_s.len - 1] == '/' || args->dir_s.c[args->dir_s.len - 1] == '\\'));
#else
    BOOL sp = args->path[0] == '/' || (args->dir_s.len > 0 && args->dir_s.c[args->dir_s.len - 1] == '/');
#endif
    size_t size = args->dir_s.len + (sp ? 0 : 1) + args->len;
    if (size <= MAXPATHLEN)
    {
        if (sp)
        {
            memmove(dir + args->dir_s.len, args->path, args->len);
            args->dir_s.len += args->len;
        }
        else
        {
            dir[args->dir_s.len] = '/';
            memmove(dir + args->dir_s.len + 1, args->path, args->len);
            args->dir_s.len += args->len + 1;
        }
        duk_push_lstring(ctx, dir, args->dir_s.len);
        EJS_STRING_DESTROY(&args->dir_s);
    }
    else
    {
        if (sp)
        {
            duk_push_lstring(ctx, args->dir_s.c, args->dir_s.len);
            duk_push_lstring(ctx, args->path, args->len);
            duk_concat(ctx, 2);
        }
        else
        {
            duk_push_lstring(ctx, args->dir_s.c, args->dir_s.len);
            duk_push_lstring(ctx, "/", 1);
            duk_push_lstring(ctx, args->path, args->len);
            duk_concat(ctx, 3);
        }
    }

    ejs_filepath_clean(ctx, -1);
    return 1;
}
DUK_EXTERNAL void ejs_filepath_abs(duk_context *ctx, duk_idx_t idx)
{
    if (ejs_filepath_is_abs(ctx, idx))
    {
        ejs_filepath_clean(ctx, idx);
        return;
    }
    EJS_VAR_TYPE(ejs_filepath_abs_args_t, args);
    args.path = (char *)duk_require_lstring(ctx, idx, &args.len);
    ejs_call_function(ctx,
                      ejs_filepath_abs_impl, &args,
                      (ejs_finally_function)ejs_filepath_abs_args_destroy);
}

DUK_EXTERNAL void *ejs_stash_put_pointer(duk_context *ctx, const char *key, duk_size_t key_len)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    void *p = duk_require_pointer(ctx, -1);
    if (!p)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "ejs_stash_put_pointer expects -> {p:pointer}");
        duk_throw(ctx);
    }

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, key, key_len);
    if (!duk_is_object(ctx, -1))
    {
        duk_pop(ctx);
        duk_push_object(ctx);
        duk_dup_top(ctx);
        duk_put_prop_lstring(ctx, -3, key, key_len);
    }
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    //  ... val key {}
    duk_swap_top(ctx, -2);
    duk_dup(ctx, -3);
    duk_put_prop(ctx, -3);

    // ... val {key:val}
    duk_pop(ctx);
    return p;
}
DUK_EXTERNAL void *ejs_stash_delete_pointer(duk_context *ctx,
                                            duk_bool_t clear_finalizer,
                                            const char *key, duk_size_t key_len)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    void *p = duk_get_pointer_default(ctx, -1, 0);
    if (!p)
    {
        return 0;
    }
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, key, key_len);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_swap_top(ctx, -2);
    duk_get_prop(ctx, -2);
    if (!duk_equals(ctx, -1, -3))
    {
        return 0;
    }
    duk_pop(ctx);

    duk_push_pointer(ctx, p);
    duk_del_prop(ctx, -2);
    if (clear_finalizer)
    {
        duk_set_finalizer(ctx, -2);
    }
    else
    {
        duk_pop(ctx);
    }
    return p;
}
static duk_bool_t _ejs_stash_get_pointer(duk_context *ctx,
                                         void *pointer,
                                         const char *key, duk_size_t key_len,
                                         duk_bool_t pop)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, key, key_len);
    if (!duk_is_object(ctx, -1))
    {
        duk_pop_2(ctx);
        return 0;
    }
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    // {}
    duk_push_pointer(ctx, pointer);
    duk_get_prop(ctx, -2);
    // {} val
    if (!duk_is_object(ctx, -1))
    {
        duk_pop_2(ctx);
        return 0;
    }
    duk_swap_top(ctx, -2);
    // val {}
    if (pop)
    {
        duk_get_prop_lstring(ctx, -2, "p", 1);
        if (duk_get_pointer_default(ctx, -1, 0) != pointer)
        {
            duk_pop_3(ctx);
            return 0;
        }
        // val {} key
        duk_del_prop(ctx, -2);
        duk_pop(ctx);
    }
    else
    {
        duk_pop(ctx);
        // val
        duk_get_prop_lstring(ctx, -1, "p", 1);
        if (duk_get_pointer_default(ctx, -1, 0) != pointer)
        {
            duk_pop_2(ctx);
            return 0;
        }
        duk_pop(ctx);
    }
    return 1;
}
DUK_EXTERNAL duk_bool_t ejs_stash_get_pointer(duk_context *ctx,
                                              void *pointer,
                                              const char *key, duk_size_t key_len)
{
    return _ejs_stash_get_pointer(ctx, pointer, key, key_len, 0);
}
DUK_EXTERNAL duk_bool_t ejs_stash_pop_pointer(duk_context *ctx,
                                              void *pointer,
                                              const char *key, duk_size_t key_len)
{
    return _ejs_stash_get_pointer(ctx, pointer, key, key_len, 1);
}
DUK_EXTERNAL void ejs_stash_set_module_destroy(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "module_destroy", 14);
    if (!duk_is_function(ctx, -1))
    {
        duk_pop(ctx);
        return;
    }
    duk_del_prop_lstring(ctx, -2, "module_destroy", 14);
    // ... exports cb
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_MODULE_DESTROY);
    if (!duk_is_array(ctx, -1))
    {
        duk_pop(ctx);
        duk_push_array(ctx);
        duk_dup_top(ctx);
        duk_put_prop_lstring(ctx, -3, EJS_STASH_MODULE_DESTROY);
    }
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    // ... exports cb []
    duk_swap_top(ctx, -2);
    duk_put_prop_index(ctx, -2, duk_get_length(ctx, -2));

    duk_pop(ctx);
}
DUK_EXTERNAL duk_ret_t ejs_default_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    void *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        free(p);
    }
    return 0;
}
DUK_EXTERNAL duk_ret_t ejs_fd_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "fd", 2);
    int fd = duk_get_number_default(ctx, -1, -1);
    if (!EJS_INVALID_FD(fd))
    {
        close(fd);
    }
    return 0;
}

static duk_ret_t _ejs_async_cb_impl(duk_context *ctx)
{
    ppp_list_element_t *e = duk_require_pointer(ctx, -1);
    ejs_thread_pool_task_t *task = &PPP_LIST_CAST_VALUE(ejs_thread_pool_task, e);

    duk_pop(ctx);
    ejs_stash_pop_pointer(ctx, e, EJS_STASH_ASYNC);

    duk_get_prop_lstring(ctx, -1, "opts", 4);
    duk_get_prop_lstring(ctx, -2, "cb", 2);
    duk_swap_top(ctx, -3);
    duk_pop(ctx);
    duk_call(ctx, 1);
    return 0;
}
static void _ejs_async_cb(evutil_socket_t _, short events, void *arg)
{
    if (events)
    {
        return;
    }
    ejs_core_t *core = arg;
    ejs_thread_pool_t *p = core->thread_pool;
    ppp_list_element_t *e;
    ejs_thread_pool_task_t *task;

    while (1)
    {
        pthread_mutex_lock(&p->mutex);
        if (!ppp_list_len(&p->completed))
        {
            pthread_mutex_unlock(&p->mutex);
            break;
        }
        e = ppp_list_front(&p->completed);
        ppp_list_remove(&p->completed, e, 0);

        if (!(--p->count))
        {
            event_del(EJS_THREAD_POOL_EV_PTR(p));
        }

        pthread_mutex_unlock(&p->mutex);

        task = &PPP_LIST_CAST_VALUE(ejs_thread_pool_task, e);
        if (task->return_cb)
        {
            task->return_cb(task->userdata);
        }
        else
        {
            ejs_call_callback_noresult(core->duk, _ejs_async_cb_impl, e, 0);
        }
        free(e);
    }
}
typedef struct
{
    ejs_core_t *core;
    ejs_thread_pool_t *pool;
} ejs_core_thread_pool_t;

static ejs_thread_pool_t *_ejs_require_thread_pool_impl(duk_context *ctx, ejs_core_t *core)
{
    ejs_thread_pool_t *p = core->thread_pool;
    if (!p)
    {
        p = malloc(sizeof(ejs_thread_pool_t) + event_get_struct_event_size());
        if (!p)
        {
            ejs_throw_os(ctx, errno, 0);
        }
        if (pthread_mutex_init(&p->mutex, 0))
        {
            free(p);
            ejs_throw_cause(ctx, EJS_ERROR_THREAD_POOL_INIT, "init mutex fail");
        }

        PPP_THREAD_POOL_ERROR err = ppp_thread_pool_init(&p->pool, 0);
        if (err)
        {
            pthread_mutex_destroy(&p->mutex);
            free(p);
            ejs_throw_cause(ctx, EJS_ERROR_THREAD_POOL_INIT, ppp_thread_pool_error(err));
        }
        struct event *ev = EJS_THREAD_POOL_EV_PTR(p);
        if (event_assign(ev, core->base, 1, EV_PERSIST, _ejs_async_cb, core))
        {
            pthread_mutex_destroy(&p->mutex);
            ppp_thread_pool_destroy(&p->pool);
            free(p);
            ejs_throw_cause(ctx, EJS_ERROR_EVENT_ASSIGN, "event_assign for thread pool fail");
        }

        ppp_list_init(&p->completed, PPP_LIST_SIZEOF(ejs_thread_pool_task));
        p->count = 0;
        core->thread_pool = p;
    }
    return p;
}
DUK_EXTERNAL ejs_thread_pool_t *ejs_require_thread_pool(duk_context *ctx)
{
    return _ejs_require_thread_pool_impl(ctx, ejs_require_core(ctx));
}
ejs_core_thread_pool_t _ejs_require_thread_pool(duk_context *ctx)
{
    ejs_core_t *core = ejs_require_core(ctx);
    ejs_core_thread_pool_t result = {
        .core = core,
        .pool = _ejs_require_thread_pool_impl(ctx, ejs_require_core(ctx)),
    };
    return result;
}

static void ejs_async_cb(void *userdata)
{
    ppp_list_element_t *e = userdata;
    ejs_thread_pool_task_t *task = &PPP_LIST_CAST_VALUE(ejs_thread_pool_task, e);
    ejs_core_t *core = task->core;
    ejs_thread_pool_t *p = core->thread_pool;

    task->worker_cb(task->userdata);
    pthread_mutex_lock(&p->mutex);
    ppp_list_push_back_with(&p->completed, e);
    pthread_mutex_unlock(&p->mutex);

    event_active(EJS_THREAD_POOL_EV_PTR(p), 0, 0);
}
static void ejs_async_post_or_send(duk_context *ctx, ejs_async_function_t worker_cb, ejs_async_function_t return_cb, void *userdata, duk_bool_t post)
{
    ejs_core_thread_pool_t result = _ejs_require_thread_pool(ctx);

    ppp_list_element_t *e = malloc(result.pool->completed.sizeof_element);
    if (!e)
    {
        ejs_throw_os(ctx, errno, 0);
    }
    ejs_thread_pool_task_t *task = &PPP_LIST_CAST_VALUE(ejs_thread_pool_task, e);
    task->core = result.core;
    task->worker_cb = worker_cb;
    task->return_cb = return_cb;
    task->userdata = userdata;

    ejs_core_t *core = task->core;
    ejs_thread_pool_t *p = core->thread_pool;

    pthread_mutex_lock(&p->mutex);
    if (!p->count)
    {
        struct timeval tv =
            {
                .tv_sec = 3600 * 24 * 365,
                .tv_usec = 0,
            };
        if (event_add(EJS_THREAD_POOL_EV_PTR(p), &tv))
        {
            pthread_mutex_unlock(&core->thread_pool->mutex);
            free(e);
            ejs_throw_cause(ctx, EJS_ERROR_EVENT_ADD, 0);
            return;
        }
    }
    ++p->count;
    pthread_mutex_unlock(&core->thread_pool->mutex);
    PPP_THREAD_POOL_ERROR err = post ? ppp_thread_pool_post(&p->pool, ejs_async_cb, e) : ppp_thread_pool_send(&p->pool, ejs_async_cb, e);
    pthread_mutex_lock(&core->thread_pool->mutex);
    if (err)
    {
        if (!(--p->count))
        {
            event_del(EJS_THREAD_POOL_EV_PTR(p));
        }
        pthread_mutex_unlock(&core->thread_pool->mutex);
        free(e);
        ejs_throw_cause(ctx, EJS_ERROR_THREAD_POOL_DISPATCH, ppp_thread_pool_error(err));
        return;
    }
    pthread_mutex_unlock(&core->thread_pool->mutex);
}
DUK_EXTERNAL void ejs_async_post(duk_context *ctx, ejs_async_function_t worker_cb, ejs_async_function_t return_cb, void *userdata)
{
    if (!worker_cb)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "worker_cb can't be NULL");
        duk_throw(ctx);
    }
    if (!return_cb)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "return_cb can't be NULL");
        duk_throw(ctx);
    }
    ejs_async_post_or_send(ctx, worker_cb, return_cb, userdata, 1);
}

DUK_EXTERNAL void ejs_async_send(duk_context *ctx, ejs_async_function_t worker_cb, ejs_async_function_t return_cb, void *userdata)
{
    if (!worker_cb)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "worker_cb can't be NULL");
        duk_throw(ctx);
    }
    if (!return_cb)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "return_cb can't be NULL");
        duk_throw(ctx);
    }
    ejs_async_post_or_send(ctx, worker_cb, return_cb, userdata, 0);
}
typedef struct
{
    ejs_async_function_t worker_cb;
    duk_c_function return_cb;
    void *p;
    uint8_t post : 1;
    uint8_t stash : 1;
} ejs_async_cb_post_or_send_args_t;

static duk_ret_t ejs_async_cb_post_or_send_impl(duk_context *ctx)
{
    ejs_async_cb_post_or_send_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, -1, "p", 1);
    void *userdata = duk_get_pointer_default(ctx, -1, 0);
    duk_pop(ctx);

    ejs_core_thread_pool_t result = _ejs_require_thread_pool(ctx);

    ppp_list_element_t *e = malloc(result.pool->completed.sizeof_element);
    if (!e)
    {
        ejs_throw_os(ctx, errno, 0);
    }
    args->p = e;
    duk_push_object(ctx);
    duk_swap_top(ctx, -2);
    duk_put_prop_lstring(ctx, -2, "opts", 4);
    duk_push_pointer(ctx, e);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_push_c_lightfunc(ctx, args->return_cb, 1, 1, 0);
    duk_put_prop_lstring(ctx, -2, "cb", 2);

    ejs_stash_put_pointer(ctx, EJS_STASH_ASYNC);
    args->stash = 1;

    ejs_thread_pool_task_t *task = &PPP_LIST_CAST_VALUE(ejs_thread_pool_task, e);
    task->core = result.core;
    task->worker_cb = args->worker_cb;
    task->return_cb = 0;
    task->userdata = userdata;

    ejs_core_t *core = task->core;
    ejs_thread_pool_t *p = core->thread_pool;

    pthread_mutex_lock(&p->mutex);
    duk_bool_t added = 0;
    if (!p->count)
    {
        struct timeval tv =
            {
                .tv_sec = 3600 * 24 * 365,
                .tv_usec = 0,
            };
        if (event_add(EJS_THREAD_POOL_EV_PTR(p), &tv))
        {
            pthread_mutex_unlock(&core->thread_pool->mutex);
            free(e);
            ejs_stash_delete_pointer(ctx, 0, EJS_STASH_ASYNC);
            args->p = 0;
            ejs_throw_cause(ctx, EJS_ERROR_EVENT_ADD, 0);
        }
        added = 1;
    }
    ++p->count;
    pthread_mutex_unlock(&core->thread_pool->mutex);
    PPP_THREAD_POOL_ERROR err = args->post ? ppp_thread_pool_post(&p->pool, ejs_async_cb, e) : ppp_thread_pool_send(&p->pool, ejs_async_cb, e);
    pthread_mutex_lock(&core->thread_pool->mutex);
    if (err)
    {
        if (!(--p->count))
        {
            event_del(EJS_THREAD_POOL_EV_PTR(p));
        }
        pthread_mutex_unlock(&core->thread_pool->mutex);
        free(e);
        ejs_stash_delete_pointer(ctx, 0, EJS_STASH_ASYNC);
        args->p = 0;
        ejs_throw_cause(ctx, EJS_ERROR_THREAD_POOL_DISPATCH, ppp_thread_pool_error(err));
    }
    pthread_mutex_unlock(&core->thread_pool->mutex);
    return 1;
}
static void ejs_async_cb_post_or_send(duk_context *ctx, ejs_async_function_t worker_cb, duk_c_function return_cb, duk_bool_t post)
{
    ejs_async_cb_post_or_send_args_t args = {
        .worker_cb = worker_cb,
        .return_cb = return_cb,
        .post = post,
        .stash = 0,
        .p = 0,
    };
    if (ejs_pcall_function_n(ctx, ejs_async_cb_post_or_send_impl, &args, 2))
    {
        if (args.p)
        {
            if (args.stash && ejs_stash_pop_pointer(ctx, args.p, EJS_STASH_ASYNC))
            {
                duk_pop(ctx);
            }
            free(args.p);
        }
        duk_throw(ctx);
    }
    duk_pop(ctx);
}
DUK_EXTERNAL void ejs_async_cb_post(duk_context *ctx, ejs_async_function_t worker_cb, duk_c_function return_cb)
{
    if (!worker_cb)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "worker_cb can't be NULL");
        duk_throw(ctx);
    }
    if (!return_cb)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "return_cb can't be NULL");
        duk_throw(ctx);
    }
    if (!duk_is_object(ctx, -1) || duk_is_array(ctx, -1))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "options must be object");
        duk_throw(ctx);
    }
    ejs_async_cb_post_or_send(ctx, worker_cb, return_cb, 1);
}

DUK_EXTERNAL void ejs_async_cb_send(duk_context *ctx, ejs_async_function_t worker_cb, duk_c_function return_cb)
{
    if (!worker_cb)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "worker_cb can't be NULL");
        duk_throw(ctx);
    }
    if (!return_cb)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "return_cb can't be NULL");
        duk_throw(ctx);
    }
    if (!duk_is_object(ctx, -1) || duk_is_array(ctx, -1))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "options must be object");
        duk_throw(ctx);
    }
    ejs_async_cb_post_or_send(ctx, worker_cb, return_cb, 0);
}
typedef struct
{
    duk_size_t sz;
    duk_c_function finalizer;
    void *p;
} ejs_push_finalizer_object_args_t;
static duk_ret_t ejs_push_finalizer_object_impl(duk_context *ctx)
{
    ejs_push_finalizer_object_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    args->p = malloc(args->sz);
    if (!args->p)
    {
        ejs_throw_os(ctx, errno, 0);
    }
    memset(args->p, 0, args->sz);

    duk_push_object(ctx);
    duk_push_pointer(ctx, args->p);
    duk_put_prop_lstring(ctx, -2, "p", 1);
    duk_push_c_lightfunc(ctx, args->finalizer ? args->finalizer : ejs_default_finalizer, 1, 1, 0);
    duk_set_finalizer(ctx, -2);

    return 1;
}
DUK_EXTERNAL void *ejs_push_finalizer_object(duk_context *ctx, duk_size_t sz, duk_c_function finalizer)
{
    ejs_push_finalizer_object_args_t args = {
        .sz = sz,
        .finalizer = finalizer,
        .p = 0,
    };
    if (ejs_pcall_function(ctx, ejs_push_finalizer_object_impl, &args))
    {
        if (args.p)
        {
            free(args.p);
        }
        duk_throw(ctx);
    }
    return args.p;
}