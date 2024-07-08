/**
 * A fixed-length circular buffer, usually used as a network data buffer.
 * It is licensed under the MIT license.
 *
 * source:
 *  - loop_buffer.h
 *  - loop_buffer.c
 */
#ifndef _PPP_BYTES_LOOP_BUFFER_H_
#define _PPP_BYTES_LOOP_BUFFER_H_

#include <stdint.h>
#include <stdlib.h>

typedef struct
{
    uint8_t *buf;
    size_t cap;
    size_t len;
    size_t offset;
} ppp_loop_buffer_t;

/**
 * Returns the number of available bytes
 */
#define PPP_LOOP_BUFFER_AVAILABLE(buf) ((buf)->cap - (buf)->len)

#define PPP_LOOP_BUFFER_AT(p, i) ((p)->buf[((p)->offset + (i)) % (p)->cap])

/**
 * Write data. Ensure that all data is written or no data is written
 * If the write is successful, it returns 1, otherwise it returns 0
 */
int ppp_loop_buffer_write(ppp_loop_buffer_t *buf, const void *data, const size_t data_len);
/**
 * Undo n bytes written
 */
void ppp_loop_buffer_undo(ppp_loop_buffer_t *buf, size_t n);

/**
 * Read data from the buffer and return the actual length of the data read
 */
size_t ppp_loop_buffer_read(ppp_loop_buffer_t *buf, void *data, size_t data_len);
/**
 * Copy data from the buffer and return the actual length of the data copied.
 * Similar to read but does not shrink the buffer size.
 */
size_t ppp_loop_buffer_copy(ppp_loop_buffer_t *buf, void *data, size_t data_len);

/**
 * Delete the first n bytes of the buffer signature, similar to read but without performing a data copy
 */
size_t ppp_loop_buffer_drain(ppp_loop_buffer_t *buf, size_t n);

#endif
