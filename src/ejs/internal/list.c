#include "list.h"
#include <string.h>

void ppp_list_init(ppp_list_t *l, size_t sizeof_element)
{
    l->len = 0;
    l->root._list = 0;

    l->root._next = &l->root;
    l->root._prev = &l->root;

    l->sizeof_element = sizeof_element;

    l->malloc = malloc;
    l->free = free;
}
void ppp_list_clear_with_destroy(ppp_list_t *l, ppp_list_element_destroy_function_t f)
{
    if (!l->len)
    {
        return;
    }
    ppp_list_element_t *e = ppp_list_front(l);
    ppp_list_element_t *next;
    if (f)
    {
        while (e)
        {
            next = ppp_list_next(e);
            f(l, e);
            e = next;
        }
    }
    else
    {
        while (e)
        {
            next = ppp_list_next(e);
            free(e);
            e = next;
        }
    }

    l->len = 0;
    l->root._next = &l->root;
    l->root._prev = &l->root;
}
ppp_list_element_t *ppp_list_prev(ppp_list_element_t *e)
{
    return e->_list &&
                   e->_prev != &e->_list->root
               ? e->_prev
               : 0;
}
ppp_list_element_t *ppp_list_next(ppp_list_element_t *e)
{
    return e->_list &&
                   e->_next != &e->_list->root
               ? e->_next
               : 0;
}
ppp_list_element_t *_ppp_list__internal_insert(ppp_list_t *l, ppp_list_element_t *at, ppp_list_element_t *e)
{
    if (!e)
    {
        e = l->malloc(l->sizeof_element);
        if (!e)
        {
            return 0;
        }
    }

    e->_prev = at;
    e->_next = at->_next;
    e->_prev->_next = e;
    e->_next->_prev = e;
    e->_list = l;
    l->len++;
    return e;
}
void _ppp_list__internal_move(ppp_list_t *l, ppp_list_element_t *e, ppp_list_element_t *at)
{
    if (e != at)
    {
        e->_prev->_next = e->_next;
        e->_next->_prev = e->_prev;

        e->_prev = at;
        e->_next = at->_next;
        e->_prev->_next = e;
        e->_next->_prev = e;
    }
}
ppp_list_element_t *ppp_list_remove(ppp_list_t *l, ppp_list_element_t *e, BOOL autofree)
{
    if (e && e->_list == l)
    {
        // if e.list == l, l must have been initialized when e was inserted
        // in l or l == nil (e is a zero Element) and l.remove will crash

        e->_prev->_next = e->_next;
        e->_next->_prev = e->_prev;
        l->len--;

        if (autofree)
        {
            l->free(e);
        }
        else
        {
            e->_next = 0; // avoid memory leaks
            e->_prev = 0; // avoid memory leaks
            e->_list = 0;
        }
        return e;
    }
    return 0;
}

BOOL ppp_list_push_back_list(ppp_list_t *l, ppp_list_t *other)
{
    if (l->sizeof_element != other->sizeof_element || l->sizeof_element < sizeof(ppp_list_element_t))
    {
        return FALSE;
    }
    int i = ppp_list_len(other);
    if (other->len < 1)
    {
        return TRUE;
    }
    int offset = sizeof(ppp_list_element_t);
    int size = l->sizeof_element - offset;

    ppp_list_element_t *e = ppp_list_front(other);
    ppp_list_element_t *back = ppp_list_back(l);
    ppp_list_element_t *added;
    while (i > 0)
    {
        added = ppp_list_push_back(l);
        if (!added)
        {
            added = ppp_list_back(l);
            while (back != added)
            {
                e = ppp_list_prev(added);
                ppp_list_remove(l, added, TRUE);
                added = e;
            }
            return FALSE;
        }

        if (size >= 0)
        {
            memmove((uint8_t *)added + offset, (uint8_t *)e + offset, size);
        }

        i--;
        e = ppp_list_next(e);
    }
    return TRUE;
}
BOOL ppp_list_push_front_list(ppp_list_t *l, ppp_list_t *other)
{
    if (l->sizeof_element != other->sizeof_element || l->sizeof_element < sizeof(ppp_list_element_t))
    {
        return FALSE;
    }
    int i = ppp_list_len(other);
    if (other->len < 1)
    {
        return TRUE;
    }
    int offset = sizeof(ppp_list_element_t);
    int size = l->sizeof_element - offset;

    ppp_list_element_t *e = ppp_list_back(other);
    ppp_list_element_t *front = ppp_list_front(l);
    ppp_list_element_t *added;
    while (i > 0)
    {
        added = ppp_list_push_front(l);
        if (!added)
        {
            added = ppp_list_front(l);
            while (front != added)
            {
                e = ppp_list_next(added);
                ppp_list_remove(l, added, TRUE);
                added = e;
            }
            return FALSE;
        }
        if (size >= 0)
        {
            memmove((uint8_t *)added + offset, (uint8_t *)e + offset, size);
        }
        i--;
        e = ppp_list_prev(e);
    }
    return TRUE;
}