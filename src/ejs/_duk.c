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
#include "_duk_timer.h"
#include "js/es6-shim.h"

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
static void join_dir_name(duk_context *ctx)
{
    duk_size_t dir_l;
    const char *dir = duk_require_lstring(ctx, -2, &dir_l);
    duk_size_t name_l;
    const char *name = duk_require_lstring(ctx, -1, &name_l);
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    if ((dir_l && (dir[dir_l - 1] == '/' || dir[dir_l - 1] == '\\')) ||
        (name_l && name[0] == '/' || name_l && name[0] == '\\'))
#else
    if ((dir_l && dir[dir_l - 1] == '/') ||
        (name_l && name[0] == '/'))
#endif
    {
        duk_concat(ctx, 2);
    }
    else
    {
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
        duk_push_lstring(ctx, "\\", 1);
#else
        duk_push_lstring(ctx, "/", 1);
#endif
        duk_swap_top(ctx, -2);
        duk_concat(ctx, 3);
    }
}
typedef struct
{
    const char *path;
    FILE *f;
} read_package_args_t;
static duk_ret_t read_package_impl(duk_context *ctx)
{
    read_package_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    struct stat fsstat;
    if (stat(args->path, &fsstat))
    {
        int err = errno;
        ejs_throw_os_format(ctx, err, "%s: %s", strerror(err), args->path);
    }
    if (!S_ISREG(fsstat.st_mode))
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_MODULE_NO_PACKAGE, "not found package.json: %s", args->path);
    }
    if (fsstat.st_size > 1024 * 128)
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_MODULE_UNKNOW_PACKAGE, "package.json size exceeds  limit(128kb): %s", args->path);
    }

    void *buffer = duk_push_fixed_buffer(ctx, fsstat.st_size);
    FILE *f = fopen(args->path, "r");
    if (!f)
    {
        int err = errno;
        ejs_throw_os_format(ctx, err, "%s: %s", strerror(err), args->path);
    }
    size_t readed = fread(buffer, 1, fsstat.st_size, f);
    fclose(f);
    if (readed != fsstat.st_size)
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_MODULE_READ_FAIL, "an exception occurred while reading the package.json: %s", args->path);
    }
    duk_buffer_to_string(ctx, -1);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_JSON);
    duk_get_prop_lstring(ctx, -1, "parse", 5);
    duk_swap_top(ctx, -3);
    duk_pop_2(ctx);

    duk_swap_top(ctx, -2);
    if (duk_pcall(ctx, 1))
    {
        const char *msg = duk_safe_to_string(ctx, -1);
        ejs_throw_cause_format(ctx, EJS_ERROR_MODULE_UNKNOW_PACKAGE, "%s: %s", args->path, msg);
    }
    else if (!duk_is_object(ctx, -1))
    {
        ejs_throw_cause(ctx, EJS_ERROR_MODULE_UNKNOW_PACKAGE, NULL);
    }
    duk_get_prop_lstring(ctx, -1, "main", 4);
    if (duk_is_string(ctx, -1))
    {
        return 1;
    }
    else if (duk_is_array(ctx, -1) && duk_get_length(ctx, -1) == 1)
    {
        duk_get_prop_index(ctx, -1, 0);
        if (!duk_is_string(ctx, -1))
        {
            ejs_throw_cause(ctx, EJS_ERROR_MODULE_UNKNOW_PACKAGE, NULL);
        }
        return 1;
    }
    duk_pop_2(ctx);
    duk_push_lstring(ctx, "index.js", 8);
    return 1;
}
static void read_package(duk_context *ctx)
{
    EJS_VAR_TYPE(read_package_args_t, args);
    args.path = duk_get_string(ctx, -1);
    duk_ret_t err = ejs_pcall_function(ctx, read_package_impl, &args);
    if (args.f)
    {
        fclose(args.f);
    }
    if (err)
    {
        duk_throw(ctx);
    }
    else
    {
        duk_swap_top(ctx, -2);
        duk_pop(ctx);
    }
}
static duk_ret_t cb_resolve_module_found_file(duk_context *ctx)
{

    const char *path = duk_get_string(ctx, -1);
    struct stat fsstat;
    BOOL allowdir = TRUE;
    if (stat(path, &fsstat))
    {
        int err = errno;
        if (err != ENOENT)
        {
            ejs_throw_os_format(ctx, err, "%s: %s", strerror(err), path);
        }
        duk_size_t len;
        path = duk_get_lstring(ctx, -1, &len);
        duk_size_t n;
        const char *ext = found_ext(path, len, &n);
        if (ext)
        {
            return 0;
        }

        duk_push_lstring(ctx, ".js", 3);
        duk_concat(ctx, 2);
        path = duk_get_string(ctx, -1);
        if (stat(path, &fsstat))
        {
            err = errno;
            if (err != ENOENT)
            {
                err = errno;
                ejs_throw_os_format(ctx, err, "%s: %s", strerror(err), path);
            }
            return 0;
        }
        allowdir = FALSE;
    }

    if (S_ISDIR(fsstat.st_mode))
    {
        if (!allowdir)
        {
            return 0;
        }
        duk_dup_top(ctx);
        duk_push_lstring(ctx, "package.json", 12);
        join_dir_name(ctx);

        read_package(ctx);
        join_dir_name(ctx);
        ejs_filepath_clean(ctx, -1);
        return 1;
    }
    if (!S_ISREG(fsstat.st_mode))
    {
        return 0;
    }
    if (fsstat.st_size > 1024 * 1024 * EJS_CONFIG_MAX_JS_SIZE)
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_LARGE_MODULE, "module size exceeds  limit(%dmb): %s", EJS_CONFIG_MAX_JS_SIZE, path);
    }
    return 1;
}
static duk_ret_t cb_resolve_module_found(duk_context *ctx)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_FOUND);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);
    if (!duk_is_array(ctx, -1))
    {
        return 0;
    }

    duk_size_t count = duk_get_length(ctx, -1);
    for (duk_size_t i = 0; i < count; i++)
    {
        duk_push_c_lightfunc(ctx, cb_resolve_module_found_file, 1, 1, 0);

        duk_get_prop_index(ctx, -2, i);
        duk_dup(ctx, 0);
        join_dir_name(ctx);
        ejs_filepath_clean(ctx, -1);
        duk_swap_top(ctx, -2);
        duk_pop(ctx);

        duk_call(ctx, 1);
        if (duk_is_string(ctx, -1))
        {
            return 1;
        }
        duk_pop(ctx);
    }
    duk_pop(ctx);
    return 0;
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
        return cb_resolve_module_relative(ctx);
    }

    // found native
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_MODULE);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_dup(ctx, -3);
    duk_get_prop(ctx, -2);
    if (duk_is_lightfunc(ctx, -1))
    {
        duk_pop_3(ctx);
        return 1;
    }
    duk_pop_2(ctx);

    // found module js
    duk_pop(ctx);
    duk_ret_t ret = cb_resolve_module_found(ctx);
    if (!ret)
    {
        const char *path = duk_get_string(ctx, 0);
        ejs_throw_cause_format(ctx, EJS_ERROR_MODULE_NOT_EXISTS, "module not exists: %s", path);
    }
    return ret;
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

    // found native
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_MODULE);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_dup(ctx, 0);
    duk_get_prop(ctx, -2);
    if (!duk_is_lightfunc(ctx, -1))
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_INVALID_MODULE_FUNC, NULL);
    }
    duk_swap_top(ctx, 0);

    duk_get_prop_lstring(ctx, 2, "require", 7);
    duk_swap_top(ctx, 2);
    duk_swap(ctx, 1, 2);

    duk_pop_3(ctx);

    duk_call(ctx, 2);
    return 0;
}
void _ejs_init_base(duk_context *ctx)
{
    // console
    duk_console_init(ctx, 0);

    // node module
    duk_push_object(ctx);
    duk_push_c_function(ctx, cb_resolve_module, DUK_VARARGS);
    duk_put_prop_string(ctx, -2, "resolve");
    duk_push_c_function(ctx, cb_load_module, DUK_VARARGS);
    duk_put_prop_string(ctx, -2, "load");
    duk_module_node_init(ctx);
}
void _ejs_init_extras(duk_context *ctx)
{
    // timer
    _ejs_init_timer(ctx);

    // es6 shim
    duk_eval_lstring(ctx, (const char *)js_ejs_js_es6_shim_min_js, js_ejs_js_es6_shim_min_js_len);
    duk_push_global_object(ctx);
    duk_call(ctx, 1);
    duk_pop(ctx);
}