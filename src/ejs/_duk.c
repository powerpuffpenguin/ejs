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

typedef struct
{
    void *path;
    void *dir;
    void *join;
} cb_resolve_module_args_t;
static duk_ret_t cb_resolve_module_impl(duk_context *ctx)
{
    cb_resolve_module_args_t *args = (cb_resolve_module_args_t *)duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_size_t len;
    const char *c = duk_get_lstring(ctx, 0, &len);
    if (!len)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "require('') invalid");
        duk_throw(ctx);
    }
    EJS_CONST_LSTRING(requested_id, c, len);
    EJS_CONST_LSTRING(path, "", 0);
    ejs_stirng_reference_t reference;
    ejs_dump_context_stdout(ctx);
    duk_ret_t err = ejs_path_clean(&requested_id, &path, &reference);
    if (err)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, ejs_error(err));
        duk_throw(ctx);
    }
    if (path.reference)
    {
        args->path = path.reference->c;
    }
    // native module
    if (('a' <= path.c[0] & path.c[0] <= 'z') || ('A' <= path.c[0] & path.c[0] <= 'Z'))
    {
        duk_push_lstring(ctx, path.c, path.len);
        return 1;
    }

    c = duk_get_lstring(ctx, 1, &len);
    // no parent
    if (!len)
    {
        duk_push_lstring(ctx, path.c, path.len);
        return 1;
    }
    EJS_CONST_LSTRING(parent_id, c, len);
    EJS_CONST_LSTRING(dir, "", 0);
    ejs_path_dir(&parent_id, &dir);
    ejs_stirng_reference_t reference_dir;
    EJS_CONST_LSTRING(clean_dir, "", 0);
    err = ejs_path_clean(&dir, &clean_dir, &reference_dir);
    if (err)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, ejs_error(err));
        duk_throw(ctx);
    }
    if (clean_dir.reference)
    {
        args->dir = clean_dir.reference->c;
    }

    // join
    ejs_string_t *elem[2];
    elem[0] = &clean_dir;
    elem[1] = &path;
    EJS_CONST_LSTRING(join, "", 0);
    ejs_stirng_reference_t reference_join;
    err = ejs_path_join(elem, 2, &join, &reference_join);
    if (err)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, ejs_error(err));
        duk_throw(ctx);
    }
    if (join.reference)
    {
        args->dir = join.reference->c;
    }
    duk_push_lstring(ctx, join.c, join.len);
    return 1;
}
static duk_ret_t cb_resolve_module(duk_context *ctx)
{
    EJS_VAR_TYPE(cb_resolve_module_args_t, args);

    duk_push_pointer(ctx, &args);

    duk_idx_t ret = duk_get_top(ctx);
    duk_push_c_lightfunc(ctx, cb_resolve_module_impl, ret, ret, 0);
    duk_insert(ctx, 0);

    ret = duk_pcall(ctx, ret);
    EJS_VAR_FREE(args.path);
    EJS_VAR_FREE(args.dir);
    EJS_VAR_FREE(args.join);

    if (ret)
    {
        duk_throw(ctx);
    }
    // ejs_dump_context_stdout(ctx);
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
