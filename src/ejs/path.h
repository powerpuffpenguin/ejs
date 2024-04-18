#ifndef _EMBEDDED_JS_PATH_H_
#define _EMBEDDED_JS_PATH_H_
#include "strings.h"
#include "error.h"
#include "config.h"
EJS_ERROR_RET ejs_path_clean(const ejs_string_t *s, ejs_string_t *out, ejs_stirng_reference_t *reference);
void ejs_path_dir(const ejs_string_t *path, ejs_string_t *dir);
EJS_ERROR_RET ejs_path_join(ejs_string_t **s, int n, ejs_string_t *join, ejs_stirng_reference_t *reference);

#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
EJS_ERROR_RET ejs_path_from_windows(ejs_string_t *s, ejs_string_t *out, ejs_stirng_reference_t *reference);
EJS_ERROR_RET ejs_path_to_windows(ejs_string_t *s, ejs_string_t *out, ejs_stirng_reference_t *reference);
BOOL ejs_path_is_windows_abs(ejs_string_t *s);
#endif

#endif