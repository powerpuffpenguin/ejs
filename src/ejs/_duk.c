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

static const char *found_ext(const char *path, duk_size_t len, duk_size_t *n)
{
    char c;
    for (size_t i = 0; i < len; i++)
    {
        c = path[len - 1 - i];
        switch (c)
        {
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
        case '\\':
#endif
        case '/':
            *n = 0;
            return NULL;
        case '.':
        {
            duk_size_t start = len - 1 - i;
            *n = len - start;
            return path + start;
        }
        }
    }
    *n = 0;
    return NULL;
}
static duk_ret_t cb_resolve_module_relative(duk_context *ctx)
{
    /*
     *  Entry stack: [ requested_id parent_id ]
     */

    duk_swap_top(ctx, -2);
    duk_size_t len;
    const char *path = duk_require_lstring(ctx, 0, &len);
    int i = len - 1;
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    while (i >= 0 && path[i] != '\\')
#else
    while (i >= 0 && path[i] != '/')
#endif
    {
        i--;
    }
    if (i < 0)
    {
        ejs_throw_cause(ctx, EJS_ERROR_INVALID_MODULE_NAME, NULL);
    }
    duk_substring(ctx, 0, 0, i + 1);
    duk_concat(ctx, 2);
    ejs_filepath_clean(ctx, -1);

    path = duk_get_string(ctx, -1);
    struct stat fsstat;
    if (stat(path, &fsstat))
    {
        int err = errno;
        if (err != ENOENT)
        {
            ejs_throw_os_format(ctx, err, "%s: %s", strerror(err), path);
        }
        path = duk_get_lstring(ctx, -1, &len);
        duk_size_t n;
        const char *ext = found_ext(path, len, &n);
        if (ext)
        {
            ejs_throw_os_format(ctx, err, "%s: %s", strerror(err), path);
        }

        duk_push_lstring(ctx, ".js", 3);
        duk_concat(ctx, 2);
        path = duk_get_string(ctx, -1);
        if (stat(path, &fsstat))
        {
            err = errno;
            ejs_throw_os_format(ctx, err, "%s: %s", strerror(err), path);
        }
    }
    if (!S_ISREG(fsstat.st_mode))
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_INVALID_MODULE_FILE, "module is not a regular file: %s", path);
    }
    if (fsstat.st_size > 1024 * 1024 * EJS_CONFIG_MAX_JS_SIZE)
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_LARGE_MODULE, "module size exceeds  limit(%dmb): %s", EJS_CONFIG_MAX_JS_SIZE, path);
    }
    return 1;
}
static BOOL is_relative(duk_context *ctx, const char *s, duk_size_t len)
{
    if (len == 0)
    {
        ejs_throw_cause(ctx, EJS_ERROR_INVALID_MODULE_NAME, NULL);
    }
    if (s[0] == '.')
    {
        if (len > 1)
        {
            switch (s[1])
            {
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
            case '\\':
#endif
            case '/':
                return TRUE;
            case '.':
                if (len > 2)
                {
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
                    if (s[2] == '/' || s[2] == '\\')
#else
                    if (s[2] == '/')
#endif
                    {
                        return TRUE;
                    }
                }
                break;
            }
        }
    }
    return FALSE;
}
static duk_ret_t cb_resolve_module(duk_context *ctx)
{
    /*
     *  Entry stack: [ requested_id parent_id ]
     */
    duk_size_t len;
    const char *s = duk_get_lstring(ctx, -2, &len);
    if (is_relative(ctx, s, len))
    {
        cb_resolve_module_relative(ctx);
        return 1;
    }
    // found native
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_MODULE);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_dup(ctx, -3);
    duk_get_prop(ctx, -2);
    if (duk_is_c_function(ctx, -1))
    {
        duk_pop_3(ctx);
        return 1;
    }
    duk_pop_2(ctx);

    // found module js
    ejs_dump_context_stdout(ctx);
    exit(1);
    // // abs
    // EJS_VAR_TYPE(cb_resolve_module_args_t, args);

    // duk_size_t len;
    // const char *s = duk_get_lstring(ctx, -1, &len);
    // ejs_string_set_lstring(&args.parent, s, len);
    // s = duk_get_lstring(ctx, -2, &len);
    // ejs_string_set_lstring(&args.requested, s, len);

    // ejs_call_function(ctx, cb_resolve_module_impl, &args, cb_resolve_module_args_destroy);

    return 1; /*nrets*/
}

static duk_ret_t cb_load_module_js(duk_context *ctx)
{
    const char *path = duk_get_string(ctx, 0);
    struct stat fsstat;
    if (stat(path, &fsstat))
    {
        int err = errno;
        ejs_throw_os_format(ctx, err, "%s: %s", strerror(err), path);
    }
    if (!S_ISREG(fsstat.st_mode))
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_INVALID_MODULE_FILE, "module is not a regular file: %s", path);
    }
    if (fsstat.st_size == 0)
    {
        duk_push_lstring(ctx, "", 0);
        return 1;
    }
    if (fsstat.st_size > 1024 * 1024 * EJS_CONFIG_MAX_JS_SIZE)
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_LARGE_MODULE, "module size exceeds  limit(%dmb): %s", EJS_CONFIG_MAX_JS_SIZE, path);
    }

    void *buffer = duk_push_fixed_buffer(ctx, fsstat.st_size);
    FILE *f = fopen(path, "r");
    if (!f)
    {
        int err = errno;
        ejs_throw_os_format(ctx, err, "%s: %s", strerror(err), path);
    }
    size_t readed = fread(buffer, 1, fsstat.st_size, f);
    fclose(f);
    if (readed != fsstat.st_size)
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_MODULE_READ_FAIL, "an exception occurred while reading the module: %s", path);
    }
    duk_buffer_to_string(ctx, -1);
    return 1;
}
static duk_ret_t cb_load_module(duk_context *ctx)
{
    puts("--------cb_load_module");
    ejs_dump_context_stdout(ctx);
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

    if (ejs_filepath_is_abs(ctx, 0))
    {
        duk_pop_2(ctx);
        return cb_load_module_js(ctx);
    }
    puts("not abs");
    exit(1);
    // // load external module
    // duk_pop_2(ctx);
    // duk_ret_t ret = cb_load_module_js(ctx);

    // ejs_dump_context_stdout(ctx);

    return 0; /*nrets*/
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
