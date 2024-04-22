#include "core.h"
#include "utils.h"
#include "error.h"
#include "stash.h"
#include "config.h"
#include "_duk.h"
#include "duk.h"
#include "js/tsc.h"
#include "strings.h"
#include "path.h"

#include <stdlib.h>
#include <string.h>
#include <unistd.h>
#include "../duk/duk_module_node.h"

static duk_ret_t native_strerror(duk_context *ctx)
{
    duk_push_string(ctx, strerror(duk_get_int_default(ctx, 0, 0)));
    return 1;
}
typedef struct
{
    duk_context *ctx;
    ejs_core_options_t *opts;
    ejs_core_t *core;
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

    // module init
    duk_push_object(ctx);
    duk_put_prop_lstring(ctx, -2, EJS_STASH_MODULE);

    // console module
    _ejs_init(ctx);

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
            ejs_throw_cause(ctx, EJS_ERROR_EVENT_BASE_NEW, ejs_error(EJS_ERROR_EVENT_BASE_NEW));
        }
        core->flags = 0x1;
    }
    duk_push_pointer(ctx, core);
    duk_put_prop_lstring(ctx, -2, EJS_STASH_CORE);

    duk_push_pointer(ctx, core);
    return 1;
}
duk_ret_t ejs_core_new(duk_context *ctx, ejs_core_options_t *opts)
{
    EJS_VAR_TYPE(ejs_core_new_args_t, args);
    args.ctx = ctx;
    args.opts = opts;
    duk_push_c_lightfunc(ctx, ejs_core_new_impl, 1, 1, 0);
    duk_push_pointer(ctx, &args);
    duk_ret_t err = duk_pcall(ctx, 1);
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
void ejs_core_delete(ejs_core_t *core)
{
    if (core->base && (core->flags & 0x1))
    {
        event_base_free(core->base);
    }
    EJS_SAFE_DELETE_F(duk_destroy_heap, core->duk);
    free(core);
}

EJS_ERROR_RET ejs_core_dispatch(ejs_core_t *core)
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
    const char *path;
    const char *source;
    size_t len;
} ejs_core_run_source_t;

static duk_ret_t ejs_core_get_path_impl(duk_context *ctx)
{
    duk_pop(ctx);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_ARGS);
    if (duk_is_array(ctx, -1) && duk_get_length(ctx, -1) >= 2)
    {
        duk_swap_top(ctx, -3);
        duk_pop_2(ctx);

        duk_get_prop_index(ctx, -1, 1);
        duk_swap_top(ctx, -2);
        duk_pop(ctx);
    }
    else
    {
        duk_pop_3(ctx);
        duk_push_lstring(ctx, "main.js", 7);
    }
    ejs_filepath_abs(ctx, -1);
    return 1;
}

static duk_ret_t ejs_core_run_path_source_impl(duk_context *ctx)
{
    ejs_core_run_source_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);
    duk_push_lstring(ctx, args->source, args->len);
    if (duk_module_node_peval_main(ctx, args->path))
    {
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t ejs_core_run_source_impl(duk_context *ctx)
{
    ejs_core_run_source_t *args = duk_require_pointer(ctx, -1);

    // get abs path
    duk_push_c_lightfunc(ctx, ejs_core_get_path_impl, 1, 1, 0);
    duk_swap_top(ctx, -2);
    duk_call(ctx, 1);
    args->path = duk_get_string(ctx, -1);

    // run
    ejs_call_function(ctx, ejs_core_run_path_source_impl, args, NULL);
    return 1;
}
duk_ret_t ejs_core_run_source(ejs_core_t *core, const char *source)
{
    EJS_VAR_TYPE(ejs_core_run_source_t, args);
    args.source = source;
    args.len = strlen(source);
    return ejs_pcall_function(core->duk, ejs_core_run_source_impl, &args);
}

typedef struct
{
    const char *path;
    char *source;
    size_t len;
} ejs_core_run_args_t;
static duk_ret_t ejs_core_run_impl(duk_context *ctx)
{
    ejs_core_run_args_t *args = duk_require_pointer(ctx, -1);
    FILE *f = fopen(args->path, "r");
    if (!f)
    {
        ejs_throw_os_format(ctx, errno, "fopen fail: %s", args->path);
    }
    if (fseek(f, 0, SEEK_END))
    {
        int err = errno;
        fclose(f);
        ejs_throw_os_format(ctx, err, "fseek fail: %s", args->path);
    }
    args->len = ftell(f);
    if (fseek(f, 0, SEEK_SET))
    {
        int err = errno;
        fclose(f);
        ejs_throw_os_format(ctx, err, "fseek fail: %s", args->path);
    }
    args->source = malloc(args->len);
    if (!args->source)
    {
        int err = errno;
        fclose(f);
        ejs_throw_os_format(ctx, err, "malloc(%d) fail", args->len);
    }
    size_t readed = fread(args->source, 1, args->len, f);
    fclose(f);
    if (readed != args->len)
    {
        ejs_throw_cause(ctx, EJS_ERROR_SHORT_READ, ejs_error(EJS_ERROR_SHORT_READ));
    }
    ejs_call_function(ctx, ejs_core_run_source_impl, args, NULL);
    return 1;
}
duk_ret_t ejs_core_run(ejs_core_t *core, const char *path)
{
    EJS_VAR_TYPE(ejs_core_run_args_t, args);
    args.path = path;
    duk_ret_t err = ejs_pcall_function(core->duk, ejs_core_run_impl, &args);
    if (args.source)
    {
        free(args.source);
    }
    return err;
}