#include "duk.h"
#include "stash.h"

void ejs_dump_context_stdout(duk_context *ctx)
{
    duk_push_context_dump(ctx);
    fprintf(stdout, "%s\n", duk_safe_to_string(ctx, -1));
    duk_pop(ctx);
}
void ejs_throw_cause(duk_context *ctx, EJS_ERROR_RET cause, const char *message)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_ERROR);
    duk_push_string(ctx, message);
    duk_push_object(ctx);
    duk_push_int(ctx, cause);
    duk_put_prop_lstring(ctx, -2, "cause", 5);
    duk_new(ctx, 2);
    duk_throw(ctx);
}
void ejs_throw_cause_format(duk_context *ctx, EJS_ERROR_RET cause, const char *fmt, ...)
{
    va_list ap;

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_ERROR);

    va_start(ap, fmt);
    duk_push_vsprintf(ctx, fmt, ap);
    va_end(ap);
    ejs_dump_context_stdout(ctx);

    duk_push_object(ctx);
    duk_push_int(ctx, cause);
    duk_put_prop_lstring(ctx, -2, "cause", 5);
    duk_new(ctx, 2);
    duk_throw(ctx);
}