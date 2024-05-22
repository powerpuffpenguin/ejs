#include "tests.h"
#include "config.h"
#include "path_test.h"
#include "list_test.h"
#include "queue_test.h"

CuSuite *ejs_unit_tests(void)
{
    CuSuite *suite = CuSuiteNew();

    EJS_TESTS_ADD_GROUP(suite, path);
    EJS_TESTS_ADD_GROUP(suite, list);
    EJS_TESTS_ADD_GROUP(suite, queue);

    return suite;
}