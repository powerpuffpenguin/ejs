#include "list_test.h"
#include "../ejs/internal/list.h"
#include "../ejs/defines.h"
#include <stdlib.h>
#include <stdio.h>

// #define DEBUG_PRINT_LIST

typedef struct
{
    int type;
    void *value;
} any_type_t;
#define any_type_c_str 1
#define any_type_int 2

PPP_LIST_DEFINE(any, any_type_t value);

static any_type_t any_type_make_c_str(const char *str)
{
    any_type_t x = {
        .type = any_type_c_str,
        .value = (void *)str,
    };
    return x;
}
static any_type_t any_type_make_int(int value)
{
    any_type_t x = {
        .type = any_type_int,
        .value = (void *)(uint64_t)value,
    };
    return x;
}
#ifdef DEBUG_PRINT_LIST
#define PRINT_LIST printList
#else
#define PRINT_LIST
#endif
#ifdef DEBUG_PRINT_LIST
static printList(ppp_list_t *l)
{
    int i = 0;
    for (ppp_list_element_t *e = ppp_list_front(l); e; e = ppp_list_next(e))
    {
        switch (PPP_LIST_CAST_VALUE(any, e).type)
        {
        case any_type_c_str:
            printf("+ %d %s\n", i, PPP_LIST_CAST_VALUE(any, e).value);
            break;
        case any_type_int:
            printf("+ %d %d\n", i, PPP_LIST_CAST_VALUE(any, e).value);
            break;
        default:
            break;
        }
        i++;
    }

    i = 0;
    for (ppp_list_element_t *e = ppp_list_back(l); e; e = ppp_list_prev(e))
    {
        switch (PPP_LIST_CAST_VALUE(any, e).type)
        {
        case any_type_c_str:
            printf("- %d %s\n", i, PPP_LIST_CAST_VALUE(any, e).value);
            break;
        case any_type_int:
            printf("- %d %d\n", i, PPP_LIST_CAST_VALUE(any, e).value);
            break;
        default:
            break;
        }
        i++;
    }
}
#endif

static BOOL check_list_len(CuTest *t, ppp_list_t *l, int len)
{
    CuAssertIntEquals_Msg(t, "list len", len, l->len);
    return l->len == len ? TRUE : FALSE;
}
static void checkListPointers(CuTest *t, ppp_list_t *l, int es_len, ...)
{
    ppp_list_element_t *root = &l->root;

    if (!check_list_len(t, l, es_len))
    {
        return;
    }

    // zero length lists must be the zero value or properly initialized (sentinel circle)
    if (es_len == 0)
    {
        if ((l->root._next != 0 && l->root._next != root) ||
            (l->root._prev != 0 && l->root._prev != root))
        {
            CuFail(t, "listroot._next and listroot._prev  should both be nil or root");
        }
        return;
    }
    // len(es) > 0
    void **es = malloc(sizeof(void *) * es_len);
    if (!es)
    {
        CuFail(t, "checkListPointers malloc fial");
        return;
    }
    va_list ap;
    va_start(ap, es_len);
    for (int i = 0; i < es_len; i++)
    {
        es[i] = va_arg(ap, void *);
    }
    va_end(ap);

    // check internal and external prev/next connections
    for (int i = 0; i < es_len; i++)
    {
        ppp_list_element_t *e = es[i];
        ppp_list_element_t *prev = root;
        ppp_list_element_t *Prev = 0;
        if (i > 0)
        {
            prev = es[i - 1];
            Prev = prev;
        }

        ppp_list_element_t *p = e->_prev;
        CuAssertPtrEquals_Msg(t, "pre equal", prev, p);
        p = ppp_list_prev(e);
        CuAssertPtrEquals_Msg(t, "Prev equal", Prev, p);

        ppp_list_element_t *next = root;
        ppp_list_element_t *Next = 0;
        if (i < es_len - 1)
        {
            next = es[i + 1];
            Next = next;
        }
        ppp_list_element_t *n = e->_next;
        CuAssertPtrEquals_Msg(t, "next equal", next, n);
        n = ppp_list_next(e);
        CuAssertPtrEquals_Msg(t, "Next equal", Next, n);
    }
    free(es);
}

static BOOL checkListLen(CuTest *t, ppp_list_t *l, int len)
{
    CuAssertIntEquals_Msg(t, "list len", len, ppp_list_len(l));
    return len == ppp_list_len(l) ? TRUE : FALSE;
}
static void checkList(CuTest *t, ppp_list_t *l, int es_len, ...)
{
    if (!checkListLen(t, l, es_len))
    {
        return;
    }
    va_list ap;
    va_start(ap, es_len);
    ppp_list_element_t *e;
    for (e = ppp_list_front(l); e; e = ppp_list_next(e))
    {
        any_type_t any = va_arg(ap, any_type_t);
        CuAssertIntEquals_Msg(t, "type", any.type, PPP_LIST_CAST_VALUE(any, e).type);
        switch (any.type)
        {
        case any_type_int:
            CuAssertPtrEquals_Msg(t, "int value", any.value, PPP_LIST_CAST_VALUE(any, e).value);
            break;
        case any_type_c_str:
            CuAssertStrEquals_Msg(t, "c_str value", any.value, PPP_LIST_CAST_VALUE(any, e).value);
            break;
        }
    }
    va_end(ap);
}

static EJS_TESTS_GROUP_FUNC(list, List, t)
{

    ppp_list_t l;
    ppp_list_init(&l, PPP_LIST_SIZEOF(any));
    checkListPointers(t, &l, 0);

    // Single element list
    ppp_list_element_t *e = ppp_list_push_front(&l);
    PPP_LIST_CAST_VALUE(any, e) = any_type_make_c_str("a");

    checkListPointers(t, &l, 1, e);
    ppp_list_move_to_front(&l, e);
    checkListPointers(t, &l, 1, e);
    ppp_list_move_to_back(&l, e);
    checkListPointers(t, &l, 1, e);
    ppp_list_remove(&l, e, TRUE);
    checkListPointers(t, &l, 0);

    // Bigger list
    ppp_list_element_t *e2 = ppp_list_push_front(&l);
    PPP_LIST_CAST_VALUE(any, e2) = any_type_make_int(2);
    ppp_list_element_t *e1 = ppp_list_push_front(&l);
    PPP_LIST_CAST_VALUE(any, e1) = any_type_make_int(1);
    ppp_list_element_t *e3 = ppp_list_push_back(&l);
    PPP_LIST_CAST_VALUE(any, e3) = any_type_make_int(3);
    ppp_list_element_t *e4 = ppp_list_push_back(&l);
    PPP_LIST_CAST_VALUE(any, e4) = any_type_make_c_str("banana");
    checkListPointers(t, &l, 4, e1, e2, e3, e4);

    ppp_list_remove(&l, e2, TRUE);
    checkListPointers(t, &l, 3, e1, e3, e4);

    ppp_list_move_to_front(&l, e3); // move from middle
    checkListPointers(t, &l, 3, e3, e1, e4);

    ppp_list_move_to_front(&l, e1);
    ppp_list_move_to_back(&l, e3); // move from middle
    checkListPointers(t, &l, 3, e1, e4, e3);

    ppp_list_move_to_front(&l, e3); // move from back
    checkListPointers(t, &l, 3, e3, e1, e4);
    ppp_list_move_to_front(&l, e3); // should be no-op
    checkListPointers(t, &l, 3, e3, e1, e4);

    ppp_list_move_to_back(&l, e3); // move from front
    checkListPointers(t, &l, 3, e1, e4, e3);
    ppp_list_move_to_back(&l, e3); // should be no-op
    checkListPointers(t, &l, 3, e1, e4, e3);

    e2 = ppp_list_insert_before(&l, e1); // insert before front
    checkListPointers(t, &l, 4, e2, e1, e4, e3);
    ppp_list_remove(&l, e2, FALSE);
    e2 = ppp_list_insert_before_with(&l, e4, e2); // insert before middle
    checkListPointers(t, &l, 4, e1, e2, e4, e3);
    ppp_list_remove(&l, e2, TRUE);
    e2 = ppp_list_insert_before(&l, e3); // insert before back
    checkListPointers(t, &l, 4, e1, e4, e2, e3);
    ppp_list_remove(&l, e2, TRUE);

    e2 = ppp_list_insert_after(&l, e1); // insert after front
    checkListPointers(t, &l, 4, e1, e2, e4, e3);
    ppp_list_remove(&l, e2, FALSE);
    e2 = ppp_list_insert_after_with(&l, e4, e2); // insert after middle
    checkListPointers(t, &l, 4, e1, e4, e2, e3);
    ppp_list_remove(&l, e2, TRUE);
    e2 = ppp_list_insert_after(&l, e3); // insert after back
    checkListPointers(t, &l, 4, e1, e4, e3, e2);
    ppp_list_remove(&l, e2, TRUE);

    // Check standard iteration.
    uint64_t sum = 0;
    for (ppp_list_element_t *e = ppp_list_front(&l); e; e = ppp_list_next(e))
    {
        if (PPP_LIST_CAST_VALUE(any, e).type == any_type_int)
        {
            sum += (uint64_t)(PPP_LIST_CAST_VALUE(any, e).value);
        }
    }
    CuAssertIntEquals(t, 4, sum);

    // Clear all elements by iterating
    ppp_list_element_t *next;
    for (e = ppp_list_front(&l); e; e = next)
    {
        next = ppp_list_next(e);
        ppp_list_remove(&l, e, TRUE);
    }
    checkListPointers(t, &l, 0);

    ppp_list_clear(&l);
}

static EJS_TESTS_GROUP_FUNC(list, Extending, t)
{
    ppp_list_t l1;
    ppp_list_init(&l1, PPP_LIST_SIZEOF(any));

    ppp_list_t l2;
    ppp_list_init(&l2, PPP_LIST_SIZEOF(any));

    ppp_list_t l3;
    ppp_list_init(&l3, PPP_LIST_SIZEOF(any));

    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l1)) = any_type_make_int(1);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l1)) = any_type_make_int(2);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l1)) = any_type_make_int(3);

    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l2)) = any_type_make_int(4);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l2)) = any_type_make_int(5);

    CuAssertTrue(t, ppp_list_push_back_list(&l3, &l1));
    checkList(t, &l3,
              3,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));
    CuAssertTrue(t, ppp_list_push_back_list(&l3, &l2));
    checkList(t, &l3,
              5,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3),
              any_type_make_int(4), any_type_make_int(5));

    ppp_list_clear(&l3);
    CuAssertTrue(t, ppp_list_push_front_list(&l3, &l2));
    checkList(t, &l3,
              2,
              any_type_make_int(4), any_type_make_int(5));
    CuAssertTrue(t, ppp_list_push_front_list(&l3, &l1));
    checkList(t, &l3,
              5,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3),
              any_type_make_int(4), any_type_make_int(5));

    checkList(t, &l1,
              3,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));
    checkList(t, &l2,
              2,
              any_type_make_int(4), any_type_make_int(5));

    ppp_list_clear(&l3);
    CuAssertTrue(t, ppp_list_push_back_list(&l3, &l1));
    checkList(t, &l3,
              3,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));
    CuAssertTrue(t, ppp_list_push_back_list(&l3, &l3));
    checkList(t, &l3,
              6,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3),
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));

    ppp_list_clear(&l3);
    CuAssertTrue(t, ppp_list_push_front_list(&l3, &l1));
    checkList(t, &l3,
              3,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));
    CuAssertTrue(t, ppp_list_push_front_list(&l3, &l3));
    checkList(t, &l3,
              6,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3),
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));

    ppp_list_clear(&l3);
    CuAssertTrue(t, ppp_list_push_front_list(&l3, &l3));
    checkList(t, &l1,
              3,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));
    CuAssertTrue(t, ppp_list_push_front_list(&l1, &l3));
    checkList(t, &l1,
              3,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));

    ppp_list_clear(&l1);
    ppp_list_clear(&l2);
    ppp_list_clear(&l3);
}
static EJS_TESTS_GROUP_FUNC(list, Remove, t)
{
    ppp_list_t l;
    ppp_list_init(&l, PPP_LIST_SIZEOF(any));
    ppp_list_element_t *e1 = ppp_list_push_back(&l);
    PPP_LIST_CAST_VALUE(any, e1) = any_type_make_int(1);
    ppp_list_element_t *e2 = ppp_list_push_back(&l);
    PPP_LIST_CAST_VALUE(any, e2) = any_type_make_int(2);
    checkListPointers(t, &l, 2, e1, e2);
    ppp_list_element_t *e = ppp_list_front(&l);
    CuAssertPtrEquals(t, e, ppp_list_remove(&l, e, FALSE));
    checkListPointers(t, &l, 1, e2);
    CuAssertPtrEquals(t, 0, ppp_list_remove(&l, e, FALSE));
    checkListPointers(t, &l, 1, e2);

    l.free(e);
    ppp_list_clear(&l);
}
static EJS_TESTS_GROUP_FUNC(list, Issue4103, t)
{
    ppp_list_t l1;
    ppp_list_init(&l1, PPP_LIST_SIZEOF(any));

    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l1)) = any_type_make_int(1);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l1)) = any_type_make_int(2);

    ppp_list_t l2;
    ppp_list_init(&l2, PPP_LIST_SIZEOF(any));
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l2)) = any_type_make_int(3);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l2)) = any_type_make_int(4);

    ppp_list_element_t *e = ppp_list_front(&l1);
    CuAssertPtrEquals(t, 0, ppp_list_remove(&l2, e, TRUE));
    CuAssertIntEquals(t, 2, ppp_list_len(&l2));

    PPP_LIST_CAST_VALUE(any, ppp_list_insert_before(&l1, e)) = any_type_make_int(8);
    CuAssertIntEquals(t, 3, ppp_list_len(&l1));

    ppp_list_clear(&l1);
    ppp_list_clear(&l2);
}
static EJS_TESTS_GROUP_FUNC(list, Issue6349, t)
{
    ppp_list_t l;
    ppp_list_init(&l, PPP_LIST_SIZEOF(any));
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l)) = any_type_make_int(1);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l)) = any_type_make_int(2);

    ppp_list_element_t *e = ppp_list_front(&l);
    CuAssertPtrEquals(t, e, ppp_list_remove(&l, e, FALSE));
    CuAssertPtrEquals(t, (void *)1, PPP_LIST_CAST_VALUE(any, e).value);

    CuAssertPtrEquals(t, 0, ppp_list_next(e));
    CuAssertPtrEquals(t, 0, ppp_list_prev(e));
    free(e);

    ppp_list_clear(&l);
}
static EJS_TESTS_GROUP_FUNC(list, Move, t)
{
    ppp_list_t l;
    ppp_list_init(&l, PPP_LIST_SIZEOF(any));

    ppp_list_element_t *e1 = ppp_list_push_back(&l);
    PPP_LIST_CAST_VALUE(any, e1) = any_type_make_int(1);
    ppp_list_element_t *e2 = ppp_list_push_back(&l);
    PPP_LIST_CAST_VALUE(any, e2) = any_type_make_int(2);
    ppp_list_element_t *e3 = ppp_list_push_back(&l);
    PPP_LIST_CAST_VALUE(any, e3) = any_type_make_int(3);
    ppp_list_element_t *e4 = ppp_list_push_back(&l);
    PPP_LIST_CAST_VALUE(any, e4) = any_type_make_int(4);

    ppp_list_move_after(&l, e3, e3);
    checkListPointers(t, &l, 4, e1, e2, e3, e4);
    ppp_list_move_before(&l, e2, e2);
    checkListPointers(t, &l, 4, e1, e2, e3, e4);

    ppp_list_move_after(&l, e3, e2);
    checkListPointers(t, &l, 4, e1, e2, e3, e4);
    ppp_list_move_before(&l, e2, e3);
    checkListPointers(t, &l, 4, e1, e2, e3, e4);

    ppp_list_move_before(&l, e2, e4);
    checkListPointers(t, &l, 4, e1, e3, e2, e4);
    ppp_list_element_t *v1 = e2;
    e2 = e3;
    e3 = v1;

    ppp_list_move_before(&l, e4, e1);
    checkListPointers(t, &l, 4, e4, e1, e2, e3);

    v1 = e1;
    ppp_list_element_t *v2 = e2;
    ppp_list_element_t *v3 = e3;
    ppp_list_element_t *v4 = e4;
    e1 = v4;
    e2 = v1;
    e3 = v2;
    e4 = v3;

    ppp_list_move_after(&l, e4, e1);
    checkListPointers(t, &l, 4, e1, e4, e2, e3);
    v4 = e4;
    v3 = e3;
    v2 = e2;
    e2 = v4;
    e3 = v2;
    e4 = v3;

    ppp_list_move_after(&l, e2, e3);
    checkListPointers(t, &l, 4, e1, e3, e2, e4);

    ppp_list_clear(&l);
}
static EJS_TESTS_GROUP_FUNC(list, ZeroList, t)
{
    ppp_list_t l1;
    ppp_list_init(&l1, PPP_LIST_SIZEOF(any));

    PPP_LIST_CAST_VALUE(any, ppp_list_push_front(&l1)) = any_type_make_int(1);
    checkList(t, &l1, 1, any_type_make_int(1));

    ppp_list_t l2;
    ppp_list_init(&l2, PPP_LIST_SIZEOF(any));
    PPP_LIST_CAST_VALUE(any, ppp_list_push_front(&l2)) = any_type_make_int(1);
    checkList(t, &l2, 1, any_type_make_int(1));

    ppp_list_t l3;
    ppp_list_init(&l3, PPP_LIST_SIZEOF(any));
    ppp_list_push_front_list(&l3, &l1);
    checkList(t, &l3, 1, any_type_make_int(1));

    ppp_list_t l4;
    ppp_list_init(&l4, PPP_LIST_SIZEOF(any));
    ppp_list_push_back_list(&l4, &l1);
    checkList(t, &l4, 1, any_type_make_int(1));

    ppp_list_clear(&l1);
    ppp_list_clear(&l2);
    ppp_list_clear(&l3);
    ppp_list_clear(&l4);
}
static EJS_TESTS_GROUP_FUNC(list, InsertBeforeUnknownMark, t)
{
    ppp_list_t l;
    ppp_list_init(&l, PPP_LIST_SIZEOF(any));

    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l)) = any_type_make_int(1);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l)) = any_type_make_int(2);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l)) = any_type_make_int(3);

    ppp_list_element_t at;
    CuAssertPtrEquals(t, 0, ppp_list_insert_before(&l, &at));

    checkList(t, &l, 3,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));

    ppp_list_clear(&l);
}
static EJS_TESTS_GROUP_FUNC(list, InsertAfterUnknownMark, t)
{
    ppp_list_t l;
    ppp_list_init(&l, PPP_LIST_SIZEOF(any));

    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l)) = any_type_make_int(1);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l)) = any_type_make_int(2);
    PPP_LIST_CAST_VALUE(any, ppp_list_push_back(&l)) = any_type_make_int(3);

    ppp_list_element_t at;
    CuAssertPtrEquals(t, 0, ppp_list_insert_after(&l, &at));

    checkList(t, &l, 3,
              any_type_make_int(1), any_type_make_int(2), any_type_make_int(3));

    ppp_list_clear(&l);
}
static EJS_TESTS_GROUP_FUNC(list, MoveUnknownMark, t)
{
    ppp_list_t l1;
    ppp_list_init(&l1, PPP_LIST_SIZEOF(any));
    ppp_list_element_t *e1 = ppp_list_push_back(&l1);
    PPP_LIST_CAST_VALUE(any, e1) = any_type_make_int(1);

    ppp_list_t l2;
    ppp_list_init(&l2, PPP_LIST_SIZEOF(any));
    ppp_list_element_t *e2 = ppp_list_push_back(&l2);
    PPP_LIST_CAST_VALUE(any, e2) = any_type_make_int(2);

    ppp_list_move_after(&l1, e1, e2);
    checkList(t, &l1, 1, any_type_make_int(1));
    checkList(t, &l2, 1, any_type_make_int(2));

    ppp_list_move_before(&l1, e1, e2);
    checkList(t, &l1, 1, any_type_make_int(1));
    checkList(t, &l2, 1, any_type_make_int(2));

    ppp_list_clear(&l1);
    ppp_list_clear(&l2);
}

EJS_TESTS_GROUP(list)
{
    CuSuite *suite = CuSuiteNew();

    EJS_TESTS_GROUP_ADD_FUNC(suite, list, List);
    EJS_TESTS_GROUP_ADD_FUNC(suite, list, Extending);
    EJS_TESTS_GROUP_ADD_FUNC(suite, list, Remove);
    EJS_TESTS_GROUP_ADD_FUNC(suite, list, Issue4103);
    EJS_TESTS_GROUP_ADD_FUNC(suite, list, Issue6349);
    EJS_TESTS_GROUP_ADD_FUNC(suite, list, Move);
    EJS_TESTS_GROUP_ADD_FUNC(suite, list, ZeroList);
    EJS_TESTS_GROUP_ADD_FUNC(suite, list, InsertBeforeUnknownMark);
    EJS_TESTS_GROUP_ADD_FUNC(suite, list, InsertAfterUnknownMark);
    EJS_TESTS_GROUP_ADD_FUNC(suite, list, MoveUnknownMark);

    return suite;
}