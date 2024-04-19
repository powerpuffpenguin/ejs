#ifndef _EMBEDDED_JS_CORE_H_
#define _EMBEDDED_JS_CORE_H_
#include "dns.h"
#include "error.h"

#include "../duk/duktape.h"

typedef struct
{
    struct event_base *base;
    duk_context *duk;
    uint32_t flags;
} ejs_core_t;

typedef struct
{
    int argc;
    char **argv;
    struct event_base *base;
} ejs_core_options_t;

/**
 * create execution environment
 *
 * success: ... -> ... ejs_core_t*
 * error: ... -> ... error
 */
duk_ret_t ejs_core_new(duk_context *ctx, ejs_core_options_t *opts);
/**
 * delete resources
 */
void ejs_core_delete(ejs_core_t *core);

/**
 * run main.js
 */
duk_ret_t ejs_core_run_source(ejs_core_t *core, const char *source);

/**
 * load and run main.js
 */
duk_ret_t ejs_core_run(ejs_core_t *core, const char *path);

/**
 * dispatch event loop
 */
EJS_ERROR_RET ejs_core_dispatch(ejs_core_t *core);
#endif