#include "core.h"
#include "utils.h"
#include "error.h"
#include "stash.h"
#include "config.h"
#include "_duk.h"
#include "js/tsc.h"

#include <stdlib.h>
#include <string.h>
#include "../duk/duk_console.h"

typedef struct
{
    duk_context *ctx;
    int argc;
    char **argv;
    ejs_core_t *core;
} ejs_core_new_args_t;
static duk_ret_t ejs_core_new_impl(duk_context *ctx)
{
    ejs_core_new_args_t *args = duk_require_pointer(ctx, 0);
    duk_pop(ctx);
    // ejs_core_t *core = (ejs_core_t *)malloc(sizeof(ejs_core_t));
    // if (!core)
    // {
    //     duk_push_error_object(ctx, DUK_ERR_ERROR, ejs_error(EJS_ERROR_MALLOC));
    //     duk_throw(ctx);
    // }
    // memset(core, 0, sizeof(ejs_core_t));
    // core->base = event_base_new();
    // if (!core->base)
    // {
    //     duk_push_error_object(ctx, DUK_ERR_ERROR, ejs_error(EJS_ERROR_EVENT_BASE_NEW));
    //     duk_throw(ctx);
    // }

    duk_push_heap_stash(ctx);

    // ejs
    duk_eval_lstring(ctx, js_ejs_js_tsc_min_js, js_ejs_js_tsc_min_js_len);
    {
        duk_push_array(ctx);
        for (int i = 0; i < args->argc; i++)
        {
            duk_push_string(ctx, args->argv[i]);
            duk_put_prop_index(ctx, -2, i);
        }
        duk_put_prop_lstring(ctx, -2, EJS_STASH_EJS_ARGS);

        duk_push_lstring(ctx, EJS_CONFIG_OS);
        duk_put_prop_lstring(ctx, -2, EJS_STASH_EJS_OS);
        duk_push_lstring(ctx, EJS_CONFIG_ARCH);
        duk_put_prop_lstring(ctx, -2, EJS_STASH_EJS_ARCH);
    }
    duk_dup_top(ctx);
    duk_put_prop_lstring(ctx, -3, EJS_STASH_EJS);
    // ejs to global
    duk_put_global_lstring(ctx, EJS_STASH_EJS);

    // console
    duk_console_init(ctx, 0);

    _ejs_dump_context_stdout(ctx);

    return 0;
}
duk_ret_t ejs_core_new(duk_context *ctx, int argc, char **argv)
{
    EJS_VAR_TYPE(ejs_core_new_args_t, args);
    args.ctx = ctx;
    args.argc = argc;
    args.argv = argv;

    duk_push_c_lightfunc(ctx, ejs_core_new_impl, 1, 1, 0);
    duk_push_pointer(ctx, &args);
    duk_ret_t err = duk_pcall(ctx, 1);
    if (err)
    {
        if (args.core)
        {
            if (args.core->base)
            {
                event_base_free(args.core->base);
            }
            free(args.core);
        }
        return err;
    }

    duk_eval_string(ctx,
                    "var e=new ejs.Error('abc',{cause:123});"
                    "console.log(ejs.os);"
                    "ejs.os='abc';"
                    "console.log(ejs.os);"
                    "");
    // duk_eval_string(ctx,
    //                 "class a{}");
    _ejs_dump_context_stdout(ctx);
    //     ejs_core_t *core = (ejs_core_t *)malloc(sizeof(ejs_core_t));
    //     if (!core)
    //     {
    //         EJS_SAFE_SET_ERROR(err, EJS_ERROR_MALLOC);
    //         return 0;
    //     }
    //     memset(core, 0, sizeof(ejs_core_t));
    //     core->base = event_base_new();
    //     if (!core->base)
    //     {
    //         EJS_SAFE_SET_ERROR(err, EJS_ERROR_EVENT_BASE_NEW);
    //         goto ERR;
    //     }

    //     core->duk = duk_create_heap_default();
    //     if (!core->duk)
    //     {

    //         EJS_SAFE_SET_ERROR(err, EJS_ERROR_DUK_CREATE_HEAP);
    //         goto ERR;
    //     }

    //     srand((unsigned)time(NULL));
    //     if (!duk_check_stack_top(core->duk, 5))
    //     {
    //         EJS_SAFE_SET_ERROR(err, EJS_ERROR_DUK_CHECK_STACK_TOP);
    //         goto ERR;
    //     }
    //     duk_push_c_lightfunc(core->duk, _ejs_init, 1, 1, 0);
    //     duk_push_pointer(core->duk, core);
    //     if (duk_pcall(core->duk, 1))
    //     {
    //         duk_pop(core->duk);
    //         EJS_SAFE_SET_ERROR(err, EJS_ERROR_DUK_EXTRAS_INIT);
    //         goto ERR;
    //     }
    //     else
    //     {
    //         EJS_ERROR_RET ec = duk_get_int_default(core->duk, -1, 0);
    //         duk_pop(core->duk);
    //         if (ec)
    //         {
    //             EJS_SAFE_SET_ERROR(err, ec);
    //             goto ERR;
    //         }
    //     }

    //     EJS_SAFE_SET_ERROR(err, EJS_ERROR_OK);
    //     return core;
    // ERR:
    //     ejs_core_delete(core);
    return EJS_ERROR_OK;
}
void ejs_core_delete(ejs_core_t *core)
{
    EJS_SAFE_DELETE_F(event_base_free, core->base);
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
EJS_ERROR_RET ejs_core_run(ejs_core_t *core, int argc, char **argv)
{

    // duk_peval_string(core->duk, "try{var m=require('./a.js');console.log(m)}catch(e){console.log('error:',e,e.message);throw e}");
    _ejs_dump_context_stdout(core->duk);
    return EJS_ERROR_OK;
}