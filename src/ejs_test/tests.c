#include "tests.h"
#include "config.h"
#include "path_test.h"

CuSuite *ejs_unit_tests(void)
{
    CuSuite *suite = CuSuiteNew();

    EJS_TESTS_ADD_GROUP(suite, path);

    return suite;
}