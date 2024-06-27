#include <stdio.h>
#include <event2/thread.h>
#include <event2/event.h>
#include "ejs/core.h"
#include <mbedtls/psa_util.h>

static duk_ret_t native_debug_init(duk_context *ctx)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_push_string(ctx, "__ejs/debug");
    duk_put_prop_string(ctx, -2, "name");
    return 0;
}
static duk_ret_t native_debug_init2(duk_context *ctx)
{
    duk_push_string(ctx, "__ejs/debug2");
    duk_put_prop_string(ctx, -2, "name");
    return 0;
}
static void on_register(duk_context *ctx, ejs_register_f f)
{
    f(ctx, "__ejs/debug", native_debug_init);
    f(ctx, "__ejs/debug2", native_debug_init2);
}
int main(int argc, const char **argv)
{
    if (argc < 2)
    {
        printf("Use \"%s filepath\" to execute the script.\n", argv[0]);
        return 0;
    }
    else if (evthread_use_pthreads())
    {
        puts("evthread_use_pthreads fail");
        return -1;
    }

    // create js execution environment
    duk_context *ctx = duk_create_heap_default();
    if (!ctx)
    {
        puts("duk_create_heap_default fail");
        return -1;
    }

    // set options
    ejs_core_options_t opts = {0};
    // process startup parameters
    opts.argc = argc;
    opts.argv = argv;
    // module search path
    const char *modulev[] = {"node_modules"};
    opts.modulec = sizeof(modulev) / sizeof(const char *);
    opts.modulev = modulev;
    // Register a custom native module in this callback
    opts.on_register = on_register;

    // initialize core code
    duk_ret_t err = ejs_core_new(ctx, &opts);
    if (err)
    {
        puts(duk_safe_to_string(ctx, -1));
        duk_destroy_heap(ctx);
        return err;
    }
    ejs_core_t *core = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    int ret = 0;
    // Initialize mbedtls
    psa_crypto_init();

    // run main.js
    // err = ejs_core_run_source(core, "console.log('this is a.js');"
    //                                 "console.log('__dirname', __dirname);"
    //                                 "console.log('__filename', __filename);"
    //                                 "console.log(require('__ejs/debug'));"
    //                                 "console.log(require('__ejs/debug2'));");
    err = ejs_core_run(core, argv[1]);
    if (err)
    {
        puts(duk_safe_to_string(ctx, -1));
        goto END;
    }
    // dispatch event loop
    err = ejs_core_dispatch(core);
    if (err)
    {
        if (err != EJS_ERROR_NO_EVENT)
        {
            puts(ejs_error(err));
            ret = -1;
        }
    }
    else
    {
        ret = -1;
    }

END:
    // delete resources
    ejs_core_delete(core);
    // There is no need to call it, but calling it can clear some global variables to prevent resource leaks that the tool cannot detect.
    libevent_global_shutdown();
    // Clean up tls resources
    mbedtls_psa_crypto_free();
    return ret;
}
