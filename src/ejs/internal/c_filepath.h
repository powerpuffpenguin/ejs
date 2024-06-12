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

#define PPP_FILEPATH_WINDOWS 1

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

/**
 * Convert path to its shortest pathname equivalent using pure lexical processing.
 * 'cleaned' is only set if the function succeeds, and will not be ppp_c_string_destroy.
 *  'cleaned' may be a substring of path.
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_filepath_clean_raw(ppp_c_string_t *path, ppp_c_string_t *cleaned);
/**
 * Convert path to its shortest pathname equivalent using pure lexical processing.
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_filepath_clean(ppp_c_string_t *path);

/**
 * Replacing each slash ('/') character in path with a separator character.
 * Multiple slashes are replaced by multiple separators.
 *
 * On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_filepath_from_slash(ppp_c_string_t *path);
/**
 * Replacing each separator character in path with a slash ('/') character.
 * Multiple separators are replaced by multiple slashes.
 *
 *  On success, zero is returned.  On error, -1 is returned, and errno is set to indicate the error.
 */
int ppp_c_filepath_to_slash(ppp_c_string_t *path);
/**
 * reports whether the path is absolute
 */
BOOL ppp_c_filepath_is_abs_raw(const char *path, size_t path_len);
/**
 * - BOOL (ppp_c_fast_string_t* path)
 * - BOOL (ppp_c_string_t* path)
 * reports whether the path is absolute
 */
#define ppp_c_filepath_is_abc(path) ppp_c_filepath_is_abs_raw((const char *)(path)->str, (path)->len)

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

typedef struct
{
    /**
     * The temporary file will be created in this directory, or in the current working directory if empty.
     */
    const char *dir;
    size_t dir_len;

    /**
     * File names such as "exe_*.log" or "", The last * will be replaced with a random integer
     */
    const char *pattern;
    size_t pattern_len;

    /**
     * File permissions
     */
    int perm;

} ppp_c_filepath_create_temp_options_t;
typedef struct
{
    /**
     * On success, set file fd.  On error, -1 is set
     */
    int fd;

    /**
     * errno or 0.
     * On error, 0 means 'pattern' contains path separator.
     */
    int err;

    /**
     *  created archive name on success
     */
    ppp_c_string_t name;
} ppp_c_filepath_create_temp_result_t;
/**
 * Create a temporary file.
 *
 * On success, TRUE is returned.  On error, FALSE is returned
 */
BOOL ppp_c_filepath_create_temp_with_buffer(ppp_c_filepath_create_temp_options_t *opts, ppp_c_filepath_create_temp_result_t *result, char *buf, size_t buf_len);

#define ppp_c_filepath_create_temp(opts, result) ppp_c_filepath_create_temp_with_buffer((opts), (result), 0, 0)

typedef struct
{
    /**
     * errno or 0.
     * On error, 0 means 'pattern' contains path separator.
     */
    int err;

    /**
     *  created archive name on success
     */
    ppp_c_string_t name;
} ppp_c_filepath_mkdir_temp_result_t;

/**
 * Create a temporary directory.
 *
 * On success, TRUE is returned.  On error, FALSE is returned
 */
BOOL ppp_c_filepath_mkdir_temp_with_buffer(ppp_c_filepath_create_temp_options_t *opts, ppp_c_filepath_mkdir_temp_result_t *result, char *buf, size_t buf_len);

#define ppp_c_filepath_mkdir_temp(opts, result) ppp_c_filepath_mkdir_temp_with_buffer((opts), (result), 0, 0)

#endif