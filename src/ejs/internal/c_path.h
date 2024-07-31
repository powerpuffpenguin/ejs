/**
 * Implements utility routines for manipulating slash-separated paths.
 * It is licensed under the MIT license.
 *
 * Support platform:
 *   * unix like
 *   * windows
 *
 * source:
 *  - c_string.h
 *  - c_string.c
 *  - c_path.h
 *  - c_path.c
 *  - utf8.h
 *  - utf8.c
 */
#ifndef _PPP_C_PATH_H_
#define _PPP_C_PATH_H_

#include "c_string.h"

/**
 * Convert path to its shortest pathname equivalent using pure lexical processing.
 * 'cleaned' is only set if the function succeeds, and will not be ppp_c_string_destroy.
 *  'cleaned' may be a substring of path.
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_path_clean_raw(ppp_c_string_t *path, ppp_c_string_t *cleaned);
/**
 * Convert path to its shortest pathname equivalent using pure lexical processing.
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_path_clean(ppp_c_string_t *path);

/**
 * splits path immediately following the final Separator,
 * separating it into a directory and file name component.
 * If there is no Separator in path, Split returns an empty dir
 * and file set to path.
 * The returned values have the property that path = dir+file.
 */
void ppp_c_path_split_raw(const char *path, const size_t path_len, ppp_c_fast_string_t *dir, ppp_c_fast_string_t *file);
/**
 * - void (ppp_c_fast_string_t *path, ppp_c_fast_string_t *dir, ppp_c_fast_string_t *file)
 * - void (ppp_c_string_t *path, ppp_c_fast_string_t *dir, ppp_c_fast_string_t *file)
 *
 * splits path immediately following the final Separator,
 * separating it into a directory and file name component.
 * If there is no Separator in path, Split returns an empty dir
 * and file set to path.
 * The returned values have the property that path = dir+file.
 */
#define ppp_c_path_split(path, dir, file) ppp_c_path_split_raw((path)->str, (path)->len, (dir), (file))

/**
 * Concatenate iteratorable to string
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_path_join(ppp_c_string_t *output, ppp_c_string_iteratorable_t *iteratorable);

/**
 * returns the file name extension used by path.
 * The extension is the suffix beginning at the final dot
 * in the final element of path; it is empty if there is no dot.
 */
void ppp_c_path_ext_raw(ppp_c_fast_string_t *output, const char *path, size_t path_len);
/**
 * - void (ppp_c_fast_string_t* output, ppp_c_fast_string_t *path)
 * - void (ppp_c_fast_string_t* output, ppp_c_string_t *path)
 *
 * returns the file name extension used by path.
 * The extension is the suffix beginning at the final dot
 * in the final element of path; it is empty if there is no dot.
 */
#define ppp_c_path_ext(output, s) ppp_c_path_ext_raw((output), (s)->str, (s)->len)

/**
 * returns the last element of path.
 * Trailing path separators are removed before extracting the last element.
 * If the path is empty, Base returns ".".
 * If the path consists entirely of separators, Base returns a single separator.
 */
void ppp_c_path_base_raw(ppp_c_fast_string_t *output, const char *path, size_t path_len);
/**
 * - void (ppp_c_fast_string_t* output, ppp_c_fast_string_t *path)
 * - void (ppp_c_fast_string_t* output, ppp_c_string_t *path)
 *
 * returns the last element of path.
 * Trailing path separators are removed before extracting the last element.
 * If the path is empty, Base returns ".".
 * If the path consists entirely of separators, Base returns a single separator.
 */
#define ppp_c_path_base(output, s) ppp_c_path_base_raw((output), (s)->str, (s)->len)

/**
 * reports whether the path is absolute
 */
BOOL ppp_c_path_is_abs_raw(const char *path, size_t path_len);
/**
 * - BOOL (ppp_c_fast_string_t* path)
 * - BOOL (ppp_c_string_t* path)
 * reports whether the path is absolute
 */
#define ppp_c_path_is_abs(path) ppp_c_path_is_abs_raw((const char *)(path)->str, (path)->len)

/**
 * Reports whether name matches the shell pattern.
 * If matched return 0, If not matched return 1, If err return -1.
 *
 * The pattern syntax is:
 * pattern:
 * 	{ term }
 * term:
 * 	'*'         matches any sequence of non-/ characters
 * 	'?'         matches any single non-/ character
 * 	'[' [ '^' ] { character-range } ']'
 * 	            character class (must be non-empty)
 * 	c           matches character c (c != '*', '?', '\\', '[')
 * 	'\\' c      matches character c
 *
 * character-range:
 * 	c           matches character c (c != '\\', '-', ']')
 * 	'\\' c      matches character c
 * 	lo '-' hi   matches character c for lo <= c <= hi
 *
 * Match requires pattern to match all of name, not just a substring.
 * The only possible returned error is ErrBadPattern, when pattern
 * is malformed.
 */
int ppp_c_path_match_raw(const char *pattern, size_t pattern_len, const char *name, size_t name_len);
/**
 * - int (ppp_c_fast_string_t* pattern, ppp_c_fast_string_t* name)
 * - int (ppp_c_string_t* pattern, ppp_c_fast_string_t* name)
 *
 * Reports whether name matches the shell pattern.
 * If matched return 0, If not matched return 1, If err return -1.
 *
 * The pattern syntax is:
 * pattern:
 * 	{ term }
 * term:
 * 	'*'         matches any sequence of non-/ characters
 * 	'?'         matches any single non-/ character
 * 	'[' [ '^' ] { character-range } ']'
 * 	            character class (must be non-empty)
 * 	c           matches character c (c != '*', '?', '\\', '[')
 * 	'\\' c      matches character c
 *
 * character-range:
 * 	c           matches character c (c != '\\', '-', ']')
 * 	'\\' c      matches character c
 * 	lo '-' hi   matches character c for lo <= c <= hi
 *
 * Match requires pattern to match all of name, not just a substring.
 * The only possible returned error is ErrBadPattern, when pattern
 * is malformed.
 */
#define ppp_c_path_match(pattern, name) ppp_c_path_match_raw((const char *)(pattern)->str, (pattern)->len, (const char *)(name)->str, (name)->len)

#endif