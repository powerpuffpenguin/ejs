#include "filepath_test.h"
#include "../ejs/internal/c_filepath.h"
#include <stdio.h>
typedef struct
{
    const char *path, *result;
} path_test_t;
static path_test_t cleantests[] = {
    // Already clean
    {"abc", "abc"},
    {"abc/def", "abc/def"},
    {"a/b/c", "a/b/c"},
    {".", "."},
    {"..", ".."},
    {"../..", "../.."},
    {"../../abc", "../../abc"},
    {"/abc", "/abc"},
    {"/", "/"},

    // Empty is current dir
    {"", "."},

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
    {"/../abc", "/abc"},
    {"a/../b:/../../c", "../c"},

    // Combinations
    {"abc/./../def", "def"},
    {"abc//./../def", "def"},
    {"abc/../../././../def", "../../def"},
};
#ifdef PPP_FILEPATH_WINDOWS
static path_test_t wincleantests[] = {
    {"c:", "c:."},
    {"c:\\", "c:\\"},
    {"c:\\abc", "c:\\abc"},
    {"c:abc\\..\\..\\.\\.\\..\\def", "c:..\\..\\def"},
    {"c:\\abc\\def\\..\\..", "c:\\"},
    {"c:\\..\\abc", "c:\\abc"},
    {"c:..\\abc", "c:..\\abc"},
    {"c:\\b:\\..\\..\\..\\d", "c:\\d"},
    {"\\", "\\"},
    {"/", "\\"},
    {"\\\\i\\..\\c$", "\\\\i\\..\\c$"},
    {"\\\\i\\..\\i\\c$", "\\\\i\\..\\i\\c$"},
    {"\\\\i\\..\\I\\c$", "\\\\i\\..\\I\\c$"},
    {"\\\\host\\share\\foo\\..\\bar", "\\\\host\\share\\bar"},
    {"//host/share/foo/../baz", "\\\\host\\share\\baz"},
    {"\\\\host\\share\\foo\\..\\..\\..\\..\\bar", "\\\\host\\share\\bar"},
    {"\\\\.\\C:\\a\\..\\..\\..\\..\\bar", "\\\\.\\C:\\bar"},
    {"\\\\.\\C:\\\\\\\\a", "\\\\.\\C:\\a"},
    {"\\\\a\\b\\..\\c", "\\\\a\\b\\c"},
    {"\\\\a\\b", "\\\\a\\b"},
    {".\\c:", ".\\c:"},
    {".\\c:\\foo", ".\\c:\\foo"},
    {".\\c:foo", ".\\c:foo"},
    {"//abc", "\\\\abc"},
    {"///abc", "\\\\\\abc"},
    {"//abc//", "\\\\abc\\\\"},

    // Don't allow cleaning to move an element with a colon to the start of the path.
    {"a/../c:", ".\\c:"},
    {"a\\..\\c:", ".\\c:"},
    {"a/../c:/a", ".\\c:\\a"},
    {"a/../../c:", "..\\c:"},
    {"foo:bar", "foo:bar"},
};
#else
static path_test_t nonwincleantests[] = {
    // Remove leading doubled slash
    {"//abc", "/abc"},
    {"///abc", "/abc"},
    {"//abc//", "/abc"},
};
#endif
static EJS_TESTS_GROUP_FUNC(filepath, clean, t)
{
    size_t count = sizeof(cleantests) / sizeof(path_test_t);

    for (size_t i = 0; i < count; i++)
    {
        path_test_t *test = cleantests + i;
#ifdef PPP_FILEPATH_WINDOWS
        ppp_c_string_t result = {
            .cap = 0,
            .len = strlen(test->result),
            .str = (char *)test->result,
        };
        CuAssertIntEquals(t, 0, ppp_c_filepath_from_slash(&result));
        test->result = result.str;
#endif
        {
            ppp_c_string_t s = {
                .str = (char *)test->path,
                .len = strlen(test->path),
                .cap = 0,
            };
            CuAssertIntEquals(t, 0, ppp_c_filepath_clean(&s));
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
            CuAssertIntEquals(t, 0, ppp_c_filepath_clean(&s));
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
#ifdef PPP_FILEPATH_WINDOWS
        ppp_c_string_destroy(&result);
#endif
    }

#ifdef PPP_FILEPATH_WINDOWS
    path_test_t *tests = wincleantests;
    count = sizeof(wincleantests) / sizeof(path_test_t);
#else
    path_test_t *tests = nonwincleantests;
    count = sizeof(nonwincleantests) / sizeof(path_test_t);
#endif

    for (size_t i = 0; i < count; i++)
    {
        path_test_t *test = tests + i;
        {
            ppp_c_string_t s = {
                .str = (char *)test->path,
                .len = strlen(test->path),
                .cap = 0,
            };
            CuAssertIntEquals(t, 0, ppp_c_filepath_clean(&s));
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
            CuAssertIntEquals(t, 0, ppp_c_filepath_clean(&s));
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
#ifdef PPP_FILEPATH_WINDOWS
static is_abs_t winisabstests[] = {
    {"C:\\", TRUE},
    {"c\\", FALSE},
    {"c::", FALSE},
    {"c:", FALSE},
    {"/", FALSE},
    {"\\", FALSE},
    {"\\Windows", FALSE},
    {"c:a\\b", FALSE},
    {"c:\\a\\b", TRUE},
    {"c:/a/b", TRUE},
    {"\\\\host\\share", TRUE},
    {"\\\\host\\share\\", TRUE},
    {"\\\\host\\share\\foo", TRUE},
    {"//host/share/foo/bar", TRUE},
};
#endif
static void test_isabs_raw(CuTest *t, is_abs_t *tests, size_t count)
{
    for (size_t i = 0; i < count; i++)
    {
        is_abs_t *test = tests + i;
        CuAssertIntEquals(t, test->abs, ppp_c_filepath_is_abs_raw(test->path, strlen(test->path)));
    }
}
static EJS_TESTS_GROUP_FUNC(filepath, isabs, t)
{
#ifdef PPP_FILEPATH_WINDOWS
    // winisabstests
    test_isabs_raw(t, winisabstests, sizeof(winisabstests) / sizeof(is_abs_t));

    // All non-windows test should work as intended if prefixed with volume letter.
    size_t count = sizeof(isabstests) / sizeof(is_abs_t);
    char *s;
    size_t n;
    for (size_t i = 0; i < count; i++)
    {
        n = strlen(isabstests[i].path);
        s = malloc(n + 2 + 1);
        if (!s)
        {
            for (size_t j = 0; j < i; j++)
            {
                free(isabstests[j].path);
            }
            CuFail(t, "malloc fail");
            return;
        }
        s[0] = 'c';
        s[1] = ':';
        memmove(s + 2, isabstests[i].path, n);
        s[n + 2] = 0;

        isabstests[i].path = s;
    }
    test_isabs_raw(t, isabstests, count);

    // All non-windows tests should fail, because they have no volume letter.
    for (size_t i = 0; i < count; i++)
    {
        isabstests[i].path += 2;
        isabstests[i].abs = 0;
    }
    test_isabs_raw(t, isabstests, count);

    for (size_t i = 0; i < count; i++)
    {
        isabstests[i].path -= 2;
        free(isabstests[i].path);
    }
#else
    test_isabs_raw(t, isabstests, sizeof(isabstests) / sizeof(is_abs_t));
#endif
}

static path_test_t slashtests[] = {
    {"", ""},
#ifdef PPP_FILEPATH_WINDOWS
    {"/", "\\"},
    {"/a/b", "\\a\\b"},
    {"a//b", "a\\\\b"},

#else
    {"/", "/"},
    {"/a/b", "/a/b"},
    {"a//b", "a//b"},
#endif
};
static EJS_TESTS_GROUP_FUNC(filepath, from_and_to_slash, t)
{
    size_t count = sizeof(slashtests) / sizeof(path_test_t);
    for (size_t i = 0; i < count; i++)
    {
        path_test_t *test = slashtests + i;

        ppp_c_string_t s = {
            .cap = 0,
            .str = (char *)test->path,
            .len = strlen(test->path),
        };
        CuAssertIntEquals_Msg(t, test->path, 0, ppp_c_filepath_from_slash(&s));
        if (s.len == strlen(test->result))
        {
            CuAssertIntEquals_Msg(t, test->path, 0, memcmp(s.str, test->result, s.len));
        }
        else
        {
            CuFail(t, test->path);
        }
        ppp_c_string_destroy(&s);

        s.str = (char *)test->result;
        s.len = strlen(s.str);
        CuAssertIntEquals_Msg(t, test->path, 0, ppp_c_filepath_to_slash(&s));
        if (s.len == strlen(test->path))
        {
            CuAssertIntEquals_Msg(t, test->path, 0, memcmp(s.str, test->path, s.len));
        }
        else
        {
            CuFail(t, test->path);
        }
        ppp_c_string_destroy(&s);
    }
}
typedef struct
{
    char *path;
    char *dir;
    char *file;
} test_split_t;
test_split_t unixsplittests[] = {
    {"a/b", "a/", "b"},
    {"a/b/", "a/b/", ""},
    {"a/", "a/", ""},
    {"a", "", "a"},
    {"/", "/", ""},
};
#ifdef PPP_FILEPATH_WINDOWS
test_split_t winsplittests[] = {
    {"c:", "c:", ""},
    {"c:/", "c:/", ""},
    {"c:/foo", "c:/", "foo"},
    {"c:/foo/bar", "c:/foo/", "bar"},
    {"//host/share", "//host/share", ""},
    {"//host/share/", "//host/share/", ""},
    {"//host/share/foo", "//host/share/", "foo"},
    {"\\\\host\\share", "\\\\host\\share", ""},
    {"\\\\host\\share\\", "\\\\host\\share\\", ""},
    {"\\\\host\\share\\foo", "\\\\host\\share\\", "foo"},
};
#endif
static void test_split_raw(CuTest *t, test_split_t *tests, size_t count)
{
    ppp_c_fast_string_t dir, file;
    for (size_t i = 0; i < count; i++)
    {
        test_split_t *test = tests + i;
        ppp_c_filepath_split_raw(test->path, strlen(test->path), &dir, &file);
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
static EJS_TESTS_GROUP_FUNC(filepath, split, t)
{
    test_split_raw(t, unixsplittests, sizeof(unixsplittests) / sizeof(test_split_t));
#ifdef PPP_FILEPATH_WINDOWS
    test_split_raw(t, winsplittests, sizeof(winsplittests) / sizeof(test_split_t));
#endif
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
    CuAssertIntEquals(t, 0, ppp_c_filepath_join(&str, &iteratorable));

    char *result = arrs[count - 1];
    ppp_c_string_t expected = {
        .str = arrs[count - 1],
        .len = strlen(arrs[count - 1]),
        .cap = 0,
    };
    ppp_c_filepath_from_slash(&expected);
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
static EJS_TESTS_GROUP_FUNC(filepath, join, t)
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

#ifdef PPP_FILEPATH_WINDOWS
    test_join_raw(t, "directory", "file", "directory\\file", 0);
    test_join_raw(t, "C:\\Windows\\", "System32", "C:\\Windows\\System32", 0);
    test_join_raw(t, "C:\\Windows\\", "", "C:\\Windows", 0);
    test_join_raw(t, "C:\\", "Windows", "C:\\Windows", 0);
    test_join_raw(t, "C:", "a", "C:a", 0);
    test_join_raw(t, "C:", "a\\b", "C:a\\b", 0);
    test_join_raw(t, "C:", "a", "b", "C:a\\b", 0);
    test_join_raw(t, "C:", "", "b", "C:b");
    test_join_raw(t, "C:", "", "", "b", "C:b", 0);
    test_join_raw(t, "C:", "", "C:.", 0);
    test_join_raw(t, "C:", "", "", "C:.", 0);
    test_join_raw(t, "C:", "\\a", "C:\\a", 0);
    test_join_raw(t, "C:", "", "\\a", "C:\\a", 0);
    test_join_raw(t, "C:.", "a", "C:a", 0);
    test_join_raw(t, "C:a", "b", "C:a\\b", 0);
    test_join_raw(t, "C:a", "b", "d", "C:a\\b\\d", 0);
    test_join_raw(t, "\\\\host\\share", "foo", "\\\\host\\share\\foo", 0);
    test_join_raw(t, "\\\\host\\share\\foo", "\\\\host\\share\\foo", 0);
    test_join_raw(t, "//host/share", "foo/bar", "\\\\host\\share\\foo\\bar", 0);
    test_join_raw(t, "\\", "\\", 0);
    test_join_raw(t, "\\", "", "\\", 0);
    test_join_raw(t, "\\", "a", "\\a", 0);
    test_join_raw(t, "\\\\", "a", "\\\\a", 0);
    test_join_raw(t, "\\", "a", "b", "\\a\\b", 0);
    test_join_raw(t, "\\\\", "a", "b", "\\\\a\\b", 0);
    test_join_raw(t, "\\", "\\\\a\\b", "c", "\\a\\b\\c", 0);
    test_join_raw(t, "\\\\a", "b", "c", "\\\\a\\b\\c", 0);
    test_join_raw(t, "\\\\a\\", "b", "c", "\\\\a\\b\\c", 0);
    test_join_raw(t, "//", "a", "\\\\a", 0);
    test_join_raw(t, "a:\\b\\c", "x\\..\\y:\\..\\..\\z", "a:\\b\\z", 0);
#else
    test_join_raw(t, "//", "a", "/a", 0);
#endif
}
static void test_base(CuTest *t, path_test_t *test, uint8_t clean)
{
    ppp_c_fast_string_t s = {
        .str = test->path,
        .len = strlen(test->path),
    };
    ppp_c_filepath_base(&s, &s);

    ppp_c_string_t result = {
        .str = (char *)test->result,
        .len = strlen(test->result),
        .cap = 0,
    };
    if (clean)
    {
        if (ppp_c_filepath_clean(&result))
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
static EJS_TESTS_GROUP_FUNC(filepath, base, t)
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
#ifdef PPP_FILEPATH_WINDOWS
    path_test_t winbasetests[] = {
        {"c:\\", "\\"},
        {"c:.", "."},
        {"c:\\a\\b", "b"},
        {"c:a\\b", "b"},
        {"c:a\\b\\c", "c"},
        {"\\\\host\\share\\", "\\"},
        {"\\\\host\\share\\a", "a"},
        {"\\\\host\\share\\a\\b", "b"},
    };
    clean = 1;
#endif

    size_t count = sizeof(basetests) / sizeof(path_test_t);
    for (size_t i = 0; i < count; i++)
    {
        test_base(t, basetests + i, clean);
    }
#ifdef PPP_FILEPATH_WINDOWS
    count = sizeof(winbasetests) / sizeof(path_test_t);
    for (size_t i = 0; i < count; i++)
    {
        test_base(t, winbasetests + i, 0);
    }
#endif
}

static EJS_TESTS_GROUP_FUNC(filepath, ext, t)
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
        ppp_c_filepath_ext_raw(&s, test->path, strlen(test->path));

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
EJS_TESTS_GROUP(suite, filepath)
{
    EJS_TESTS_GROUP_ADD_FUNC(suite, filepath, clean);
    EJS_TESTS_GROUP_ADD_FUNC(suite, filepath, isabs);
    EJS_TESTS_GROUP_ADD_FUNC(suite, filepath, from_and_to_slash);
    EJS_TESTS_GROUP_ADD_FUNC(suite, filepath, split);
    EJS_TESTS_GROUP_ADD_FUNC(suite, filepath, join);
    EJS_TESTS_GROUP_ADD_FUNC(suite, filepath, base);
    EJS_TESTS_GROUP_ADD_FUNC(suite, filepath, ext);
}