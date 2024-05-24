#ifndef _UNIT_TEST_EMBEDDED_JS__CONFIGURE__H_
#define _UNIT_TEST_EMBEDDED_JS__CONFIGURE__H_
#include "../cutest/CuTest.h"

#define EJS_TESTS_ADD_GROUP(suite, name) ejs_unit_tests_##name(suite)

#define EJS_FUNC_NAME(name) _##name

#define EJS_TESTS_GROUP(suite, name) void ejs_unit_tests_##name(CuSuite *suite)
#define EJS_TESTS_GROUP_ADD_FUNC(suite, group, name) CuSuiteAdd(suite, CuTestNew(#group ".test_" #name, ejs_unit_tests__func_##group##__test_##name))
#define EJS_TESTS_GROUP_FUNC(group, name, t) void ejs_unit_tests__func_##group##__test_##name(CuTest *t)

#endif