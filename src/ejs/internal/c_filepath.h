/**
 * Provides some cross-platform file operations
 * It is licensed under the MIT license.
 *
 * Support platform:
 *   * linux like
 *   * windows
 *
 * source:
 *  * c_string.h
 *  * c_string.c
 *  * c_filepath.h
 *  * c_filepath.c
 */
#ifndef _PPP_C_FILEPATH_H_
#define _PPP_C_FILEPATH_H_

#include "c_string.h"

#if defined(_WIN32) || defined(WIN32) || defined(_WIN64) || defined(WIN64) || defined(__WIN32__) || defined(__TOS_WIN__) || defined(__WINDOWS__)
#define PPP_FILEPATH_WINDOWS
#endif

int ppp_c_filepath_append_separator(ppp_c_string_t *path);
int ppp_c_filepath_join_raw(ppp_c_string_t *path, const char *name, size_t n);
BOOL ppp_c_filepath_is_abc(ppp_c_string_t *path);

int ppp_c_filepath_rmdir_all(ppp_c_string_t *path);
int ppp_c_filepath_remove_all(ppp_c_string_t *path);
#endif