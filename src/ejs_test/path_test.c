#include "path_test.h"
#include "../ejs/internal/c_path.h"
#include <stdio.h>
typedef struct
{
    const char *path, *result;
} path_test_t;
static path_test_t cleantests[] = {
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
            ppp_c_string_t s = {
                .str = (char *)test->path,
                .len = strlen(test->path),
                .cap = 0,
            };
            CuAssertIntEquals(t, 0, ppp_c_path_clean(&s));
            if (s.len == strlen(test->result))
            {
                CuAssertTrue(t, !memcmp(s.str, test->result, s.len));
            }
            else
            {
                CuFail(t, test->path);
            }
            ppp_c_string_destroy(&s);
        }
        {
            ppp_c_string_t s = {
                .str = (char *)test->result,
                .len = strlen(test->result),
                .cap = 0,
            };
            CuAssertIntEquals(t, 0, ppp_c_path_clean(&s));
            if (s.len == strlen(test->result))
            {
                CuAssertTrue(t, !memcmp(s.str, test->result, s.len));
            }
            else
            {
                CuFail(t, test->result);
            }
            ppp_c_string_destroy(&s);
        }
    }
}
typedef struct
{
    char *path;
    BOOL abs;
} is_abs_t;
static is_abs_t isabstests[] = {
    {"", FALSE},
    {"/", TRUE},
    {"/usr/bin/gcc", TRUE},
    {"..", FALSE},
    {"/a/../bb", TRUE},
    {".", FALSE},
    {"./", FALSE},
    {"lala", FALSE},
};

static EJS_TESTS_GROUP_FUNC(path, isabs, t)
{
    size_t count = sizeof(isabstests) / sizeof(is_abs_t);
    for (size_t i = 0; i < count; i++)
    {
        is_abs_t *test = isabstests + i;
        CuAssertIntEquals(t, test->abs, ppp_c_path_is_abs_raw(test->path, strlen(test->path)));
    }
}
typedef struct
{
    char *path;
    char *dir;
    char *file;
} test_split_t;
test_split_t splittests[] = {
    {"a/b", "a/", "b"},
    {"a/b/", "a/b/", ""},
    {"a/", "a/", ""},
    {"a", "", "a"},
    {"/", "/", ""},
};
static EJS_TESTS_GROUP_FUNC(path, split, t)
{
    size_t count = sizeof(splittests) / sizeof(test_split_t);
    ppp_c_fast_string_t dir, file;
    for (size_t i = 0; i < count; i++)
    {
        test_split_t *test = splittests + i;
        ppp_c_path_split_raw(test->path, strlen(test->path), &dir, &file);
        if (dir.len == strlen(test->dir))
        {
            CuAssertIntEquals_Msg(t, test->path, 0, memcmp(dir.str, test->dir, dir.len));
        }
        else
        {
            CuFail(t, test->path);
        }

        if (file.len == strlen(test->file))
        {
            CuAssertIntEquals_Msg(t, test->path, 0, memcmp(file.str, test->file, file.len));
        }
        else
        {
            CuFail(t, test->path);
        }
    }
}
static void test_join_raw(CuTest *t, ...)
{
    char *arrs[10];
    va_list ap;
    va_start(ap, t);
    size_t count = 0;
    while (1)
    {
        char *s = va_arg(ap, char *);
        if (s)
        {
            arrs[count++] = s;
        }
        else
        {
            break;
        }
    }
    va_end(ap);

    ppp_c_string_iteratorable_t iteratorable;
    ppp_c_string_iteratorable_state_t state;
    ppp_c_string_iteratorable_init_c(&iteratorable, &state, arrs, count - 1);
    ppp_c_string_t str = {0};
    CuAssertIntEquals(t, 0, ppp_c_path_join(&str, &iteratorable));

    char *result = arrs[count - 1];
    ppp_c_string_t expected = {
        .str = arrs[count - 1],
        .len = strlen(arrs[count - 1]),
        .cap = 0,
    };
    if (expected.len == str.len)
    {
        CuAssertIntEquals_Msg(t, result, 0, memcmp(expected.str, str.str, str.len));
    }
    else
    {
        CuFail(t, result);
    }
    ppp_c_string_destroy(&str);
    ppp_c_string_destroy(&expected);
}
static EJS_TESTS_GROUP_FUNC(path, join, t)
{
    // zero parameters
    test_join_raw(t, "", 0);

    // one parameter
    test_join_raw(t, "", "", 0);
    test_join_raw(t, "/", "/", 0);
    test_join_raw(t, "a", "a", 0);

    // two parameters
    test_join_raw(t, "a", "b", "a/b", 0);
    test_join_raw(t, "a", "", "a", 0);
    test_join_raw(t, "", "b", "b", 0);
    test_join_raw(t, "/", "a", "/a", 0);
    test_join_raw(t, "/", "a/b", "/a/b", 0);
    test_join_raw(t, "/", "", "/", 0);
    test_join_raw(t, "/a", "b", "/a/b", 0);
    test_join_raw(t, "a", "/b", "a/b", 0);
    test_join_raw(t, "/a", "/b", "/a/b", 0);
    test_join_raw(t, "a/", "b", "a/b", 0);
    test_join_raw(t, "a/", "", "a", 0);
    test_join_raw(t, "", "", "", 0);

    // three parameters
    test_join_raw(t, "/", "a", "b", "/a/b", 0);

    test_join_raw(t, "//", "a", "/a", 0);
}
static void test_base(CuTest *t, path_test_t *test, uint8_t clean)
{
    ppp_c_fast_string_t s = {
        .str = test->path,
        .len = strlen(test->path),
    };
    ppp_c_path_base(&s, &s);

    ppp_c_string_t result = {
        .str = (char *)test->result,
        .len = strlen(test->result),
        .cap = 0,
    };
    if (clean)
    {
        if (ppp_c_path_clean(&result))
        {
            CuFail(t, test->path);
            return;
        }
    }

    if (s.len == result.len)
    {
        CuAssertIntEquals_Msg(t, test->path, 0, memcmp(s.str, result.str, s.len));
    }
    else
    {
        CuFail(t, test->path);
    }
    ppp_c_string_destroy(&result);
}
static EJS_TESTS_GROUP_FUNC(path, base, t)
{
    path_test_t basetests[] = {
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
    uint8_t clean = 0;

    size_t count = sizeof(basetests) / sizeof(path_test_t);
    for (size_t i = 0; i < count; i++)
    {
        test_base(t, basetests + i, clean);
    }
}

static EJS_TESTS_GROUP_FUNC(path, ext, t)
{
    path_test_t exttests[] = {
        {"path.go", ".go"},
        {"path.pb.go", ".go"},
        {"a.dir/b", ""},
        {"a.dir/b.go", ".go"},
        {"a.dir/", ""},
    };
    size_t count = sizeof(exttests) / sizeof(path_test_t);

    path_test_t *test;
    ppp_c_fast_string_t s;
    for (size_t i = 0; i < count; i++)
    {
        test = exttests + i;
        ppp_c_path_ext_raw(&s, test->path, strlen(test->path));

        if (s.len == strlen(test->result))
        {
            CuAssertIntEquals_Msg(t, test->path, 0, memcmp(s.str, test->result, s.len));
        }
        else
        {
            CuFail(t, test->path);
        }
    }
}
typedef struct
{
    const char *pattern;
    const char *s;
    int match;
} match_test_t;
static match_test_t match_tests[] = {
    {"abc", "abc", 0},
    {"*", "abc", 0},
    {"*c", "abc", 0},
    {"a*", "a", 0},
    {"a*", "abc", 0},
    {"a*", "ab/c", 1},
    {"a*/b", "abc/b", 0},
    {"a*/b", "a/c/b", 1},
    {"a*b*c*d*e*/f", "axbxcxdxe/f", 0},
    {"a*b*c*d*e*/f", "axbxcxdxexxx/f", 0},
    {"a*b*c*d*e*/f", "axbxcxdxe/xxx/f", 1},
    {"a*b*c*d*e*/f", "axbxcxdxexxx/fff", 1},
    {"a*b?c*x", "abxbbxdbxebxczzx", 0},
    {"a*b?c*x", "abxbbxdbxebxczzy", 1},
    {"ab[c]", "abc", 0},
    {"ab[b-d]", "abc", 0},
    {"ab[e-g]", "abc", 1},
    {"ab[^c]", "abc", 1},
    {"ab[^b-d]", "abc", 1},
    {"ab[^e-g]", "abc", 0},
    {"a\\*b", "a*b", 0},
    {"a\\*b", "ab", 1},
    {"a?b", "a☺b", 0},
    {"a[^a]b", "a☺b", 0},
    {"a???b", "a☺b", 1},
    {"a[^a][^a][^a]b", "a☺b", 1},
    {"[a-ζ]*", "α", 0},
    {"*[a-ζ]", "A", 1},
    {"a?b", "a/b", 1},
    {"a*b", "a/b", 1},
    {"[\\]a]", "]", 0},
    {"[\\-]", "-", 0},
    {"[x\\-]", "x", 0},
    {"[x\\-]", "-", 0},
    {"[x\\-]", "z", 1},
    {"[\\-x]", "x", 0},
    {"[\\-x]", "-", 0},
    {"[\\-x]", "a", 1},
    {"[]a]", "]", -1},
    {"[-]", "-", -1},
    {"[x-]", "x", -1},
    {"[x-]", "-", -1},
    {"[x-]", "z", -1},
    {"[-x]", "x", -1},
    {"[-x]", "-", -1},
    {"[-x]", "a", -1},
    {"\\", "a", -1},
    {"[a-b-c]", "a", -1},
    {"[", "a", -1},
    {"[^", "a", -1},
    {"[^bc", "a", -1},
    {"a[", "a", -1},
    {"a[", "ab", -1},
    {"a[", "x", -1},
    {"a/b[", "x", -1},
    {"*x", "xxx", 0},
};

static EJS_TESTS_GROUP_FUNC(path, match, t)
{
    size_t count = sizeof(match_tests) / sizeof(match_test_t);
    match_test_t *test;
    for (size_t i = 0; i < count; i++)
    {
        test = match_tests + i;

        int ret = ppp_c_path_match_raw(
            test->pattern, strlen(test->pattern),
            test->s, strlen(test->s));

        CuAssertIntEquals_Msg(t, test->pattern, test->match, ret);
    }
}
EJS_TESTS_GROUP(suite, path)
{
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, clean);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, isabs);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, split);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, join);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, base);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, ext);
    EJS_TESTS_GROUP_ADD_FUNC(suite, path, match);
}