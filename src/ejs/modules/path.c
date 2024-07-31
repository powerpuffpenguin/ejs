#include "modules_shared.h"
#include "../js/path.h"

static void return_string_or_uint8array(
    duk_context *ctx,
    duk_bool_t is_string,
    const uint8_t *s, duk_size_t s_len,
    const uint8_t *out, duk_size_t out_len)
{
    if (is_string)
    {
        if (out_len == s_len && out == s)
        {
            duk_pop(ctx);
        }
        else
        {
            duk_push_lstring(ctx, out, out_len);
        }
    }
    else if (out == s)
    {
        if (out_len == s_len)
        {
            duk_pop(ctx);
        }
        else
        {
            duk_swap_top(ctx, -2);
            duk_push_number(ctx, 0);
            duk_push_number(ctx, out_len);
            duk_call(ctx, 3);
        }
    }
    else
    {
        memcpy(duk_push_fixed_buffer(ctx, out_len), out, out_len);
    }
}
static duk_ret_t base(duk_context *ctx)
{
    duk_size_t s_len;
    duk_bool_t is_string = duk_is_string(ctx, 0);
    const uint8_t *s = is_string ? duk_require_lstring(ctx, 0, &s_len) : duk_require_buffer_data(ctx, 0, &s_len);

    ppp_c_fast_string_t output;
    ppp_c_path_base_raw(&output, s, s_len);
    return_string_or_uint8array(ctx, is_string, s, s_len, output.str, output.len);
    return 1;
}
typedef struct
{
    uint8_t *p;
} clean_args_t;
static duk_ret_t clean_impl(duk_context *ctx)
{
    clean_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_size_t s_len;
    duk_bool_t is_string = duk_is_string(ctx, 0);
    const uint8_t *s = is_string ? duk_require_lstring(ctx, 0, &s_len) : duk_require_buffer_data(ctx, 0, &s_len);

    ppp_c_string_t path = {
        .str = (char *)s,
        .len = s_len,
        .cap = 0,
    };
    if (ppp_c_path_clean(&path))
    {
        ejs_throw_os_errno(ctx);
    }
    if (path.cap)
    {
        args->p = path.str;
        return_string_or_uint8array(ctx, is_string, s, s_len, path.str, path.len);
        args->p = 0;
        free(path.str);
    }
    else
    {
        return_string_or_uint8array(ctx, is_string, s, s_len, path.str, path.len);
    }
    return 1;
}
static duk_ret_t clean(duk_context *ctx)
{
    clean_args_t args = {0};
    if (ejs_pcall_function_n(ctx, clean_impl, &args, 3))
    {
        if (args.p)
        {
            free(args.p);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t dir_impl(duk_context *ctx)
{
    clean_args_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_size_t s_len;
    duk_bool_t is_string = duk_is_string(ctx, 0);
    const uint8_t *s = is_string ? duk_require_lstring(ctx, 0, &s_len) : duk_require_buffer_data(ctx, 0, &s_len);

    ppp_c_fast_string_t dir = {0};
    ppp_c_path_split_raw(s, s_len, &dir, 0);
    ppp_c_string_t path = {
        .str = (char *)dir.str,
        .len = dir.len,
        .cap = 0,
    };
    if (ppp_c_path_clean(&path))
    {
        ejs_throw_os_errno(ctx);
    }
    if (path.cap)
    {
        args->p = path.str;
        return_string_or_uint8array(ctx, is_string, s, s_len, path.str, path.len);
        args->p = 0;
        free(path.str);
    }
    else
    {
        return_string_or_uint8array(ctx, is_string, s, s_len, path.str, path.len);
    }
    return 1;
}
static duk_ret_t dir(duk_context *ctx)
{
    clean_args_t args = {0};
    if (ejs_pcall_function_n(ctx, dir_impl, &args, 3))
    {
        if (args.p)
        {
            free(args.p);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t ext(duk_context *ctx)
{
    duk_size_t s_len;
    duk_bool_t is_string = duk_is_string(ctx, 0);
    const uint8_t *s = is_string ? duk_require_lstring(ctx, 0, &s_len) : duk_require_buffer_data(ctx, 0, &s_len);

    ppp_c_fast_string_t output;
    ppp_c_path_ext_raw(&output, s, s_len);
    return_string_or_uint8array(ctx, is_string, s, s_len, output.str, output.len);
    return 1;
}
static duk_ret_t isAbs(duk_context *ctx)
{
    duk_size_t s_len;
    const uint8_t *s = EJS_REQUIRE_CONST_LSOURCE(ctx, 0, &s_len);

    BOOL ok = ppp_c_path_is_abs_raw(s, s_len);
    duk_pop(ctx);

    if (ok)
    {
        duk_push_true(ctx);
    }
    else
    {
        duk_push_false(ctx);
    }
    return 1;
}
typedef struct
{
    ppp_c_string_t output;
} join_args_t;
typedef struct
{
    duk_context *ctx;
    duk_size_t i;
    duk_size_t n;
} join_iteratorable_t;
static void join_iteratorable_reset(void *p)
{
    ((join_iteratorable_t *)p)->i = 0;
}
static void join_iteratorable_next(void *p, ppp_c_string_iterator_t *iterator)
{
    join_iteratorable_t *state = p;
    if (state->i < state->n)
    {
        duk_size_t s_len;
        duk_get_prop_index(state->ctx, 0, state->i++);
        if (duk_is_string(state->ctx, -1))
        {
            iterator->str = duk_require_lstring(state->ctx, -1, &s_len);
        }
        else
        {
            iterator->str = duk_require_buffer_data(state->ctx, -1, &s_len);
        }
        iterator->len = s_len;
        iterator->ok = 1;
        duk_pop(state->ctx);
    }
    else
    {
        iterator->ok = 0;
    }
}
static duk_ret_t join_impl(duk_context *ctx)
{
    join_args_t *args = duk_require_pointer(ctx, -1);
    duk_bool_t toBuffer = duk_is_undefined(ctx, -2) ? 0 : 1;
    duk_pop_2(ctx);

    join_iteratorable_t state = {
        .ctx = ctx,
        .i = 0,
        .n = duk_get_length(ctx, 0),
    };
    ppp_c_string_iteratorable_t iteratorable = {
        .state = &state,
        .reset = join_iteratorable_reset,
        .next = join_iteratorable_next,
    };
    if (ppp_c_path_join(&args->output, &iteratorable))
    {
        ejs_throw_os_errno(ctx);
    }
    if (toBuffer)
    {
        memcpy(duk_push_fixed_buffer(ctx, args->output.len), args->output.str, args->output.len);
    }
    else
    {
        duk_push_lstring(ctx, args->output.str, args->output.len);
    }
    if (args->output.cap)
    {
        free(args->output.str);
        args->output.cap = 0;
    }
    return 1;
}
static duk_ret_t join(duk_context *ctx)
{
    join_args_t args = {0};
    if (ejs_pcall_function_n(ctx, join_impl, &args, 3))
    {
        if (args.output.cap)
        {
            free(args.output.str);
        }
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t split(duk_context *ctx)
{
    duk_size_t s_len;
    duk_bool_t is_string = duk_is_string(ctx, 0);
    const uint8_t *s = is_string ? duk_require_lstring(ctx, 0, &s_len) : duk_require_buffer_data(ctx, 0, &s_len);

    size_t i = ppp_c_stirng_last_char_raw(s, s_len, '/');
    if (i == -1)
    {
        if (is_string)
        {
            duk_pop(ctx);

            duk_push_array(ctx);
            duk_push_lstring(ctx, "", 0);
            duk_put_prop_index(ctx, -2, 0);
            duk_swap_top(ctx, -2);
            duk_put_prop_index(ctx, -2, 1);
        }
        else
        {
            duk_dup(ctx, 0);
            duk_push_number(ctx, 0);
            duk_push_number(ctx, 0);
            duk_call(ctx, 3);

            duk_push_array(ctx);
            duk_swap_top(ctx, -2);
            duk_put_prop_index(ctx, -2, 0);
            duk_swap_top(ctx, -2);
            duk_put_prop_index(ctx, -2, 1);
        }
        return 1;
    }
    i++;
    if (i == s_len)
    {

        if (is_string)
        {
            duk_pop(ctx);

            duk_push_array(ctx);
            duk_swap_top(ctx, -2);
            duk_put_prop_index(ctx, -2, 0);
            duk_push_lstring(ctx, "", 0);
            duk_put_prop_index(ctx, -2, 1);
        }
        else
        {
            duk_dup(ctx, 0);
            duk_push_number(ctx, i);
            duk_push_number(ctx, i);
            duk_call(ctx, 3);

            duk_push_array(ctx);
            duk_swap_top(ctx, -3);
            duk_put_prop_index(ctx, -3, 0);
            duk_put_prop_index(ctx, -2, 1);
        }
        return 1;
    }

    if (is_string)
    {
        duk_pop_2(ctx);
        duk_push_array(ctx);
        duk_push_lstring(ctx, s, i);
        duk_put_prop_index(ctx, -2, 0);
        duk_push_lstring(ctx, s + i, s_len - i);
        duk_put_prop_index(ctx, -2, 1);
    }
    else
    {

        duk_dup_top(ctx);
        duk_dup(ctx, -3);
        duk_push_number(ctx, 0);
        duk_push_number(ctx, i);
        duk_call(ctx, 3);
        duk_push_array(ctx);
        duk_swap_top(ctx, -2);
        duk_put_prop_index(ctx, -2, 0);

        duk_swap_top(ctx, -3);
        duk_push_number(ctx, i);
        duk_call(ctx, 2);
        duk_put_prop_index(ctx, -2, 1);
    }
    return 1;
}
static duk_ret_t match(duk_context *ctx)
{
    duk_size_t pattern_len;
    const uint8_t *pattern = EJS_REQUIRE_CONST_LSOURCE(ctx, 0, &pattern_len);
    duk_size_t name_len;
    const uint8_t *name = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &name_len);

    int ret = ppp_c_path_match_raw(pattern, pattern_len, name, name_len);
    duk_pop_2(ctx);
    duk_push_number(ctx, ret);
    return 1;
}
EJS_SHARED_MODULE__DECLARE(path)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_path_min_js, js_ejs_js_path_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, base, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "base", 4);
        duk_push_c_lightfunc(ctx, clean, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "clean", 5);
        duk_push_c_lightfunc(ctx, dir, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "dir", 3);
        duk_push_c_lightfunc(ctx, ext, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "ext", 3);
        duk_push_c_lightfunc(ctx, isAbs, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "isAbs", 5);
        duk_push_c_lightfunc(ctx, join, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "join", 4);
        duk_push_c_lightfunc(ctx, split, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "split", 5);
        duk_push_c_lightfunc(ctx, match, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "match", 5);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);
    return 0;
}