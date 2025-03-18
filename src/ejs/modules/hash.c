#include "modules_shared.h"
#include "../js/hash.h"
#include <tomcrypt.h>

static duk_ret_t hashsize(duk_context *ctx)
{
    const struct ltc_hash_descriptor *hash = duk_require_pointer(ctx, 0);
    duk_push_number(ctx, hash->hashsize);
    return 1;
}
static duk_ret_t blocksize(duk_context *ctx)
{
    const struct ltc_hash_descriptor *hash = duk_require_pointer(ctx, 0);
    duk_push_number(ctx, hash->blocksize);
    return 1;
}

static duk_ret_t hashsum(duk_context *ctx, const struct ltc_hash_descriptor *hash, hash_state *state)
{
    duk_size_t s_len = 0;
    const uint8_t *s;
    if (!duk_is_null_or_undefined(ctx, 0))
    {
        s = EJS_REQUIRE_CONST_LSOURCE(ctx, 0, &s_len);
    }
    uint8_t *dst = duk_push_fixed_buffer(ctx, hash->hashsize);
    if (hash->init(state))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s init fail", hash->name);
        duk_throw(ctx);
    }
    if (s_len && hash->process(state, s, s_len))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
        duk_throw(ctx);
    }
    if (hash->done(state, dst))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s done fail", hash->name);
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t hashsum_to(duk_context *ctx, const struct ltc_hash_descriptor *hash, hash_state *state)
{
    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 0, &dst_len);
    if (dst_len < hash->hashsize)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "dst not enough buffer");
        duk_throw(ctx);
    }
    duk_push_number(ctx, hash->hashsize);
    duk_size_t s_len = 0;
    const uint8_t *s;

    if (!duk_is_null_or_undefined(ctx, 1))
    {
        s = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &s_len);
    }

    if (hash->init(state))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s init fail", hash->name);
        duk_throw(ctx);
    }
    if (s_len && hash->process(state, s, s_len))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
        duk_throw(ctx);
    }
    if (hash->done(state, dst))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s done fail", hash->name);
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t create(duk_context *ctx, const struct ltc_hash_descriptor *hash, duk_size_t sz)
{
    void *state = ejs_push_finalizer_object(ctx, sz, ejs_default_finalizer);
    if (hash->init(state))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s init fail", hash->name);
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t process(duk_context *ctx)
{
    if (duk_is_null_or_undefined(ctx, 2))
    {
        return 0;
    }

    const struct ltc_hash_descriptor *hash = duk_require_pointer(ctx, 0);
    hash_state *state = duk_require_pointer(ctx, 1);

    duk_size_t s_len;
    const uint8_t *s = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &s_len);
    if (hash->process(state, s, s_len))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
        duk_throw(ctx);
    }
    return 0;
}
static duk_ret_t reset(duk_context *ctx)
{
    const struct ltc_hash_descriptor *hash = duk_require_pointer(ctx, 0);
    hash_state *state = duk_require_pointer(ctx, 1);
    if (hash->init(state))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s reset fail", hash->name);
        duk_throw(ctx);
    }
    return 0;
}

static duk_ret_t sum(duk_context *ctx, const struct ltc_hash_descriptor *hash, hash_state *state, duk_size_t sz)
{
    const uint8_t *s = duk_require_pointer(ctx, 0);
    uint8_t *dst = duk_push_fixed_buffer(ctx, hash->hashsize);
    memcpy(state, s, sz);
    if (!duk_is_null_or_undefined(ctx, 1))
    {
        duk_size_t s_len = 0;
        const uint8_t *s = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &s_len);
        if (s_len && hash->process(state, s, s_len))
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
            duk_throw(ctx);
        }
    }
    if (hash->done(state, dst))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s done fail", hash->name);
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t sum_to(duk_context *ctx, const struct ltc_hash_descriptor *hash, hash_state *state, duk_size_t sz)
{
    const uint8_t *s = duk_require_pointer(ctx, 0);
    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 1, &dst_len);
    if (dst_len < hash->hashsize)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "dst not enough buffer");
        duk_throw(ctx);
    }
    duk_push_number(ctx, hash->hashsize);

    memcpy(state, s, sz);
    if (!duk_is_null_or_undefined(ctx, 2))
    {
        duk_size_t s_len = 0;
        const uint8_t *s = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &s_len);
        if (s_len && hash->process(state, s, s_len))
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
            duk_throw(ctx);
        }
    }
    if (hash->done(state, dst))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s done fail", hash->name);
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t done(duk_context *ctx)
{
    const struct ltc_hash_descriptor *hash = duk_require_pointer(ctx, 0);
    hash_state *state = duk_require_pointer(ctx, 1);
    uint8_t *dst = duk_push_fixed_buffer(ctx, hash->hashsize);
    if (!duk_is_null_or_undefined(ctx, 2))
    {
        duk_size_t s_len = 0;
        const uint8_t *s = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &s_len);
        if (s_len && hash->process(state, s, s_len))
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
            duk_throw(ctx);
        }
    }
    if (hash->done(state, dst))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s done fail", hash->name);
        duk_throw(ctx);
    }
    return 1;
}
static duk_ret_t doneTo(duk_context *ctx)
{
    const struct ltc_hash_descriptor *hash = duk_require_pointer(ctx, 0);
    hash_state *state = duk_require_pointer(ctx, 1);
    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 2, &dst_len);
    if (dst_len < hash->hashsize)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "dst not enough buffer");
        duk_throw(ctx);
    }
    duk_push_number(ctx, hash->hashsize);
    if (!duk_is_null_or_undefined(ctx, 3))
    {
        duk_size_t s_len = 0;
        const uint8_t *s = EJS_REQUIRE_CONST_LSOURCE(ctx, 3, &s_len);
        if (s_len && hash->process(state, s, s_len))
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
            duk_throw(ctx);
        }
    }
    if (hash->done(state, dst))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s done fail", hash->name);
        duk_throw(ctx);
    }
    return 1;
}

#define EJS_MODULE_HASH_PUSH_RAW(name, desc, hashsum, hashsumTo, create, sum, sumTo) \
    duk_push_object(ctx);                                                            \
    duk_push_pointer(ctx, (void *)&desc);                                            \
    duk_put_prop_lstring(ctx, -2, "desc", 4);                                        \
    duk_push_c_lightfunc(ctx, hashsum, 1, 1, 0);                                     \
    duk_put_prop_lstring(ctx, -2, "hashsum", 7);                                     \
    duk_push_c_lightfunc(ctx, hashsumTo, 2, 2, 0);                                   \
    duk_put_prop_lstring(ctx, -2, "hashsumTo", 9);                                   \
    duk_push_c_lightfunc(ctx, create, 0, 0, 0);                                      \
    duk_put_prop_lstring(ctx, -2, "create", 6);                                      \
    duk_push_c_lightfunc(ctx, sum, 2, 2, 0);                                         \
    duk_put_prop_lstring(ctx, -2, "sum", 3);                                         \
    duk_push_c_lightfunc(ctx, sumTo, 3, 3, 0);                                       \
    duk_put_prop_lstring(ctx, -2, "sumTo", 5);                                       \
    duk_put_prop_string(ctx, -2, #name)
#define EJS_MODULE_HASH_PUSH(name) EJS_MODULE_HASH_PUSH_RAW( \
    name, name##_desc,                                       \
    hashsum_##name, hashsum_to_##name,                       \
    create_##name,                                           \
    sum_##name, sum_to_##name)

#define EJS_MODULE_HASH_DEFAINE_RAW(name, desc, raw_state)   \
    static duk_ret_t hashsum_##name(duk_context *ctx)        \
    {                                                        \
        struct raw_state state;                              \
        return hashsum(ctx, &desc, (hash_state *)&state);    \
    }                                                        \
    static duk_ret_t hashsum_to_##name(duk_context *ctx)     \
    {                                                        \
        struct raw_state state;                              \
        return hashsum_to(ctx, &desc, (hash_state *)&state); \
    }                                                        \
    static duk_ret_t create_##name(duk_context *ctx)         \
    {                                                        \
        duk_size_t sz = sizeof(struct raw_state);            \
        return create(ctx, &desc, sz);                       \
    }                                                        \
    static duk_ret_t sum_##name(duk_context *ctx)            \
    {                                                        \
        struct raw_state state;                              \
        duk_size_t sz = sizeof(struct raw_state);            \
        return sum(ctx, &desc, (hash_state *)&state, sz);    \
    }                                                        \
    static duk_ret_t sum_to_##name(duk_context *ctx)         \
    {                                                        \
        struct raw_state state;                              \
        duk_size_t sz = sizeof(struct raw_state);            \
        return sum_to(ctx, &desc, (hash_state *)&state, sz); \
    }
#define EJS_MODULE_HASH_DEFAINE(name) EJS_MODULE_HASH_DEFAINE_RAW(name, name##_desc, name##_state)
#define EJS_MODULE_HASH_DEFAINE_WITH_STATE(name, state) EJS_MODULE_HASH_DEFAINE_RAW(name, name##_desc, state)

EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha3_512, sha3_state)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha3_384, sha3_state)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha3_256, sha3_state)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha3_224, sha3_state)

EJS_MODULE_HASH_DEFAINE(sha512)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha384, sha512_state)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha512_256, sha512_state)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha512_224, sha512_state)
EJS_MODULE_HASH_DEFAINE(sha256)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha224, sha256_state)
EJS_MODULE_HASH_DEFAINE(sha1)
EJS_MODULE_HASH_DEFAINE(md5)

EJS_SHARED_MODULE__DECLARE(hash)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_hash_min_js, js_ejs_js_hash_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {

        EJS_MODULE_HASH_PUSH(sha3_512);
        EJS_MODULE_HASH_PUSH(sha3_384);
        EJS_MODULE_HASH_PUSH(sha3_256);
        EJS_MODULE_HASH_PUSH(sha3_224);

        EJS_MODULE_HASH_PUSH(sha512);
        EJS_MODULE_HASH_PUSH(sha384);
        EJS_MODULE_HASH_PUSH(sha512_256);
        EJS_MODULE_HASH_PUSH(sha512_224);
        EJS_MODULE_HASH_PUSH(sha256);
        EJS_MODULE_HASH_PUSH(sha224);
        EJS_MODULE_HASH_PUSH(sha1);

        EJS_MODULE_HASH_PUSH(md5);

        duk_push_c_lightfunc(ctx, hashsize, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "hashsize", 8);
        duk_push_c_lightfunc(ctx, blocksize, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "blocksize", 9);
        duk_push_c_lightfunc(ctx, process, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "process", 7);
        duk_push_c_lightfunc(ctx, reset, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "reset", 5);
        duk_push_c_lightfunc(ctx, done, 3, 3, 0);
        duk_put_prop_lstring(ctx, -2, "done", 4);
        duk_push_c_lightfunc(ctx, doneTo, 4, 4, 0);
        duk_put_prop_lstring(ctx, -2, "doneTo", 6);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);

    ejs_stash_set_module_destroy(ctx);
    return 0;
}