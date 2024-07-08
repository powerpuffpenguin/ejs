/**
 * This is a fixed length queue implemented within the ejs project.
 * It has no external dependencies and can work independently.
 * Just copy the source code to your project and use it.
 *
 * It is licensed under the MIT license.
 *
 * source:
 *  - queue.h
 *  - queue.c
 */

#ifndef _PPP_CONTAINER_QUEUE_H_
#define _PPP_CONTAINER_QUEUE_H_

#include <stdlib.h>
#include <stdint.h>

#ifndef PPP_QUEUE_TYPENAME
#define PPP_QUEUE_TYPENAME(typename) ppp_queue_##typename
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

typedef struct
{
    size_t len;
    size_t capacity;
    size_t offset;
    void *array;
} ppp_queue_t;

/**
 * Initialize queue
 */
void ppp_queue_init(ppp_queue_t *q, void *array, size_t capacity);

#define ppp_queue_len(q) ((q)->len)

/**
 * Returns whether the queue is full
 */
#define ppp_queue_is_full(q) ((q)->len >= (q)->capacity)

/**
 * Returns whether the queue is empty
 */
#define ppp_queue_is_empty(q) (!(q)->len)

/**
 * If the queue is not full, add an element to the end of the queue
 */
#define ppp_queue_push_back(type, q, v) \
    if (!ppp_queue_is_full(q))          \
    ((type *)((q)->array))[((q)->offset + (q)->len++) % (q)->capacity] = v

/**
 * If the queue is not full, add an element to the front of the queue
 */
#define ppp_queue_push_front(type, q, v)           \
    if (!ppp_queue_is_full(q))                     \
    {                                              \
        if (!(q)->offset)                          \
        {                                          \
            (q)->offset = (q)->capacity;           \
        }                                          \
        ((type *)((q)->array))[--(q)->offset] = v; \
        (q)->len++;                                \
    }

/**
 * eturns the i-th element in the queue
 */
#define ppp_queue_value(type, q, i) (((type *)((q)->array))[((q)->offset + (i)) % (q)->capacity])

/**
 * eturns the i-th element in the queue
 */
#define ppp_queue_pointer(type, q, i) (((type *)((q)->array)) + ((q)->offset + (i)) % (q)->capacity)

/**
 * like ppp_queue_value(type, q, 0)
 */
#define ppp_queue_front(type, q) ppp_queue_value(type, q, 0)
/**
 * like ppp_queue_pointer(type, q, 0)
 */
#define ppp_queue_front_pointer(type, q) ppp_queue_pointer(type, q, 0)

/**
 * like ppp_queue_value(type, q, 0)
 */
#define ppp_queue_back(type, q) ppp_queue_value(type, q, (q)->len - 1)
/**
 * like ppp_queue_pointer(type, q, 0)
 */
#define ppp_queue_back_pointer(type, q) ppp_queue_pointer(type, q, (q)->len - 1)

/**
 * If the queue is not empty, delete the first element
 */
BOOL ppp_queue_pop_front(ppp_queue_t *q);

/**
 * If the queue is not empty, delete the last element
 */
BOOL ppp_queue_pop_back(ppp_queue_t *q);

#endif