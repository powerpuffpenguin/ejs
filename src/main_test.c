#include <stdio.h>
#include "ejs_test/tests.h"

void TestCuStringNew(CuTest *tc)
{
    CuString *str = CuStringNew();
    CuAssertTrue(tc, 1 == str->length);
    CuAssertTrue(tc, 0 != str->size);
    CuAssertStrEquals(tc, "", str->buffer);
}

CuSuite *createSuite(void)
{
    CuSuite *suite = CuSuiteNew();

    // 添加測試函數
    CuSuiteAdd(suite, CuTestNew("Ko.TestCuStringNew", TestCuStringNew));
    CuSuiteAdd(suite, CuTestNew("TestCuStringNew", TestCuStringNew));

    return suite;
}

int main(int argc, char **argv)
{
    // 創建測試環境
    CuString *output = CuStringNew();
    CuSuite *suite = ejs_unit_tests();

    // 運行測試
    CuSuiteRun(suite);

    // 獲取測試結果並打印
    CuSuiteSummary(suite, output);
    CuSuiteDetails(suite, output);
    printf("%s\n", output->buffer);
    return suite->failCount;
}