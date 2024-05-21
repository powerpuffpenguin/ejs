#include "list_test.h"
#include "../ejs/internal/list.h"
#include "../ejs/defines.h"
#include <stdlib.h>
#include <stdio.h>
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
PPP_LIST_DEFINE(any, void *value);

static EJS_TESTS_GROUP_FUNC(list, List, t)
{

    struct ppp_list l;
    ppp_list_init(&l, PPP_LIST_SIZEOF(any));
    checkListPointers(t, &l, 0);

    // Single element list
    ppp_list_element_t *e = ppp_list_push_front(&l);

    PPP_LIST_CAST(any, e)->value = "a";
    checkListPointers(t, &l, 1, e);
    // l.MoveToFront(e)
    // checkListPointers(t, l, []*Element{e})
    // l.MoveToBack(e)
    // checkListPointers(t, l, []*Element{e})
    // l.Remove(e)
    // checkListPointers(t, l, []*Element{})

    // // Bigger list
    // e2 := l.PushFront(2)
    // e1 := l.PushFront(1)
    // e3 := l.PushBack(3)
    // e4 := l.PushBack("banana")
    // checkListPointers(t, l, []*Element{e1, e2, e3, e4})

    // l.Remove(e2)
    // checkListPointers(t, l, []*Element{e1, e3, e4})

    // l.MoveToFront(e3) // move from middle
    // checkListPointers(t, l, []*Element{e3, e1, e4})

    // l.MoveToFront(e1)
    // l.MoveToBack(e3) // move from middle
    // checkListPointers(t, l, []*Element{e1, e4, e3})

    // l.MoveToFront(e3) // move from back
    // checkListPointers(t, l, []*Element{e3, e1, e4})
    // l.MoveToFront(e3) // should be no-op
    // checkListPointers(t, l, []*Element{e3, e1, e4})

    // l.MoveToBack(e3) // move from front
    // checkListPointers(t, l, []*Element{e1, e4, e3})
    // l.MoveToBack(e3) // should be no-op
    // checkListPointers(t, l, []*Element{e1, e4, e3})

    // e2 = l.InsertBefore(2, e1) // insert before front
    // checkListPointers(t, l, []*Element{e2, e1, e4, e3})
    // l.Remove(e2)
    // e2 = l.InsertBefore(2, e4) // insert before middle
    // checkListPointers(t, l, []*Element{e1, e2, e4, e3})
    // l.Remove(e2)
    // e2 = l.InsertBefore(2, e3) // insert before back
    // checkListPointers(t, l, []*Element{e1, e4, e2, e3})
    // l.Remove(e2)

    // e2 = l.InsertAfter(2, e1) // insert after front
    // checkListPointers(t, l, []*Element{e1, e2, e4, e3})
    // l.Remove(e2)
    // e2 = l.InsertAfter(2, e4) // insert after middle
    // checkListPointers(t, l, []*Element{e1, e4, e2, e3})
    // l.Remove(e2)
    // e2 = l.InsertAfter(2, e3) // insert after back
    // checkListPointers(t, l, []*Element{e1, e4, e3, e2})
    // l.Remove(e2)

    // // Check standard iteration.
    // sum := 0
    // for e := l.Front(); e != nil; e = e.Next() {
    // 	if i, ok := e.Value.(int); ok {
    // 		sum += i
    // 	}
    // }
    // if sum != 4 {
    // 	t.Errorf("sum over l = %d, want 4", sum)
    // }

    // // Clear all elements by iterating
    // var next *Element
    // for e := l.Front(); e != nil; e = next {
    // 	next = e.Next()
    // 	l.Remove(e)
    // }
    // checkListPointers(t, l, []*Element{})
}

EJS_TESTS_GROUP(list)
{
    CuSuite *suite = CuSuiteNew();

    EJS_TESTS_GROUP_ADD_FUNC(suite, list, List);

    return suite;
}