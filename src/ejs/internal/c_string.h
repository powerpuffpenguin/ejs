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
#include <string.h>

#ifndef BOOL
#define BOOL uint8_t
#endif

#ifndef TRUE
#define TRUE 1
#endif

#ifndef FALSE
#define FALSE 0
#endif

#ifndef PPP_CHAR_TO_UPPER
#define PPP_CHAR_TO_UPPER(c) (('a' <= (c) && (c) <= 'z') ? (c) - ('a' - 'A') : (c))
#endif

/**
 * Usually used to represent const char*
 */
typedef struct
{
    const char *str;
    size_t len;
} ppp_c_fast_string_t;

ppp_c_fast_string_t ppp_c_fast_string_create(const char *str, const size_t len);

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

ppp_c_string_t ppp_c_string_create(char *str, size_t len, size_t cap);

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
 * tests whether the string s begins with prefix.
 */
BOOL ppp_c_string_has_prefix_raw(const char *s, const size_t s_len, const char *prefix, const size_t prefix_len);

/**
 * tests whether the string s begins with prefix.
 */
#define ppp_c_string_has_prefix(s, prefix, prefix_len) ppp_c_string_has_prefix_raw((s)->str, (s)->len, (prefix), (prefix_len))

/**
 * tests whether the string s ends with suffix.
 */
BOOL ppp_c_string_has_suffix_raw(const char *s, const size_t s_len, const char *suffix, const size_t suffix_len);
/**
 * tests whether the string s ends with suffix.
 */
#define ppp_c_string_has_suffix(s, prefix, prefix_len) ppp_c_string_has_suffix((s)->str, (s)->len, (prefix), (prefix_len))

/**
 * Find and return the position where the character first appears. If not found, -1 is returned.
 */
size_t ppp_c_stirng_first_char_raw(const char *s, const size_t s_len, const char c);
/**
 * Find and return the position where the character first appears. If not found, -1 is returned.
 */
#define ppp_c_stirng_first_char(s, c) ppp_c_stirng_first_char_raw((s)->str, (s)->len, c)

/**
 * Find and return the position where the character last appears. If not found, -1 is returned.
 */
size_t ppp_c_stirng_last_char_raw(const char *s, const size_t s_len, const char c);
/**
 * Find and return the position where the character last appears. If not found, -1 is returned.
 */
#define ppp_c_stirng_last_char(s, c) ppp_c_stirng_last_char_raw((s)->str, (s)->len, c)

/**
 * void (string_t* sub, string_t* s, size_t begin, size_t end)
 */
#define ppp_c_string_sub(sub, s, begin, end) \
    (sub)->str = (s)->str + (begin);         \
    sub->len = (end) - (begin)
/**
 * ppp_c_string_sub_begin (string_t* sub, string_t* s, size_t begin)
 */
#define ppp_c_string_sub_begin(sub, s, begin) \
    (sub)->str = (s)->str + (begin);          \
    (sub)->len = (s)->len - (begin)
/**
 * void (string_t* sub, string_t* s, size_t end)
 */
#define ppp_c_string_sub_end(sub, s, end) \
    (sub)->str = (s)->str;                \
    (sub)->len = end

#endif