#include "tests.h"
#include "config.h"
#include "filepath_test.h"
#include "path_test.h"
#include "list_test.h"
#include "queue_test.h"
#include "loop_buffer_test.h"
#include "thread_pool_test.h"

CuSuite *ejs_unit_tests(void)
{
    CuSuite *suite = CuSuiteNew();

    EJS_TESTS_ADD_GROUP(suite, thread_pool);
    EJS_TESTS_ADD_GROUP(suite, filepath);
    EJS_TESTS_ADD_GROUP(suite, path);
    EJS_TESTS_ADD_GROUP(suite, list);
    EJS_TESTS_ADD_GROUP(suite, queue);
    EJS_TESTS_ADD_GROUP(suite, loop_buffer);

    return suite;
}