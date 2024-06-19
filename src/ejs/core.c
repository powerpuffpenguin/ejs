#include "core.h"
#include "defines.h"
#include "stash.h"
#include "config.h"
#include "_duk.h"
#include "_duk_timer.h"
#include "js/tsc.h"
#include "strings.h"
#include "internal/c_filepath.h"
#include <errno.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include <event2/event.h>
#include "../duk/duk_module_node.h"

DUK_EXTERNAL const char *ejs_version()
{
    return "v0.0.1";
}
static BOOL check_module_name(const char *name, duk_size_t *len)
{
    if (!name)
    {
        return FALSE;
    }
    *len = strlen(name);
    if (*len < 1)
    {
        return FALSE;
    }
    switch (name[0])
    {
    case '.':
    case '/':
    case '\\':
        return FALSE;
    }
    return TRUE;
}
static void register_module(duk_context *ctx, const char *name, duk_c_function init)
{
    if (!init)
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_INVALID_MODULE_FUNC, NULL);
    }
    duk_size_t len;
    if (!check_module_name(name, &len))
    {
        if (name)
        {
            ejs_throw_cause_format(ctx, EJS_ERROR_INVALID_MODULE_NAME, "invalid module name: %s", name);
        }
        else
        {
            ejs_throw_cause_format(ctx, EJS_ERROR_INVALID_MODULE_NAME, "invalid module name: ");
        }
    }

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_MODULE);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, -1, name, len);
    if (duk_is_c_function(ctx, -1))
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_MODULE_NAME_REPEAT, "module name repeat: %s", name);
    }
    duk_pop(ctx);
    duk_push_c_lightfunc(ctx, init, 2, 2, 0);
    duk_put_prop_lstring(ctx, -2, name, len);

    duk_pop(ctx);
}
static duk_ret_t on_register(duk_context *ctx)
{
    ejs_on_register_f on_register = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    on_register(ctx, register_module);
    return 0;
}
static duk_ret_t native_strerror(duk_context *ctx)
{
    duk_push_string(ctx, strerror(duk_get_int_default(ctx, 0, 0)));
    return 1;
}
static duk_ret_t native_exit(duk_context *ctx)
{
    exit(duk_get_int_default(ctx, 0, 0));
    return 0;
}
static duk_ret_t native_equal(duk_context *ctx)
{
    duk_size_t a_len;
    const uint8_t *a;
    if (duk_is_string(ctx, 0))
    {
        a = duk_require_lstring(ctx, 0, &a_len);
    }
    else
    {
        a = duk_require_buffer_data(ctx, 0, &a_len);
    }
    duk_size_t b_len;
    const uint8_t *b;
    if (duk_is_string(ctx, 1))
    {
        b = duk_require_lstring(ctx, 1, &b_len);
    }
    else
    {
        b = duk_require_buffer_data(ctx, 1, &b_len);
    }

    duk_pop_2(ctx);
    if (a_len == b_len && !memcmp(a, b, a_len))
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
static duk_ret_t native_threads_stat(duk_context *ctx)
{
    ejs_core_t *core = ejs_require_core(ctx);
    if (!core->thread_pool)
    {
        return 0;
    }
    ppp_thread_pool_stat_t stat;
    ppp_thread_pool_stat(&core->thread_pool->pool, &stat);

    duk_push_object(ctx);
    if (stat.worker_of_idle > 0)
    {
        duk_push_number(ctx, stat.worker_of_idle);
        duk_put_prop_lstring(ctx, -2, "workerIdle", 10);
    }
    if (stat.worker_of_max > 0)
    {
        duk_push_number(ctx, stat.worker_of_max);
        duk_put_prop_lstring(ctx, -2, "workerMax", 9);
    }

    duk_push_number(ctx, stat.idle);
    duk_put_prop_lstring(ctx, -2, "idle", 4);
    duk_push_number(ctx, stat.producer);
    duk_put_prop_lstring(ctx, -2, "producer", 8);
    duk_push_number(ctx, stat.consumer);
    duk_put_prop_lstring(ctx, -2, "consumer", 8);
    duk_push_number(ctx, stat.task);
    duk_put_prop_lstring(ctx, -2, "task", 4);
    return 1;
}

static duk_ret_t native_threads_set(duk_context *ctx)
{
    ejs_thread_pool_t *p = ejs_require_thread_pool(ctx);

    if (duk_is_null_or_undefined(ctx, -1))
    {
        ppp_thread_pool_set(&p->pool, 0);
    }
    else
    {
        ppp_thread_pool_options_t opts;

        duk_get_prop_lstring(ctx, 0, "workerIdle", 10);
        opts.worker_of_idle = duk_require_int(ctx, -1);
        duk_pop(ctx);

        duk_get_prop_lstring(ctx, 0, "workerMax", 9);
        opts.worker_of_max = duk_require_int(ctx, -1);
        duk_pop(ctx);

        ppp_thread_pool_set(&p->pool, &opts);
    }
    return 0;
}
typedef struct
{
    duk_context *ctx;
    ejs_core_options_t *opts;
    ejs_core_t *core;
    ppp_c_string_t dir;
    ppp_c_string_t s;
} ejs_core_new_args_t;
static duk_ret_t ejs_core_new_impl(duk_context *ctx)
{
    ejs_core_new_args_t *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);

    duk_push_heap_stash(ctx);
    duk_eval_lstring(ctx, js_ejs_js_tsc_min_js, js_ejs_js_tsc_min_js_len);
    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, native_strerror, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "strerror", 8);
    }
    duk_call(ctx, 1);
    // ejs
    {
        duk_push_array(ctx);
        if (args->opts)
        {
            for (int i = 0; i < args->opts->argc; i++)
            {
                duk_push_string(ctx, args->opts->argv[i]);
                duk_put_prop_index(ctx, -2, i);
            }
        }
        duk_put_prop_lstring(ctx, -2, EJS_STASH_EJS_ARGS);

        duk_push_lstring(ctx, EJS_CONFIG_OS);
        duk_put_prop_lstring(ctx, -2, EJS_STASH_EJS_OS);
        duk_push_lstring(ctx, EJS_CONFIG_ARCH);
        duk_put_prop_lstring(ctx, -2, EJS_STASH_EJS_ARCH);

        duk_push_string(ctx, ejs_version());
        duk_put_prop_lstring(ctx, -2, EJS_STASH_EJS_VERSION);

        duk_push_c_lightfunc(ctx, native_exit, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "exit", 4);
        duk_push_c_lightfunc(ctx, native_equal, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "equal", 5);

        duk_push_c_lightfunc(ctx, native_threads_stat, 0, 0, 0);
        duk_put_prop_lstring(ctx, -2, "threadsStat", 11);
        duk_push_c_lightfunc(ctx, native_threads_set, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "threadsSet", 10);
    }
    duk_dup_top(ctx);
    duk_put_prop_lstring(ctx, -3, EJS_STASH_EJS);

    // Error
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_ERROR);
    duk_put_prop_lstring(ctx, -3, EJS_STASH_EJS_ERROR);
    // OsError
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_OS_ERROR);
    duk_put_prop_lstring(ctx, -3, EJS_STASH_EJS_OS_ERROR);

    // ejs to global
    duk_put_global_lstring(ctx, EJS_STASH_EJS);

    // JSON
    duk_get_global_lstring(ctx, EJS_STASH_JSON);
    duk_put_prop_lstring(ctx, -2, EJS_STASH_JSON);

    // module found path
    duk_push_array(ctx);
    if (args->opts && args->opts->modulec)
    {
        ppp_c_string_t *dir = &args->dir;
        ppp_c_string_t *path = &args->s;
        size_t name_len;
        const char *name;
        for (int i = 0; i < args->opts->modulec; i++)
        {
            name = args->opts->modulev[i];
            name_len = strlen(name);
            if (ppp_c_filepath_is_abs_raw(name, name_len))
            {
                path->len = 0;
                if (ppp_c_string_append(path, name, name_len))
                {
                    ejs_throw_os_errno(ctx);
                }
                if (ppp_c_filepath_clean(path))
                {
                    ejs_throw_os_errno(ctx);
                }
            }
            else
            {
                if (!dir->cap)
                {
                    dir->str = malloc(MAXPATHLEN + 1);
                    if (!dir->str)
                    {
                        ejs_throw_os_errno(ctx);
                    }
                    dir->cap = MAXPATHLEN;
                    if (!getcwd(dir->str, MAXPATHLEN))
                    {
                        ejs_throw_os_errno(ctx);
                    }
                    dir->len = strlen(dir->str);
                }

                path->len = 0;
                if (ppp_c_string_append(path, dir->str, dir->len))
                {
                    ejs_throw_os_errno(ctx);
                }
                if (ppp_c_filepath_join_one_raw(path, name, name_len))
                {
                    ejs_throw_os_errno(ctx);
                }
            }
            duk_push_lstring(ctx, path->str, path->len);
            duk_put_prop_index(ctx, -2, i);
        }
    }
    duk_put_prop_lstring(ctx, -2, EJS_STASH_FOUND);

    // module init
    duk_push_object(ctx);
    duk_put_prop_lstring(ctx, -2, EJS_STASH_MODULE);

    // console module
    _ejs_init_base(ctx);

    // core
    ejs_core_t *core = (ejs_core_t *)malloc(sizeof(ejs_core_t));
    if (!core)
    {
        ejs_throw_os(ctx, errno, strerror(errno));
    }
    memset(core, 0, sizeof(ejs_core_t));
    args->core = core;
    core->duk = args->ctx;
    if (args->opts && args->opts->base)
    {
        core->base = args->opts->base;
    }
    else
    {
        core->base = event_base_new();
        if (!core->base)
        {
            ejs_throw_cause(ctx, EJS_ERROR_EVENT_BASE_NEW, NULL);
        }
        core->flags = 0x1;
    }
    duk_push_pointer(ctx, core);
    duk_put_prop_lstring(ctx, -2, EJS_STASH_CORE);

    // extras
    _ejs_init_extras(ctx);

    if (args->opts->on_register)
    {
        duk_push_c_lightfunc(ctx, on_register, 1, 1, 0);
        duk_push_pointer(ctx, args->opts->on_register);
        duk_call(ctx, 1);
        duk_pop(ctx);
    }

    duk_push_pointer(ctx, core);
    return 1;
}
DUK_EXTERNAL duk_ret_t ejs_core_new(duk_context *ctx, ejs_core_options_t *opts)
{
    EJS_VAR_TYPE(ejs_core_new_args_t, args);
    args.ctx = ctx;
    args.opts = opts;
    duk_push_c_lightfunc(ctx, ejs_core_new_impl, 1, 1, 0);
    duk_push_pointer(ctx, &args);
    duk_ret_t err = duk_pcall(ctx, 1);
    if (args.dir.cap)
    {
        free(args.dir.str);
    }
    if (args.s.cap)
    {
        free(args.s.str);
    }
    if (err)
    {
        if (args.core)
        {
            if (args.core->base && !opts->base)
            {
                event_base_free(args.core->base);
            }
            free(args.core);
        }
        return err;
    }
    return DUK_EXEC_SUCCESS;
}
static duk_ret_t _ejs_module_destroy(duk_context *ctx)
{
    duk_push_heap_stash(ctx);
    _ejs_destroy_timer(ctx);

    duk_get_prop_lstring(ctx, -1, EJS_STASH_MODULE_DESTROY);
    if (!duk_is_array(ctx, -1))
    {
        return 0;
    }
    duk_size_t count = duk_get_length(ctx, -1);
    if (!count)
    {
        return 0;
    }
    duk_swap_top(ctx, -2);
    duk_pop(ctx);
    for (duk_size_t i = 0; i < count; i++)
    {
        duk_get_prop_index(ctx, -1, i);
        if (!duk_is_function(ctx, -1))
        {
            duk_pop(ctx);
            continue;
        }
        duk_pcall(ctx, 0);
        duk_pop(ctx);
    }
    return 0;
}
DUK_EXTERNAL void ejs_core_delete(ejs_core_t *core)
{
    duk_idx_t count = duk_get_top(core->duk);
    if (duk_get_top(core->duk))
    {
        duk_pop_n(core->duk, count);
    }
    duk_push_c_lightfunc(core->duk, _ejs_module_destroy, 0, 0, 0);
    duk_pcall(core->duk, 0);

    if (core->thread_pool)
    {
        ppp_thread_pool_destroy(&core->thread_pool->pool);
        pthread_mutex_destroy(&core->thread_pool->mutex);
        free(core->thread_pool);
    }

    if (core->base && (core->flags & 0x1))
    {
        event_base_free(core->base);
    }
    EJS_SAFE_DELETE_F(duk_destroy_heap, core->duk);
    free(core);
}

DUK_EXTERNAL EJS_ERROR_RET ejs_core_dispatch(ejs_core_t *core)
{
    int err = event_base_dispatch(core->base);
    if (err == 0)
    {
        return EJS_ERROR_OK;
    }
    return err > 0 ? EJS_ERROR_NO_EVENT : EJS_ERROR_NO_EVENT_BASE_DISPATCH;
}

typedef struct
{
    char *source;
    size_t source_len;
    ppp_c_string_t path;
} ejs_core_run_source_t;

static duk_ret_t c_ejs_core_run_source_impl(duk_context *ctx, ejs_core_run_source_t *args)
{
    // push source
    duk_push_lstring(ctx, args->source, args->source_len);
    // get path
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_ARGS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    if (duk_is_array(ctx, -1) && duk_get_length(ctx, -1) >= 2)
    {

        duk_get_prop_index(ctx, -1, 1);
        duk_swap_top(ctx, -2);
        duk_pop(ctx);
        duk_size_t len;

        args->path.str = (char *)duk_get_lstring(ctx, -1, &len);
        if (len)
        {
            args->path.len = len;
        }
        else
        {
            args->path.len = 7;
            args->path.str = "main.js";
        }
    }
    else
    {
        args->path.str = "main.js";
        args->path.len = 7;
    }

    if (ppp_c_filepath_abs(&args->path))
    {
        duk_pop_2(ctx);
        ejs_throw_os_errno(ctx);
    }
    else if (args->path.cap)
    {
        args->path.str[args->path.len] = 0;
    }
    else
    {
        char *s = malloc(args->path.len + 1);
        if (!s)
        {
            ejs_throw_os(ctx, errno, "malloc path string fail");
        }
        s[args->path.len] = 0;
        memcpy(s, args->path.str, args->path.len);
        args->path.str = s;
    }
    duk_pop(ctx);
    if (duk_module_node_peval_main(ctx, args->path.str))
    {
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t ejs_core_run_source_impl(duk_context *ctx)
{
    ejs_core_run_source_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    return c_ejs_core_run_source_impl(ctx, args);
}
DUK_EXTERNAL duk_ret_t ejs_core_run_source(ejs_core_t *core, const char *source)
{
    ejs_core_run_source_t args = {0};
    args.source = (char *)source;
    args.source_len = strlen(source);
    duk_ret_t err = ejs_pcall_function(core->duk, ejs_core_run_source_impl, &args);
    if (args.path.cap)
    {
        free(args.path.str);
    }
    return err;
}

typedef struct
{
    ejs_core_run_source_t source;
    const char *name;
} ejs_core_run_args_t;
static duk_ret_t ejs_core_run_impl(duk_context *ctx)
{
    ejs_core_run_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    struct stat info;
    int fd = _ejs_open_source(args->name, &info);
    if (fd == -1)
    {
        ejs_throw_os_format(ctx, errno, "no source exists: %s", args->name);
    }
    else if (!S_ISREG(info.st_mode) || !info.st_size)
    {
        close(fd);
        ejs_throw_os_format(ctx, EJS_ERROR_INVALID_MODULE_FILE, "invalid source file: %s", args->name);
    }
    else
    {
        if (info.st_size > 1024 * 1024 * EJS_CONFIG_MAX_JS_SIZE)
        {
            close(fd);
            ejs_throw_cause_format(ctx, EJS_ERROR_LARGE_MODULE, "source size exceeds  limit(%dmb): %s", EJS_CONFIG_MAX_JS_SIZE, args->name);
        }
        args->source.source = malloc(info.st_size);
        if (!args->source.source)
        {
            int err = errno;
            close(fd);
            ejs_throw_os_format(ctx, err, "malloc read source buffer fail: %ld %s", info.st_size, args->name);
        }
        args->source.source_len = info.st_size;
    }
    if (_ejs_read_limit(fd, args->source.source, args->source.source_len))
    {
        close(fd);
        ejs_throw_cause_format(ctx, EJS_ERROR_MODULE_READ_FAIL, "read source fail: %s", args->name);
    }
    close(fd);

    return c_ejs_core_run_source_impl(ctx, &args->source);
}
DUK_EXTERNAL duk_ret_t ejs_core_run(ejs_core_t *core, const char *path)
{
    EJS_VAR_TYPE(ejs_core_run_args_t, args);
    args.name = path;
    duk_ret_t err = ejs_pcall_function(core->duk, ejs_core_run_impl, &args);
    if (args.source.source_len)
    {
        if (args.source.path.cap)
        {
            free(args.source.path.str);
        }
        free(args.source.source);
    }
    return err;
}
DUK_EXTERNAL ejs_core_t *ejs_require_core(duk_context *ctx)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_CORE);
    ejs_core_t *core = duk_require_pointer(ctx, -1);
    duk_pop_2(ctx);
    return core;
}
