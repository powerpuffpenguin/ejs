#include <stdio.h>
#include "ejs/core.h"
#include "ejs/error.h"

int main(int argc, char **argv)
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
    // initialize core code
    duk_ret_t err = ejs_core_new(ctx, argc, argv);

    // if (!core)
    // {
    //     duk_destroy_heap(ctx);
    //     puts(ejs_error(err));
    //     return -1;
    // }
    int ret = 0;

    // err = ejs_core_run(core, argc, argv + 1);
    // if (err)
    // {
    //     puts(ejs_error(err));
    //     ret = -1;
    //     goto END;
    // }

    // dispatch event loop
    // err = ejs_core_dispatch(core);
    // if (err)
    // {
    //     if (err != EJS_ERROR_NO_EVENT)
    //     {
    //         puts(ejs_error(err));
    //         ret = -1;
    //     }
    // }
    // else
    // {
    //     ret = -1;
    // }

END:
    // delete resources
    // ejs_core_delete(core);
    return ret;
}
