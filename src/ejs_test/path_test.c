#include "path_test.h"
#include "../ejs/path.h"
#include <string.h>
typedef struct
{
    const char *path;
    const char *result;
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
EJS_TESTS_GROUP(path)
{
    CuSuite *suite = CuSuiteNew();

    EJS_TESTS_GROUP_ADD_FUNC(suite, path, clean);
    return suite;
}