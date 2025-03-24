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
static void raw_hashinit(duk_context *ctx,
                         const struct ltc_hash_descriptor *hash, hash_state *state,
                         const uint8_t *data, const duk_size_t data_len)
{
    if (hash->init(state))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s init fail", hash->name);
        duk_throw(ctx);
    }
    if (data_len && hash->process(state, data, data_len))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
        duk_throw(ctx);
    }
}
static void raw_hashdone(duk_context *ctx,
                         const struct ltc_hash_descriptor *hash, hash_state *state,
                         const uint8_t *data, const duk_size_t data_len,
                         uint8_t *dst)
{
    if (data_len && hash->process(state, data, data_len))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
        duk_throw(ctx);
    }
    if (hash->done(state, dst))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s done fail", hash->name);
        duk_throw(ctx);
    }
}
static void raw_hashget(duk_context *ctx,
                        const struct ltc_hash_descriptor *hash, hash_state *state,
                        const uint8_t *data, const duk_size_t data_len,
                        uint8_t *dst)
{
    if (hash->init(state))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s init fail", hash->name);
        duk_throw(ctx);
    }
    if (data_len && hash->process(state, data, data_len))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s process fail", hash->name);
        duk_throw(ctx);
    }
    if (hash->done(state, dst))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "%s done fail", hash->name);
        duk_throw(ctx);
    }
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
    raw_hashget(ctx, hash, state, s, s_len, dst);
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

    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 1))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &data_len);
    }

    raw_hashget(ctx, hash, state, data, data_len, dst);
    return 1;
}
static duk_ret_t create(duk_context *ctx, const struct ltc_hash_descriptor *hash, duk_size_t sz)
{
    if (duk_is_null_or_undefined(ctx, 0))
    {
        void *state = ejs_push_finalizer_object(ctx, sz, ejs_default_finalizer);
        if (hash->init(state))
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "%s init fail", hash->name);
            duk_throw(ctx);
        }
    }
    else
    {
        const uint8_t *src = duk_require_pointer(ctx, 0);
        void *state = ejs_push_finalizer_object(ctx, sz, ejs_default_finalizer);
        memcpy(state, src, sz);
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

    duk_size_t data_len;
    const uint8_t *data = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &data_len);
    if (data_len && hash->process(state, data, data_len))
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

    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 1))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &data_len);
    }
    raw_hashdone(ctx, hash, state, data, data_len, dst);
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
    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 2))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &data_len);
    }
    raw_hashdone(ctx, hash, state, data, data_len, dst);
    return 1;
}
static duk_ret_t done(duk_context *ctx)
{
    const struct ltc_hash_descriptor *hash = duk_require_pointer(ctx, 0);
    hash_state *state = duk_require_pointer(ctx, 1);
    uint8_t *dst = duk_push_fixed_buffer(ctx, hash->hashsize);
    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 2))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &data_len);
    }
    raw_hashdone(ctx, hash, state, data, data_len, dst);
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

    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 3))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 3, &data_len);
    }
    raw_hashdone(ctx, hash, state, data, data_len, dst);
    return 1;
}
static void hmac_init_any(duk_context *ctx,
                          const struct ltc_hash_descriptor *hash, hash_state *state,
                          uint8_t *ipad, uint8_t *opad,
                          const uint8_t *key, const duk_size_t key_len)
{
    if (key_len == hash->blocksize)
    {
        memcpy(opad, key, key_len);
    }
    else if (key_len < hash->blocksize)
    {
        if (key_len)
        {
            memcpy(opad, key, key_len);
            memset(opad + key_len, 0, hash->blocksize - key_len);
        }
        else
        {
            memset(opad, 0, hash->blocksize);
        }
    }
    else
    {
        raw_hashget(ctx, hash, state, key, key_len, opad);
        if (hash->blocksize > hash->hashsize)
        {
            memset(opad + hash->hashsize, 0, hash->blocksize - hash->hashsize);
        }
    }
    for (duk_size_t i = 0; i < hash->blocksize; i++)
    {
        ipad[i] = opad[i] ^ 0x36;
        opad[i] ^= 0x5c;
    }
    // duk_size_t i;
    // printf("ipad [");
    // for (i = 0; i < hash->blocksize; i++)
    // {
    //     printf("%d, ", ipad[i]);
    // }
    // printf("] %d\nopad [", i);
    // for (i = 0; i < hash->blocksize; i++)
    // {
    //     printf("%d, ", opad[i]);
    // }
    // printf("] %d\n", i);
    // printf("hash: %s\n", hash->name);
    raw_hashinit(ctx, hash, state, ipad, hash->blocksize);
}
static duk_ret_t hmac_any(duk_context *ctx,
                          const struct ltc_hash_descriptor *hash, hash_state *state,
                          uint8_t *ipad, uint8_t *opad)
{
    duk_size_t key_len = 0;
    const uint8_t *key;
    if (!duk_is_null_or_undefined(ctx, 0))
    {
        key = EJS_REQUIRE_CONST_LSOURCE(ctx, 0, &key_len);
    }
    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 1))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &data_len);
    }
    uint8_t *dst = duk_push_fixed_buffer(ctx, hash->hashsize);

    hmac_init_any(ctx, hash, state, ipad, opad, key, key_len);

    raw_hashdone(ctx, hash, state, data, data_len, dst);

    raw_hashinit(ctx, hash, state, opad, hash->blocksize);

    raw_hashdone(ctx, hash, state, dst, hash->hashsize, dst);
    return 1;
}
static duk_ret_t hmac_to_any(duk_context *ctx,
                             const struct ltc_hash_descriptor *hash, hash_state *state,
                             uint8_t *ipad, uint8_t *opad)
{

    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 0, &dst_len);
    duk_size_t key_len = 0;
    const uint8_t *key;
    if (!duk_is_null_or_undefined(ctx, 1))
    {
        key = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &key_len);
    }
    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 2))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &data_len);
    }
    if (dst_len < hash->hashsize)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "dst not enough buffer");
        duk_throw(ctx);
    }
    duk_push_number(ctx, hash->hashsize);

    hmac_init_any(ctx, hash, state, ipad, opad, key, key_len);

    raw_hashdone(ctx, hash, state, data, data_len, dst);

    raw_hashinit(ctx, hash, state, opad, hash->blocksize);

    raw_hashdone(ctx, hash, state, dst, hash->hashsize, dst);
    return 1;
}

static duk_ret_t hmac_sum_any(duk_context *ctx,
                              const struct ltc_hash_descriptor *hash, hash_state *state, duk_size_t sz)
{
    uint8_t *s = duk_require_pointer(ctx, 0);
    uint8_t *dst = duk_push_fixed_buffer(ctx, hash->hashsize);
    memcpy(state, s, sz);

    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 1))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &data_len);
    }

    raw_hashdone(ctx, hash, state, data, data_len, dst);

    raw_hashinit(ctx, hash, state, s + sz + hash->blocksize, hash->blocksize);

    raw_hashdone(ctx, hash, state, dst, hash->hashsize, dst);
    return 1;
}
static duk_ret_t hmac_sum_to_any(duk_context *ctx,
                                 const struct ltc_hash_descriptor *hash, hash_state *state, duk_size_t sz)
{
    uint8_t *s = duk_require_pointer(ctx, 0);
    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 1, &dst_len);
    if (dst_len < hash->hashsize)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "dst not enough buffer");
        duk_throw(ctx);
    }
    duk_push_number(ctx, hash->hashsize);

    memcpy(state, s, sz);
    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 2))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &data_len);
    }

    raw_hashdone(ctx, hash, state, data, data_len, dst);

    raw_hashinit(ctx, hash, state, s + sz + hash->blocksize, hash->blocksize);

    raw_hashdone(ctx, hash, state, dst, hash->hashsize, dst);
    return 1;
}
static duk_ret_t hmac_done_any(duk_context *ctx, const struct ltc_hash_descriptor *hash, duk_size_t sz)
{
    uint8_t *s = duk_require_pointer(ctx, 0);
    uint8_t *dst = duk_push_fixed_buffer(ctx, hash->hashsize);
    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 1))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 1, &data_len);
    }
    hash_state *state = (hash_state *)s;
    raw_hashdone(ctx, hash, state, data, data_len, dst);

    raw_hashinit(ctx, hash, state, s + sz + hash->blocksize, hash->blocksize);

    raw_hashdone(ctx, hash, state, dst, hash->hashsize, dst);
    return 1;
}
static duk_ret_t hmac_done_to_any(duk_context *ctx, const struct ltc_hash_descriptor *hash, duk_size_t sz)
{
    uint8_t *s = duk_require_pointer(ctx, 0);
    duk_size_t dst_len;
    uint8_t *dst = duk_require_buffer_data(ctx, 1, &dst_len);
    if (dst_len < hash->hashsize)
    {
        duk_push_error_object(ctx, DUK_ERR_RANGE_ERROR, "dst not enough buffer");
        duk_throw(ctx);
    }
    duk_push_number(ctx, hash->hashsize);

    duk_size_t data_len = 0;
    const uint8_t *data;
    if (!duk_is_null_or_undefined(ctx, 2))
    {
        data = EJS_REQUIRE_CONST_LSOURCE(ctx, 2, &data_len);
    }
    hash_state *state = (hash_state *)s;
    raw_hashdone(ctx, hash, state, data, data_len, dst);

    raw_hashinit(ctx, hash, state, s + sz + hash->blocksize, hash->blocksize);

    raw_hashdone(ctx, hash, state, dst, hash->hashsize, dst);
    return 1;
}

#define EJS_MODULE_HASH_PUSH_RAW(name, desc)                 \
    duk_push_object(ctx);                                    \
    duk_push_pointer(ctx, (void *)&desc);                    \
    duk_put_prop_lstring(ctx, -2, "desc", 4);                \
    duk_push_c_lightfunc(ctx, hashsum_##name, 1, 1, 0);      \
    duk_put_prop_lstring(ctx, -2, "hashsum", 7);             \
    duk_push_c_lightfunc(ctx, hashsum_to_##name, 2, 2, 0);   \
    duk_put_prop_lstring(ctx, -2, "hashsumTo", 9);           \
    duk_push_c_lightfunc(ctx, create_##name, 1, 1, 0);       \
    duk_put_prop_lstring(ctx, -2, "create", 6);              \
    duk_push_c_lightfunc(ctx, sum_##name, 2, 2, 0);          \
    duk_put_prop_lstring(ctx, -2, "sum", 3);                 \
    duk_push_c_lightfunc(ctx, sum_to_##name, 3, 3, 0);       \
    duk_put_prop_lstring(ctx, -2, "sumTo", 5);               \
    duk_push_c_lightfunc(ctx, hmac_##name, 2, 2, 0);         \
    duk_put_prop_lstring(ctx, -2, "hmac", 4);                \
    duk_push_c_lightfunc(ctx, hmac_to_##name, 3, 3, 0);      \
    duk_put_prop_lstring(ctx, -2, "hmacTo", 6);              \
    duk_push_c_lightfunc(ctx, hmac_init_##name, 1, 1, 0);    \
    duk_put_prop_lstring(ctx, -2, "hinit", 5);               \
    duk_push_c_lightfunc(ctx, hmac_clone_##name, 1, 1, 0);   \
    duk_put_prop_lstring(ctx, -2, "hclone", 6);              \
    duk_push_c_lightfunc(ctx, hmac_reset_##name, 1, 1, 0);   \
    duk_put_prop_lstring(ctx, -2, "hreset", 6);              \
    duk_push_c_lightfunc(ctx, hmac_sum_##name, 2, 2, 0);     \
    duk_put_prop_lstring(ctx, -2, "hsum", 4);                \
    duk_push_c_lightfunc(ctx, hmac_sum_to_##name, 3, 3, 0);  \
    duk_put_prop_lstring(ctx, -2, "hsumTo", 6);              \
    duk_push_c_lightfunc(ctx, hmac_done_##name, 2, 2, 0);    \
    duk_put_prop_lstring(ctx, -2, "hdone", 5);               \
    duk_push_c_lightfunc(ctx, hmac_done_to_##name, 3, 3, 0); \
    duk_put_prop_lstring(ctx, -2, "hdoneTo", 7);             \
    duk_put_prop_string(ctx, -2, #name)
#define EJS_MODULE_HASH_PUSH(name) EJS_MODULE_HASH_PUSH_RAW(name, name##_desc)

#define EJS_MODULE_HASH_DEFAINE_RAW(name, desc, raw_state, BLOCKSIZE)                           \
    static duk_ret_t hashsum_##name(duk_context *ctx)                                           \
    {                                                                                           \
        struct raw_state state;                                                                 \
        return hashsum(ctx, &desc, (hash_state *)&state);                                       \
    }                                                                                           \
    static duk_ret_t hashsum_to_##name(duk_context *ctx)                                        \
    {                                                                                           \
        struct raw_state state;                                                                 \
        return hashsum_to(ctx, &desc, (hash_state *)&state);                                    \
    }                                                                                           \
    static duk_ret_t create_##name(duk_context *ctx)                                            \
    {                                                                                           \
        duk_size_t sz = sizeof(struct raw_state);                                               \
        return create(ctx, &desc, sz);                                                          \
    }                                                                                           \
    static duk_ret_t sum_##name(duk_context *ctx)                                               \
    {                                                                                           \
        struct raw_state state;                                                                 \
        duk_size_t sz = sizeof(struct raw_state);                                               \
        return sum(ctx, &desc, (hash_state *)&state, sz);                                       \
    }                                                                                           \
    static duk_ret_t sum_to_##name(duk_context *ctx)                                            \
    {                                                                                           \
        struct raw_state state;                                                                 \
        duk_size_t sz = sizeof(struct raw_state);                                               \
        return sum_to(ctx, &desc, (hash_state *)&state, sz);                                    \
    }                                                                                           \
    static duk_ret_t hmac_##name(duk_context *ctx)                                              \
    {                                                                                           \
        struct raw_state state;                                                                 \
        uint8_t s[BLOCKSIZE * 2];                                                               \
        return hmac_any(ctx, &desc, (hash_state *)&state, s, s + BLOCKSIZE);                    \
    }                                                                                           \
    static duk_ret_t hmac_to_##name(duk_context *ctx)                                           \
    {                                                                                           \
        struct raw_state state;                                                                 \
        uint8_t s[BLOCKSIZE * 2];                                                               \
        return hmac_to_any(ctx, &desc, (hash_state *)&state, s, s + BLOCKSIZE);                 \
    }                                                                                           \
    static duk_ret_t hmac_init_##name(duk_context *ctx)                                         \
    {                                                                                           \
        duk_size_t key_len = 0;                                                                 \
        const uint8_t *key;                                                                     \
        if (!duk_is_null_or_undefined(ctx, 0))                                                  \
        {                                                                                       \
            key = EJS_REQUIRE_CONST_LSOURCE(ctx, 0, &key_len);                                  \
        }                                                                                       \
        duk_size_t sz = sizeof(struct raw_state);                                               \
        uint8_t *p = ejs_push_finalizer_object(ctx, sz + BLOCKSIZE * 2, ejs_default_finalizer); \
        hmac_init_any(ctx, &desc, (hash_state *)p, p + sz, p + sz + BLOCKSIZE, key, key_len);   \
        return 1;                                                                               \
    }                                                                                           \
    static duk_ret_t hmac_clone_##name(duk_context *ctx)                                        \
    {                                                                                           \
        const uint8_t *src = duk_require_pointer(ctx, 0);                                       \
        duk_size_t n = sizeof(struct raw_state) + BLOCKSIZE * 2;                                \
        uint8_t *dst = ejs_push_finalizer_object(ctx, n, ejs_default_finalizer);                \
        memcpy(dst, src, n);                                                                    \
        return 1;                                                                               \
    }                                                                                           \
    static duk_ret_t hmac_reset_##name(duk_context *ctx)                                        \
    {                                                                                           \
        const uint8_t *p = duk_require_pointer(ctx, 0);                                         \
        duk_size_t n = sizeof(struct raw_state);                                                \
        raw_hashinit(ctx, &desc, (hash_state *)p, p + n, BLOCKSIZE);                            \
        return 0;                                                                               \
    }                                                                                           \
    static duk_ret_t hmac_sum_##name(duk_context *ctx)                                          \
    {                                                                                           \
        struct raw_state state;                                                                 \
        return hmac_sum_any(ctx, &desc, (hash_state *)&state, sizeof(struct raw_state));        \
    }                                                                                           \
    static duk_ret_t hmac_sum_to_##name(duk_context *ctx)                                       \
    {                                                                                           \
        struct raw_state state;                                                                 \
        return hmac_sum_to_any(ctx, &desc, (hash_state *)&state, sizeof(struct raw_state));     \
    }                                                                                           \
    static duk_ret_t hmac_done_##name(duk_context *ctx)                                         \
    {                                                                                           \
        return hmac_done_any(ctx, &desc, sizeof(struct raw_state));                             \
    }                                                                                           \
    static duk_ret_t hmac_done_to_##name(duk_context *ctx)                                      \
    {                                                                                           \
        return hmac_done_to_any(ctx, &desc, sizeof(struct raw_state));                          \
    }

#define EJS_MODULE_HASH_DEFAINE(name, BLOCKSIZE) EJS_MODULE_HASH_DEFAINE_RAW(name, name##_desc, name##_state, BLOCKSIZE)
#define EJS_MODULE_HASH_DEFAINE_WITH_STATE(name, state, BLOCKSIZE) EJS_MODULE_HASH_DEFAINE_RAW(name, name##_desc, state, BLOCKSIZE)

EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha3_512, sha3_state, 72)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha3_384, sha3_state, 104)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha3_256, sha3_state, 136)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha3_224, sha3_state, 144)

EJS_MODULE_HASH_DEFAINE(sha512, 128)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha384, sha512_state, 128)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha512_256, sha512_state, 128)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha512_224, sha512_state, 128)
EJS_MODULE_HASH_DEFAINE(sha256, 64)
EJS_MODULE_HASH_DEFAINE_WITH_STATE(sha224, sha256_state, 64)
EJS_MODULE_HASH_DEFAINE(sha1, 64)
EJS_MODULE_HASH_DEFAINE(md5, 64)

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

    return 0;
}