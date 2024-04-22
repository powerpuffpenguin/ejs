#ifndef _EMBEDDED_JS_PATH_H_
#define _EMBEDDED_JS_PATH_H_
#include "strings.h"
#include "error.h"
#include "config.h"
EJS_ERROR_RET ejs_path_clean(const ejs_string_t *s, ejs_string_t *out, ejs_stirng_reference_t *reference);
void ejs_path_split(const ejs_string_t *path, ejs_string_t *dir, ejs_string_t *file);
#define ejs_path_dir(path, dir) ejs_path_split((path), (dir), 0);
EJS_ERROR_RET ejs_path_join(ejs_string_t **s, size_t n, ejs_string_t *join, ejs_stirng_reference_t *reference);

#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
/**
 * s and out can point to the same pointer, and if the reference is valid at this time, the memory will not be reallocated but the value pointed to by s will be directly modified.
 */
EJS_ERROR_RET ejs_path_from_windows(ejs_string_t *s, ejs_string_t *out, ejs_stirng_reference_t *reference);
/**
 * s and out can point to the same pointer, and if the reference is valid at this time, the memory will not be reallocated but the value pointed to by s will be directly modified.
 */
EJS_ERROR_RET ejs_path_to_windows(ejs_string_t *s, ejs_string_t *out, ejs_stirng_reference_t *reference);
BOOL ejs_path_is_windows_abs(ejs_string_t *s);
#endif

#endif