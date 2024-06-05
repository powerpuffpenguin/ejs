/**
 * It is licensed under the MIT license.
 *
 * source:
 *  * c_string.h
 *  * c_string.c
 */
#ifndef _PPP_C_STRING_H_
#define _PPP_C_STRING_H_

#include <stdint.h>
#include <stdlib.h>

#ifndef BOOL
#define BOOL uint8_t
#endif

#ifndef TRUE
#define TRUE 1
#endif

#ifndef FALSE
#define FALSE 0
#endif

/**
 * c strings are simply a design flaw, everyone has to customize their own strings, this is the version I provided
 */
typedef struct
{
    /**
     * 0-terminated c string.
     * If cap is 0, it means this is a const char*
     */
    char *str;
    /**
     * strlen(str).
     */
    size_t len;
    /**
     * malloc(cap+1). +1 is to store the trailing 0.
     */
    size_t cap;
} ppp_c_string_t;

/**
 * return c string
 */
char *ppp_c_string_c_str(ppp_c_string_t *s);

/**
 * free dynamically allocated memory
 */
void ppp_c_string_destroy(ppp_c_string_t *s);
/**
 * Grows strings to guarantee space for n more bytes.
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_string_grow(ppp_c_string_t *s, size_t n);

/**
 * Concatenate str to the end of s.
 *
 * You must ensure there is sufficient capacity before calling.
 */
void ppp_c_string_append_raw(ppp_c_string_t *s, const char *str, size_t n);
/**
 * Concatenate c to the end of s.
 *
 * You must ensure there is sufficient capacity before calling.
 */
void ppp_c_string_append_raw_char(ppp_c_string_t *s, const char c);
/**
 * Concatenate str to the end of s.
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_string_append(ppp_c_string_t *s, const char *str, size_t n);

/**
 * Concatenate c to the end of s.
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_string_append_char(ppp_c_string_t *s, const char c);

/**
 * Returns TRUE if it ends with the specified string, otherwise returns FALSE
 */
BOOL ppp_c_string_end_with(ppp_c_string_t *s, const char *str, size_t n);
/**
 * Returns TRUE if it starts with the specified string, otherwise returns FALSE
 */
BOOL ppp_c_string_start_with(ppp_c_string_t *s, const char *str, size_t n);

#endif