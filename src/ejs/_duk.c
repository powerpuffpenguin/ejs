#include "_duk.h"
#include "strings.h"
#include "path.h"
#include "core.h"
#include "../duk/duk_console.h"
#include "../duk/duk_module_node.h"
#include <stdio.h>
#include <sys/stat.h>
#include "config.h"
#include "duk.h"
#include "stash.h"

typedef struct
{
    ejs_string_t requested;
    ejs_string_t parent;
    ejs_string_t resolved;
    ejs_stirng_reference_t r;
} cb_resolve_module_args_t;
void cb_resolve_module_args_destroy(cb_resolve_module_args_t *args)
{
    if (args->resolved.reference)
    {
        // EJS_STRING_DESTROY
    }
}
static duk_ret_t cb_resolve_module_impl(duk_context *ctx)
{
    cb_resolve_module_args_t *args = (cb_resolve_module_args_t *)duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    ejs_string_println(&args->parent);
    ejs_string_println(&args->requested);

    ejs_path_split(&args->parent, &args->parent, NULL);

    ejs_string_t *s[2] = {&args->parent, &args->requested};
    EJS_ERROR_RET err = ejs_path_join(s, 2, &args->resolved, &args->r);
    if (err)
    {
        ejs_throw_os(ctx, err, ejs_error(err));
    }

    duk_push_lstring(ctx, args->resolved.c, args->resolved.len);
    return 1;
}
static duk_ret_t cb_resolve_module(duk_context *ctx)
{
    /*
     *  Entry stack: [ requested_id parent_id ]
     */

    // found native
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_MODULE);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_dup(ctx, -2);
    duk_get_prop(ctx, -2);

    if (duk_is_c_function(ctx, -1))
    {
        duk_pop_3(ctx);
        return 1;
    }
    duk_pop_2(ctx);

    // abs
    EJS_VAR_TYPE(cb_resolve_module_args_t, args);

    duk_size_t len;
    const char *s = duk_get_lstring(ctx, -1, &len);
    ejs_string_set_lstring(&args.parent, s, len);
    s = duk_get_lstring(ctx, -2, &len);
    ejs_string_set_lstring(&args.requested, s, len);

    ejs_call_function(ctx, cb_resolve_module_impl, &args, NULL);
    ejs_dump_context_stdout(ctx);
    exit(1);
    return 1; /*nrets*/
}

static duk_ret_t cb_load_module_js(duk_context *ctx)
{
    const char *path = duk_get_string(ctx, 0);
    struct stat fsstat;
    if (stat(path, &fsstat))
    {
        int err = errno;
        if (err != ENOENT)
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "stat error(%d) %s: %s", err, strerror(err), path);
            duk_throw(ctx);
        }
        duk_size_t len = 0;
        path = duk_get_lstring(ctx, 0, &len);
        if (len >= 3 && !memcmp(path + len - 3, ".js", 3))
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "stat error(%d) %s: %s", err, strerror(err), path);
            duk_throw(ctx);
        }

        duk_pop(ctx);
        duk_push_string(ctx, ".js");
        duk_concat(ctx, 2);

        path = duk_get_string(ctx, 0);
        if (stat(path, &fsstat))
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "stat error(%d) %s: %s", err, strerror(err), path);
            duk_throw(ctx);
        }
    }

    if (!S_ISREG(fsstat.st_mode))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "not a  regular file: %s", path);
        duk_throw(ctx);
    }
    if (fsstat.st_size == 0)
    {
        duk_push_lstring(ctx, "", 0);
        return 1;
    }
    else if (fsstat.st_size > 1024 * 1024 * EJS_CONFIG_MAX_JS_SIZE)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "The maximum module file size is %dm", EJS_CONFIG_MAX_JS_SIZE);
        duk_throw(ctx);
    }

    void *buffer = duk_push_fixed_buffer(ctx, fsstat.st_size);
    FILE *f = fopen(path, "r");
    if (!f)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "fopen(%d) %s: %s", errno, strerror(errno), path);
        duk_throw(ctx);
    }
    size_t readed = fread(buffer, 1, fsstat.st_size, f);
    fclose(f);
    if (readed != fsstat.st_size)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "short read file(%d <%d): %s", readed, fsstat.st_size, path);
        duk_throw(ctx);
    }
    duk_buffer_to_string(ctx, -1);
    return 1;
}
static duk_ret_t cb_load_module(duk_context *ctx)
{
    puts("--------cb_load_module");
    /*
     *  Entry stack: [ resolved_id exports module ]
     */

    /* Arrive at the JS source code for the module somehow. */
    size_t len;
    const char *id = duk_get_lstring(ctx, 0, &len);
    if (len == 0)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "resolved_id invalid");
        duk_throw(ctx);
    }

    // load native module
    if (('a' <= id[0] & id[0] <= 'z') || ('A' <= id[0] & id[0] <= 'Z'))
    {
    }

    // load external module
    duk_pop_2(ctx);
    duk_ret_t ret = cb_load_module_js(ctx);

    ejs_dump_context_stdout(ctx);

    return ret; /*nrets*/
}
void _ejs_init(duk_context *ctx)
{
    duk_console_init(ctx, 0);

    duk_push_object(ctx);
    duk_push_c_function(ctx, cb_resolve_module, DUK_VARARGS);
    duk_put_prop_string(ctx, -2, "resolve");
    duk_push_c_function(ctx, cb_load_module, DUK_VARARGS);
    duk_put_prop_string(ctx, -2, "load");
    duk_module_node_init(ctx);
}
