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
EJS_TESTS_GROUP(suite, filepath)
{
    EJS_TESTS_GROUP_ADD_FUNC(suite, filepath, clean);
    EJS_TESTS_GROUP_ADD_FUNC(suite, filepath, isabs);
}