#ifndef _PPP_CONTAINER_LIST_H_
#define _PPP_CONTAINER_LIST_H_

#include <stdlib.h>
#include <stdint.h>

#ifndef PPP_LIST_ELEMENT_TYPENAME
#define PPP_LIST_ELEMENT_TYPENAME(typename) list_element_##typename
#endif

#ifndef BOOL
#define BOOL uint8_t
#endif

#ifndef TRUE
#define TRUE 1
#endif

#ifndef FALSE
#define FALSE 0
#endif

struct ppp_list_element
{
    struct ppp_list_element *_next;
    struct ppp_list_element *_prev;
    struct ppp_list *_list;
};
typedef struct ppp_list_element ppp_list_element_t;

struct ppp_list
{
    size_t sizeof_element;

    int len;
    ppp_list_element_t root;
};
typedef struct ppp_list ppp_list_t;

/**
 * Define doubly linked list's element
 */
#define PPP_LIST_DEFINE(typename, value)       \
    struct PPP_LIST_ELEMENT_TYPENAME(typename) \
    {                                          \
        struct ppp_list_element *_next;        \
        struct ppp_list_element *_prev;        \
        struct ppp_list *_list;                \
        value;                                 \
    }

/**
 * get a element pointer
 */
#define PPP_LIST_CAST(typename, ptr) ((struct PPP_LIST_ELEMENT_TYPENAME(typename) *)(ptr))

/**
 * get a element value
 */
#define PPP_LIST_CAST_VALUE(typename, ptr) (((struct PPP_LIST_ELEMENT_TYPENAME(typename) *)(ptr))->value)

/**
 * Return sizeof(element)
 */
#define PPP_LIST_SIZEOF(typename) sizeof(struct PPP_LIST_ELEMENT_TYPENAME(typename))

/**
 * Initialize linked list
 */
void ppp_list_init(ppp_list_t *l, size_t sizeof_element);

typedef void (*ppp_list_element_destroy_function_t)(ppp_list_t *, ppp_list_element_t *);
/**
 * clear all items
 */
void ppp_list_clear_with_destroy(ppp_list_t *l, ppp_list_element_destroy_function_t f);

/**
 * clear all items
 */
#define ppp_list_clear(l) ppp_list_clear_with_destroy((l), 0)

/**
 * Returns the previous element pointer or 0
 */
ppp_list_element_t *ppp_list_prev(ppp_list_element_t *e);

/**
 * Returns the next element pointer or 0
 */
ppp_list_element_t *ppp_list_next(ppp_list_element_t *e);

/**
 * Insert element e into at, and automatically allocate memory if e is 0
 */
ppp_list_element_t *_ppp_list__internal_insert(ppp_list_t *l, ppp_list_element_t *at, ppp_list_element_t *e);

/**
 * returns the number of elements of list l
 */
#define ppp_list_len(l) ((l)->len)

/**
 * returns the first element of list l or nil if the list is empty.
 */
#define ppp_list_front(l) ((l)->len == 0 ? 0 : (l)->root._next)

/**
 * returns the last element of list l or 0 if the list is empty.
 */
#define ppp_list_back(l) ((l)->len == 0 ? 0 : (l)->root._prev)

/**
 * inserts a new element e at the front of list l and returns e.
 */
#define ppp_list_push_front_with(l, e) _ppp_list__internal_insert((l), &(l)->root, (e))
/**
 * inserts a new element e at the front of list l and returns e.
 */
#define ppp_list_push_front(l) ppp_list_push_front_with(l, 0)

/**
 * inserts a new element e at the back of list l and returns e.
 */
#define ppp_list_push_back_with(l, e) _ppp_list__internal_insert((l), (l)->root._prev, (e))
/**
 * inserts a new element e at the back of list l and returns e.
 */
#define ppp_list_push_back(l) ppp_list_push_back_with(l, 0)

/**
 * Inserts a new element e with value v immediately after mark and returns e.
 * If mark is not an element of l, the list is not modified.
 * The mark must not be nil.
 */
#define ppp_list_insert_after_with(l, mark, e) ((mark)->_list == (l) ? _ppp_list__internal_insert((l), (mark), (e)) : 0)
/**
 * Inserts a new element e with value v immediately after mark and returns e.
 * If mark is not an element of l, the list is not modified.
 * The mark must not be nil.
 */
#define ppp_list_insert_after(l, mark) ppp_list_insert_after_with(l, mark, 0)

/**
 * Inserts a new element e with value v immediately before mark and returns e.
 * If mark is not an element of l, the list is not modified.
 * The mark must not be nil.
 */
#define ppp_list_insert_before_with(l, mark, e) ((mark)->_list == (l) ? _ppp_list__internal_insert((l), (mark)->_prev, (e)) : 0)
/**
 * Inserts a new element e with value v immediately before mark and returns e.
 * If mark is not an element of l, the list is not modified.
 * The mark must not be nil.
 */
#define ppp_list_insert_before(l, mark) ppp_list_insert_before_with(l, mark, 0)

/**
 *   moves e to next to at.
 */
void _ppp_list__internal_move(ppp_list_t *l, ppp_list_element_t *e, ppp_list_element_t *at);

/**
 * Moves element e to the front of list l.
 * If e is not an element of l, the list is not modified.
 * The element must not be nil.
 */
#define ppp_list_move_to_front(l, e)                    \
    if (!((e)->_list != (l) || (l)->root._next == (e))) \
    _ppp_list__internal_move(l, e, &(l)->root)

/**
 * Moves element e to the back of list l.
 * If e is not an element of l, the list is not modified.
 * The element must not be nil.
 */
#define ppp_list_move_to_back(l, e)                     \
    if (!((e)->_list != (l) || (l)->root._prev == (e))) \
    _ppp_list__internal_move(l, e, (l)->root._prev)

/**
 * Moves element e to its new position before mark.
 * If e or mark is not an element of l, or e == mark, the list is not modified.
 * The element and mark must not be 0.
 */
#define ppp_list_move_before(l, e, mark)                                                       \
    if (!((e)->_list != (l) || (e) == (mark) || (mark)->_list != (l) || (e) == (mark)->_prev)) \
    _ppp_list__internal_move(l, e, (mark)->_prev)

/**
 * Moves element e to its new position after mark.
 * If e or mark is not an element of l, or e == mark, the list is not modified.
 * The element and mark must not be 0.
 */
#define ppp_list_move_after(l, e, mark)                                \
    if (!((e)->_list != (l) || (e) == (mark) || (mark)->_list != (l))) \
    _ppp_list__internal_move(l, e, mark)

/**
 * Removes e from l if e is an element of list l.
 * It returns the element if e is an element of list l, else return 0.
 * The element must not be 0.
 */
ppp_list_element_t *ppp_list_remove(ppp_list_t *l, ppp_list_element_t *e, BOOL autofree);

/**
 * Inserts a copy of another list at the back of list l.
 * The lists l and other may be the same. They must be already init.
 * If a failure is returned, it will be guaranteed that l will not change in any way.
 */
BOOL ppp_list_push_back_list(ppp_list_t *l, ppp_list_t *other);
/**
 * Inserts a copy of another list at the back of list l.
 * The lists l and other may be the same. They must be already init.
 * If a failure is returned, it will be guaranteed that l will not change in any way.
 */
BOOL ppp_list_push_front_list(ppp_list_t *l, ppp_list_t *other);

#endif