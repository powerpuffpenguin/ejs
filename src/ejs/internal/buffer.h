/**
 *
 * It is licensed under the MIT license.
 *
 * source:
 *  * buffer.h
 *  * buffer.c
 */
#ifndef _PPP_BYTES_BUFFER_H_
#define _PPP_BYTES_BUFFER_H_

#include <stdint.h>
#include <stdlib.h>

#define PPP_BUFFER_MIN_ALLOC_P 4
#define PPP_BUFFER_DEFAULT_ALLOC (4)

#ifndef PPP_BUFFER_MIN_ALLOC_P
#define PPP_BUFFER_MIN_ALLOC_P 128
#endif

#ifndef PPP_BUFFER_DEFAULT_ALLOC
#define PPP_BUFFER_DEFAULT_ALLOC (1024 - sizeof(struct ppp_buffer_element))
#endif

#define PPP_BUFFER_ELEMENT_P(p) ((uint8_t *)(p) + sizeof(struct ppp_buffer_element))
struct ppp_buffer_element
{
    struct ppp_buffer_element *next;
    size_t capacity;

    size_t offset;
    size_t len;
};

typedef struct
{
    struct ppp_buffer_element *front;
    struct ppp_buffer_element *back;
} ppp_buffer_t;

void ppp_buffer_init(ppp_buffer_t *buf);
void ppp_buffer_destroy(ppp_buffer_t *buf);
int ppp_buffer_write(ppp_buffer_t *buf, const void *src, size_t n, size_t alloc);
int ppp_buffer_read(ppp_buffer_t *buf, void *dst, size_t n);
#endif