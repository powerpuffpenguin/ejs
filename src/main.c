#include <stdio.h>
#include "ejs/core.h"
#include "ejs/utils.h"
#include "ejs/error.h"

int main(int argc, const char **argv)
{
    if (argc < 2)
    {
        printf("no\n");
        return 0;
    }
    size_t n = strlen(argv[1]);
    if (n > 0 && argv[1][0] == '-')
    {
        printf("flags\n");
        return 0;
    }

    // create js execution environment
    duk_context *ctx = duk_create_heap_default();
    if (!ctx)
    {
        puts("duk_create_heap_default fail");
        return -1;
    }

    // set options
    EJS_VAR_TYPE(ejs_core_options_t, opts);
    // process startup parameters
    opts.argc = argc;
    opts.argv = argv;
    // module search path
    const char *modulev[] = {"node_modules"};
    opts.modulec = sizeof(modulev) / sizeof(const char *);
    opts.modulev = modulev;

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

    // run main.js
    // err = ejs_core_run_source(core, "console.log('ok',__dirname,__filename);require('./ab/../a0')");
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
    return ret;
}
