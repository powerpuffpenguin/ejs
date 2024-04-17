#ifndef _EMBEDDED_JS_PATH_H_
#define _EMBEDDED_JS_PATH_H_
#include "strings.h"
#include "error.h"
EJS_ERROR_RET ejs_path_clean(ejs_string_t *s, ejs_string_t *out, ejs_stirng_reference_t *reference);
void ejs_path_dir(ejs_string_t *path, ejs_string_t *dir);
EJS_ERROR_RET ejs_path_join(ejs_string_t **s, int n, ejs_string_t *join, ejs_stirng_reference_t *reference);

#endif