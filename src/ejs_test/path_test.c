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
            ejs_string_destroy(&s);
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
            ejs_string_destroy(&s);
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
        ejs_string_destroy(&join);
    }
}
typedef struct
{
    const char *path, *ext;
} ext_test_t;

ext_test_t exttests[] = {
    {"path.go", ".go"},
    {"path.pb.go", ".go"},
    {"a.dir/b", ""},
    {"a.dir/b.go", ".go"},
    {"a.dir/", ""},
};
static EJS_TESTS_GROUP_FUNC(path, ext, t)
{
    size_t count = sizeof(exttests) / sizeof(ext_test_t);

    EJS_VAR_TYPE(ejs_string_t, s);
    for (size_t i = 0; i < count; i++)
    {
        ext_test_t *test = exttests + i;
        ejs_string_set_lstring(&s, test->path, strlen(test->path));
        ejs_path_ext(&s, &s);
        if (s.len == strlen(test->ext))
        {
            CuAssertTrue(t, !memcmp(s.c, test->ext, s.len));
        }
        else
        {
            CuFail(t, test->path);
        }
    }
}
path_test_t basetests[] = {
    // Already clean
    {"", "."},
    {".", "."},
    {"/.", "."},
    {"/", "/"},
    {"////", "/"},
    {"x/", "x"},
    {"abc", "abc"},
    {"abc/def", "def"},
    {"a/b/.x", ".x"},
    {"a/b/c.", "c."},
    {"a/b/c.x", "c.x"},
};
static EJS_TESTS_GROUP_FUNC(path, base, t)
{
    size_t count = sizeof(basetests) / sizeof(path_test_t);

    for (size_t i = 0; i < count; i++)
    {
        path_test_t *test = basetests + i;

        EJS_CONST_LSTRING(s, test->path, strlen(test->path));
        ejs_path_base(&s, &s);
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
path_test_t dirtests[] = {
    {"", "."},
    {".", "."},
    {"/.", "/"},
    {"/", "/"},
    {"////", "/"},
    {"/foo", "/"},
    {"x/", "x"},
    {"abc", "."},
    {"abc/def", "abc"},
    {"abc////def", "abc"},
    {"a/b/.x", "a/b"},
    {"a/b/c.", "a/b"},
    {"a/b/c.x", "a/b"},
};
static EJS_TESTS_GROUP_FUNC(path, dir, t)
{
    size_t count = sizeof(dirtests) / sizeof(path_test_t);

    for (size_t i = 0; i < count; i++)
    {
        path_test_t *test = dirtests + i;

        EJS_CONST_LSTRING(path, test->path, strlen(test->path));
        ejs_stirng_reference_t r;
        EJS_VAR_TYPE(ejs_string_t, dir);
        CuAssertTrue(t, !ejs_path_dir(&path, &dir, &r));
        if (dir.len == strlen(test->result))
        {
            CuAssertTrue(t, !memcmp(dir.c, test->result, dir.len));
        }
        else
        {
            CuFail(t, test->path);
        }
        ejs_string_destroy(&dir);
    }
}
typedef struct
{
    const char *path;
    BOOL abs;
} is_abs_t;
is_abs_t isAbsTests[] = {
    {"", FALSE},
    {"/", TRUE},
    {"/usr/bin/gcc", TRUE},
    {"..", FALSE},
    {"/a/../bb", TRUE},
    {".", FALSE},
    {"./", FALSE},
    {"lala", FALSE},
};
static EJS_TESTS_GROUP_FUNC(path, is_abs, t)
{
    size_t count = sizeof(isAbsTests) / sizeof(is_abs_t);

    EJS_VAR_TYPE(ejs_string_t, path);
    for (size_t i = 0; i < count; i++)
    {
        is_abs_t *test = isAbsTests + i;
        ejs_string_set_lstring(&path, test->path, strlen(test->path));
        CuAssertIntEquals(t, test->abs, ejs_path_is_abs(&path));
    }
}
EJS_TESTS_GROUP(suite, path)
{
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, clean);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, split);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, join);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, ext);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, base);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, dir);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, is_abs);
}