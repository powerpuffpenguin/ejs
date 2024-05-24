#include "_duk_test.h"
#include <stdio.h>
#include "duk.h"
typedef struct
{
    int a, b;
    int sum;
} async_add_t;
static void async_add_worker(void *userdata)
{
    async_add_t *opts = userdata;
    printf("async_add_worker %d %d\n", opts->a, opts->b);
    opts->sum = opts->a + opts->b;
}
static duk_ret_t async_add_return(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    async_add_t *opts = duk_get_pointer(ctx, -1);
    printf("async_add_return %d\n", opts->sum);
    return 0;
}
static duk_ret_t async_test(duk_context *ctx)
{
    int a = duk_require_int(ctx, 0);
    int b = duk_require_int(ctx, 1);
    duk_pop_2(ctx);

    async_add_t *add = ejs_new_finalizer_object(ctx, sizeof(async_add_t), 0);
    add->a = a;
    add->b = b;

    if (duk_get_boolean_default(ctx, 2, 0))
    {
        ejs_async_cb_send(ctx, async_add_worker, async_add_return);
    }
    else
    {
        ejs_async_cb_post(ctx, async_add_worker, async_add_return);
    }
    return 0;
}

duk_ret_t _ejs_native_test_init(duk_context *ctx)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_push_c_lightfunc(ctx, async_test, 3, 3, 0);
    duk_put_prop_lstring(ctx, -2, "add", 3);

    return 0;
}