#include "_duk_test.h"
#include <stdio.h>
#include "duk.h"
typedef struct
{
    int a, b;
} async_add_t;
static void async_add_worker(void *userdata)
{
    puts("async_add_worker");
}
static void async_add_return(void *userdata)
{
    puts("async_add_return");
}
static duk_ret_t async_test(duk_context *ctx)
{

    int a = duk_require_int(ctx, 0);
    int b = duk_require_int(ctx, 1);

    ejs_async_post(ctx, async_add_worker, async_add_return, 0);

    // ejs_async_post(ctx,)
    return 0;
}
duk_ret_t _ejs_native_test_init(duk_context *ctx)
{
    /*
     *  Entry stack: [ require exports ]
     */

    duk_push_c_lightfunc(ctx, async_test, 2, 2, 0);
    duk_put_prop_lstring(ctx, -2, "add", 3);

    return 0;
}