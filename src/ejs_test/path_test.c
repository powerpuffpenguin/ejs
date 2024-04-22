#include "path_test.h"
#include "../ejs/path.h"
#include <string.h>
typedef struct
{
    const char *path, *result;
} path_test_t;
path_test_t cleantests[] = {
    // Already clean
    {"", "."},
    {"abc", "abc"},
    {"abc/def", "abc/def"},
    {"a/b/c", "a/b/c"},
    {".", "."},
    {"..", ".."},
    {"../..", "../.."},
    {"../../abc", "../../abc"},
    {"/abc", "/abc"},
    {"/", "/"},

    // Remove trailing slash
    {"abc/", "abc"},
    {"abc/def/", "abc/def"},
    {"a/b/c/", "a/b/c"},
    {"./", "."},
    {"../", ".."},
    {"../../", "../.."},
    {"/abc/", "/abc"},

    // Remove doubled slash
    {"abc//def//ghi", "abc/def/ghi"},
    {"//abc", "/abc"},
    {"///abc", "/abc"},
    {"//abc//", "/abc"},
    {"abc//", "abc"},

    // Remove . elements
    {"abc/./def", "abc/def"},
    {"/./abc/def", "/abc/def"},
    {"abc/.", "abc"},

    // Remove .. elements
    {"abc/def/ghi/../jkl", "abc/def/jkl"},
    {"abc/def/../ghi/../jkl", "abc/jkl"},
    {"abc/def/..", "abc"},
    {"abc/def/../..", "."},
    {"/abc/def/../..", "/"},
    {"abc/def/../../..", ".."},
    {"/abc/def/../../..", "/"},
    {"abc/def/../../../ghi/jkl/../../../mno", "../../mno"},

    // Combinations
    {"abc/./../def", "def"},
    {"abc//./../def", "def"},
    {"abc/../../././../def", "../../def"},
};

static EJS_TESTS_GROUP_FUNC(path, clean, t)
{
    size_t count = sizeof(cleantests) / sizeof(path_test_t);

    for (size_t i = 0; i < count; i++)
    {
        path_test_t *test = cleantests + i;
        {
            EJS_CONST_LSTRING(path, test->path, strlen(test->path));
            ejs_stirng_reference_t r;
            EJS_VAR_TYPE(ejs_string_t, s);
            CuAssertTrue(t, !ejs_path_clean(&path, &s, &r));
            if (s.len == strlen(test->result))
            {
                CuAssertTrue(t, !memcmp(s.c, test->result, s.len));
            }
            else
            {
                CuFail(t, test->path);
            }
        }
        {
            EJS_CONST_LSTRING(path, test->result, strlen(test->result));
            ejs_stirng_reference_t r;
            EJS_VAR_TYPE(ejs_string_t, s);
            CuAssertTrue(t, !ejs_path_clean(&path, &s, &r));
            if (s.len == strlen(test->result))
            {
                CuAssertTrue(t, !memcmp(s.c, test->result, s.len));
            }
            else
            {
                CuFail(t, test->path);
            }
        }
    }
}

typedef struct
{
    const char *path, *dir, *file;
} split_test_t;
split_test_t splittests[] = {
    {"a/b", "a/", "b"},
    {"a/b/", "a/b/", ""},
    {"a/", "a/", ""},
    {"a", "", "a"},
    {"/", "/", ""},
};
static EJS_TESTS_GROUP_FUNC(path, split, t)
{
    size_t count = sizeof(splittests) / sizeof(split_test_t);

    for (size_t i = 0; i < count; i++)
    {
        split_test_t *test = splittests + i;
        EJS_CONST_LSTRING(path, test->path, strlen(test->path));
        EJS_VAR_TYPE(ejs_string_t, d);
        EJS_VAR_TYPE(ejs_string_t, f);
        ejs_path_split(&path, &d, &f);
        if (d.len == strlen(test->dir))
        {
            CuAssertTrue(t, !memcmp(d.c, test->dir, d.len));
        }
        else
        {
            CuFail(t, test->path);
        }

        if (f.len == strlen(test->file))
        {
            CuAssertTrue(t, !memcmp(f.c, test->file, f.len));
        }
        else
        {
            CuFail(t, test->path);
        }
    }
}

typedef struct
{
    const char *first;
    const char *second;
} pair_c_str_t;

typedef struct
{
    size_t n;
    pair_c_str_t elem;
    const char *path;
} join_test_t;
join_test_t jointests[] = {
    // zero parameters
    {0, {}, ""},

    // one parameter
    {1, {""}, ""},
    {1, {"a"}, "a"},

    // two parameters
    {2, {"a", "b"}, "a/b"},
    {2, {"a", ""}, "a"},
    {2, {"", "b"}, "b"},
    {2, {"/", "a"}, "/a"},
    {2, {"/", ""}, "/"},
    {2, {"a/", "b"}, "a/b"},
    {2, {"a/", ""}, "a"},
    {2, {"", ""}, ""},
};
static EJS_TESTS_GROUP_FUNC(path, join, t)
{
    size_t count = sizeof(jointests) / sizeof(join_test_t);

    for (size_t i = 0; i < count; i++)
    {
        join_test_t *test = jointests + i;

        EJS_VAR_TYPE(ejs_string_t, a);
        EJS_VAR_TYPE(ejs_string_t, b);
        ejs_string_t *elem[2] = {&a, &b};
        if (test->n > 0)
        {
            ejs_string_set_string(&a, test->elem.first);
        }
        if (test->n > 1)
        {
            ejs_string_set_string(&b, test->elem.second);
        }
        EJS_VAR_TYPE(ejs_string_t, join);
        ejs_stirng_reference_t r;
        CuAssertTrue(t, !ejs_path_join(elem, test->n, &join, &r));
        if (join.len == strlen(test->path))
        {
            CuAssertTrue(t, !memcmp(join.c, test->path, join.len));
        }
        else
        {
            CuFail(t, test->path);
        }
        ejs_string_destory(&join);
    }
}
EJS_TESTS_GROUP(path)
{
    CuSuite *suite = CuSuiteNew();
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, clean);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, split);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, join);

    return suite;
}