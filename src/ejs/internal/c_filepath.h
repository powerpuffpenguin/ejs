/**
 * Provides some cross-platform file operations
 * It is licensed under the MIT license.
 *
 * Support platform:
 *   * unix like
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

#ifdef PPP_FILEPATH_WINDOWS
#define PPP_FILEPATH_IS_SEPARATOR(c) ((c) == '\\' || (c) == '/')
#define PPP_FILEPATH_SEPARATOR '\\'
#endif

#ifndef PPP_FILEPATH_IS_SEPARATOR
#define PPP_FILEPATH_IS_SEPARATOR(c) ((c) == '/')
#endif
#ifndef PPP_FILEPATH_SEPARATOR
#define PPP_FILEPATH_SEPARATOR '/'
#endif

int ppp_c_filepath_append_separator(ppp_c_string_t *path);
int ppp_c_filepath_join_raw(ppp_c_string_t *path, const char *name, size_t n);

BOOL ppp_c_filepath_is_abc(ppp_c_string_t *path);

/**
 * remove directory and its subprojects
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_filepath_rmdir_all(ppp_c_string_t *path);
/**
 * remove all file or directory
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_filepath_remove_all(ppp_c_string_t *path);
/**
 * creates a directory named path,along with any necessary parents,
 * The permission bits perm (before umask) are used for all
 * directories that MkdirAll creates.
 * If path is already a directory, MkdirAll does nothing.
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_filepath_mkdir_all(ppp_c_string_t *path, int perm);

#endif