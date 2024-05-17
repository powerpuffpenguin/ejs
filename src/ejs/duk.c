#include "config.h"
#include "duk.h"
#include "stash.h"
#include "defines.h"
#include "strings.h"
#include "path.h"

#include <errno.h>
#include <unistd.h>

DUK_EXTERNAL void ejs_dump_context_stdout(duk_context *ctx)
{
    duk_push_context_dump(ctx);
    fprintf(stdout, "%s\n", duk_safe_to_string(ctx, -1));
    duk_pop(ctx);
}
DUK_EXTERNAL void ejs_throw_cause(duk_context *ctx, EJS_ERROR_RET cause, const char *message)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_ERROR);
    duk_push_string(ctx, message ? message : ejs_error(cause));
    duk_push_object(ctx);
    duk_push_int(ctx, cause);
    duk_put_prop_lstring(ctx, -2, "cause", 5);
    duk_new(ctx, 2);
    duk_throw(ctx);
}
DUK_EXTERNAL void ejs_throw_cause_format(duk_context *ctx, EJS_ERROR_RET cause, const char *fmt, ...)
{
    va_list ap;

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_ERROR);

    va_start(ap, fmt);
    duk_push_vsprintf(ctx, fmt, ap);
    va_end(ap);

    duk_push_object(ctx);
    duk_push_int(ctx, cause);
    duk_put_prop_lstring(ctx, -2, "cause", 5);
    duk_new(ctx, 2);
    duk_throw(ctx);
}
DUK_EXTERNAL void ejs_throw_os(duk_context *ctx, int err, const char *message)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_OS_ERROR);
    duk_push_int(ctx, err);
    if (message)
    {
        duk_push_string(ctx, message);
    }
    else
    {
        duk_push_string(ctx, strerror(err));
    }
    duk_new(ctx, 2);
    duk_throw(ctx);
}
DUK_EXTERNAL void ejs_throw_os_errno(duk_context *ctx)
{
    int err = errno;
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_OS_ERROR);
    duk_push_int(ctx, err);
    duk_push_string(ctx, strerror(err));
    duk_new(ctx, 2);
    duk_throw(ctx);
}
DUK_EXTERNAL void ejs_throw_os_format(duk_context *ctx, int err, const char *fmt, ...)
{
    va_list ap;

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS_OS_ERROR);
    duk_push_int(ctx, err);

    va_start(ap, fmt);
    duk_push_vsprintf(ctx, fmt, ap);
    va_end(ap);

    duk_throw(ctx);
}
DUK_EXTERNAL duk_bool_t ejs_filepath_is_abs(duk_context *ctx, duk_idx_t idx)
{
    size_t len;
    const char *s = duk_require_lstring(ctx, idx, &len);
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    if (len > 1 &&
        s[1] == ':' &&
        (('a' <= s[0] && s[0] <= 'z') ||
         ('A' <= s[0] && s[0] <= 'Z')) &&
        (len == 2 || s[2] == '\\' || s[2] == '/'))
#else
    if (len > 0 && s[0] == '/')
#endif
    {
        return TRUE;
    }
    return FALSE;
}
DUK_EXTERNAL void ejs_call_function(duk_context *ctx, duk_c_function func, void *args, ejs_finally_function finally_func)
{
    duk_push_c_lightfunc(ctx, func, 1, 1, 0);
    duk_push_pointer(ctx, args);
    duk_ret_t err = duk_pcall(ctx, 1);
    if (finally_func)
    {
        finally_func(args);
    }
    if (err)
    {
        duk_throw(ctx);
    }
}
/**
 * * ok  ... -> ...
 * * err  exit(1)
 */
DUK_EXTERNAL void ejs_call_callback(duk_context *ctx,
                                    duk_c_function func, void *args,
                                    ejs_finally_function finally_func)
{
    duk_push_c_lightfunc(ctx, func, 1, 1, 0);
    duk_push_pointer(ctx, args);
    duk_ret_t err = duk_pcall(ctx, 1);
    if (finally_func)
    {
        finally_func(args);
    }
    if (err)
    {
        puts(duk_safe_to_string(ctx, -1));
        exit(1);
    }
}
DUK_EXTERNAL void ejs_call_callback_noresult(duk_context *ctx,
                                             duk_c_function func, void *args,
                                             ejs_finally_function finally_func)
{
    ejs_call_callback(ctx, func, args, finally_func);
    duk_pop(ctx);
}
DUK_EXTERNAL duk_int_t ejs_pcall_function(duk_context *ctx,
                                          duk_c_function func, void *args)
{
    duk_push_c_lightfunc(ctx, func, 1, 1, 0);
    duk_push_pointer(ctx, args);
    return duk_pcall(ctx, 1);
}
DUK_EXTERNAL duk_int_t ejs_pcall_function_n(duk_context *ctx,
                                            duk_c_function func, void *args, duk_idx_t n)
{
    duk_push_c_lightfunc(ctx, func, n, n, 0);
    switch (n)
    {
    case 1:
        break;
    case 2:
        duk_swap_top(ctx, -2);
        break;
    default:
        duk_insert(ctx, -n);
        break;
    }
    duk_push_pointer(ctx, args);
    return duk_pcall(ctx, n);
}
typedef struct
{
    ejs_string_t path_s;
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    ejs_stirng_reference_t path_windows_r0;
    ejs_stirng_reference_t path_windows_r1;
#endif
    ejs_stirng_reference_t out_r;
} ejs_filepath_clean_args_t;
static void ejs_filepath_clean_args_destroy(ejs_filepath_clean_args_t *args)
{
    EJS_STRING_DESTROY(&args->path_s);
}
static duk_ret_t ejs_filepath_clean_impl(duk_context *ctx)
{
    ejs_filepath_clean_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    EJS_ERROR_RET err = ejs_path_from_windows(&args->path_s, &args->path_s, &args->path_windows_r0);
    if (err)
    {
        ejs_throw_cause(ctx, err, NULL);
    }
    char root[2];
    BOOL abs = ejs_path_is_windows_abs(&args->path_s);
    if (abs)
    {
        root[0] = args->path_s.c[0];
        root[1] = args->path_s.c[1];
        args->path_s.c += 2;
        args->path_s.len -= 2;
    }
#else
    EJS_ERROR_RET err;
#endif
    err = ejs_path_clean(&args->path_s, &args->path_s, &args->out_r);
    if (err)
    {
        ejs_throw_cause(ctx, err, NULL);
    }
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    if (abs)
    {
        if (args->path_s.len == 1 && (args->path_s.c[0] == '.' || args->path_s.c[0] == '/'))
        {
            duk_push_lstring(ctx, args->path_s.c - 2, 2);
            return 1;
        }
        err = ejs_path_to_windows(&args->path_s, &args->path_s, &args->path_windows_r1);
        if (err)
        {
            ejs_throw_cause(ctx, err, NULL);
        }

        duk_push_lstring(ctx, root, 2);
        duk_push_lstring(ctx, args->path_s.c, args->path_s.len);
        duk_concat(ctx, 2);
    }
    else
    {
        err = ejs_path_to_windows(&args->path_s, &args->path_s, &args->path_windows_r1);
        if (err)
        {
            ejs_throw_cause(ctx, err, NULL);
        }
        duk_push_lstring(ctx, args->path_s.c, args->path_s.len);
    }
#else
    duk_push_lstring(ctx, args->path_s.c, args->path_s.len);
#endif
    return 1;
}
DUK_EXTERNAL void ejs_filepath_clean(duk_context *ctx, duk_idx_t idx)
{
    EJS_VAR_TYPE(ejs_filepath_clean_args_t, args);
    args.path_s.c = (char *)duk_require_lstring(ctx, idx, &args.path_s.len);
    ejs_call_function(ctx,
                      ejs_filepath_clean_impl, &args,
                      (ejs_finally_function)ejs_filepath_clean_args_destroy);
}

typedef struct
{
    const char *path;
    size_t len;
    ejs_string_t dir_s;
    ejs_stirng_reference_t dir_r;
} ejs_filepath_abs_args_t;
static void ejs_filepath_abs_args_destroy(ejs_filepath_abs_args_t *args)
{
    EJS_STRING_DESTROY(&args->dir_s);
}
static duk_ret_t ejs_filepath_abs_impl(duk_context *ctx)
{
    ejs_filepath_abs_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    char *dir = malloc(MAXPATHLEN);
    if (!dir)
    {
        ejs_throw_os(ctx, errno, strerror(errno));
    }
    args->dir_r.c = dir;
    args->dir_r.len = MAXPATHLEN;
    args->dir_r.used = 1;

    args->dir_s.c = dir;
    args->dir_s.len = 0;
    args->dir_s.reference = &args->dir_r;
    if (!getcwd(dir, MAXPATHLEN))
    {
        ejs_throw_cause_format(ctx, EJS_ERROR_GETCWD, "getcwd error(%d): %s", errno, strerror(errno));
    }
    args->dir_s.len = strlen(dir);
    if (!args->len)
    {
        duk_push_lstring(ctx, args->dir_s.c, args->dir_s.len);
        return 1;
    }

#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
    BOOL sp = args->path[0] == '/' ||
              args->path[0] == '\\' ||
              (args->dir_s.len > 0 &&
               (args->dir_s.c[args->dir_s.len - 1] == '/' || args->dir_s.c[args->dir_s.len - 1] == '\\'));
#else
    BOOL sp = args->path[0] == '/' || (args->dir_s.len > 0 && args->dir_s.c[args->dir_s.len - 1] == '/');
#endif
    size_t size = args->dir_s.len + (sp ? 0 : 1) + args->len;
    if (size <= MAXPATHLEN)
    {
        if (sp)
        {
            memmove(dir + args->dir_s.len, args->path, args->len);
            args->dir_s.len += args->len;
        }
        else
        {
            dir[args->dir_s.len] = '/';
            memmove(dir + args->dir_s.len + 1, args->path, args->len);
            args->dir_s.len += args->len + 1;
        }
        duk_push_lstring(ctx, dir, args->dir_s.len);
        EJS_STRING_DESTROY(&args->dir_s);
    }
    else
    {
        if (sp)
        {
            duk_push_lstring(ctx, args->dir_s.c, args->dir_s.len);
            duk_push_lstring(ctx, args->path, args->len);
            duk_concat(ctx, 2);
        }
        else
        {
            duk_push_lstring(ctx, args->dir_s.c, args->dir_s.len);
            duk_push_lstring(ctx, "/", 1);
            duk_push_lstring(ctx, args->path, args->len);
            duk_concat(ctx, 3);
        }
    }

    ejs_filepath_clean(ctx, -1);
    return 1;
}
DUK_EXTERNAL void ejs_filepath_abs(duk_context *ctx, duk_idx_t idx)
{
    if (ejs_filepath_is_abs(ctx, idx))
    {
        ejs_filepath_clean(ctx, idx);
        return;
    }
    EJS_VAR_TYPE(ejs_filepath_abs_args_t, args);
    args.path = (char *)duk_require_lstring(ctx, idx, &args.len);
    ejs_call_function(ctx,
                      ejs_filepath_abs_impl, &args,
                      (ejs_finally_function)ejs_filepath_abs_args_destroy);
}

DUK_EXTERNAL void *ejs_stash_put_pointer(duk_context *ctx, const char *key, duk_size_t key_len)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    void *p = duk_require_pointer(ctx, -1);
    if (!p)
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "ejs_stash_put_pointer expects -> {p:pointer}");
        duk_throw(ctx);
    }

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, key, key_len);
    if (!duk_is_object(ctx, -1))
    {
        duk_pop(ctx);
        duk_push_object(ctx);
        duk_dup_top(ctx);
        duk_put_prop_lstring(ctx, -3, key, key_len);
    }
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    //  ... val key {}
    duk_swap_top(ctx, -2);
    duk_dup(ctx, -3);
    duk_put_prop(ctx, -3);

    // ... val {key:val}
    duk_pop(ctx);
    return p;
}
DUK_EXTERNAL void *ejs_stash_delete_pointer(duk_context *ctx,
                                            duk_bool_t clear_finalizer,
                                            const char *key, duk_size_t key_len)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    void *p = duk_get_pointer_default(ctx, -1, 0);
    if (!p)
    {
        return 0;
    }
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, key, key_len);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_swap_top(ctx, -2);
    duk_get_prop(ctx, -2);
    if (!duk_equals(ctx, -1, -3))
    {
        return 0;
    }
    duk_pop(ctx);

    duk_push_pointer(ctx, p);
    duk_del_prop(ctx, -2);
    if (clear_finalizer)
    {
        duk_set_finalizer(ctx, -2);
    }
    else
    {
        duk_pop(ctx);
    }
    return p;
}
static duk_bool_t _ejs_stash_get_pointer(duk_context *ctx,
                                         void *pointer,
                                         const char *key, duk_size_t key_len,
                                         duk_bool_t pop)
{
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, key, key_len);
    if (!duk_is_object(ctx, -1))
    {
        duk_pop_2(ctx);
        return 0;
    }
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    // {}
    duk_push_pointer(ctx, pointer);
    duk_get_prop(ctx, -2);
    // {} val
    if (!duk_is_object(ctx, -1))
    {
        duk_pop_2(ctx);
        return 0;
    }
    duk_swap_top(ctx, -2);
    // val {}
    if (pop)
    {
        duk_get_prop_lstring(ctx, -2, "p", 1);
        if (duk_get_pointer_default(ctx, -1, 0) != pointer)
        {
            duk_pop_3(ctx);
            return 0;
        }
        // val {} key
        duk_del_prop(ctx, -2);
        duk_pop(ctx);
    }
    else
    {
        duk_pop(ctx);
        // val
        duk_get_prop_lstring(ctx, -1, "p", 1);
        if (duk_get_pointer_default(ctx, -1, 0) != pointer)
        {
            duk_pop_2(ctx);
            return 0;
        }
        duk_pop(ctx);
    }
    return 1;
}
DUK_EXTERNAL duk_bool_t ejs_stash_get_pointer(duk_context *ctx,
                                              void *pointer,
                                              const char *key, duk_size_t key_len)
{
    return _ejs_stash_get_pointer(ctx, pointer, key, key_len, 0);
}
DUK_EXTERNAL duk_bool_t ejs_stash_pop_pointer(duk_context *ctx,
                                              void *pointer,
                                              const char *key, duk_size_t key_len)
{
    return _ejs_stash_get_pointer(ctx, pointer, key, key_len, 1);
}
DUK_EXTERNAL void ejs_stash_set_module_destroy(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "module_destroy", 14);
    if (!duk_is_function(ctx, -1))
    {
        duk_pop(ctx);
        return;
    }
    duk_del_prop_lstring(ctx, -2, "module_destroy", 14);
    // ... exports cb
    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_MODULE_DESTROY);
    if (!duk_is_array(ctx, -1))
    {
        duk_pop(ctx);
        duk_push_array(ctx);
        duk_dup_top(ctx);
        duk_put_prop_lstring(ctx, -3, EJS_STASH_MODULE_DESTROY);
    }
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    // ... exports cb []
    duk_swap_top(ctx, -2);
    duk_put_prop_index(ctx, -2, duk_get_length(ctx, -2));

    duk_pop(ctx);
}
DUK_EXTERNAL duk_ret_t ejs_default_finalizer(duk_context *ctx)
{
    duk_get_prop_lstring(ctx, -1, "p", 1);
    void *p = duk_get_pointer_default(ctx, -1, 0);
    if (p)
    {
        free(p);
    }
    return 0;
}