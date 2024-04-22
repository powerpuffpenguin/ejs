#ifndef _UNIT_TEST_EMBEDDED_JS__CONFIGURE__H_
#define _UNIT_TEST_EMBEDDED_JS__CONFIGURE__H_
#include "../cutest/CuTest.h"

#define EJS_TESTS_ADD_GROUP(suite, name) CuSuiteAddSuite(suite, ejs_unit_tests_##name());

#define EJS_FUNC_NAME(name) _##name

#define EJS_TESTS_GROUP(name) CuSuite *ejs_unit_tests_##name(void)
#define EJS_TESTS_GROUP_ADD_FUNC(suite, group, name) CuSuiteAdd(suite, CuTestNew(#group ".test_" #name, ejs_unit_tests__func_##group##__test_##name))
#define EJS_TESTS_GROUP_FUNC(group, name, t) void ejs_unit_tests__func_##group##__test_##name(CuTest *t)

#endif