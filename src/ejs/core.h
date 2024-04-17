#ifndef _EMBEDDED_JS_CORE_H_
#define _EMBEDDED_JS_CORE_H_
#include "dns.h"
#include "error.h"

#include "../duk/duktape.h"

typedef struct
{
    struct event_base *base;
    duk_context *duk;
} ejs_core_t;

/**
 * create execution environment
 *
 * success: ... -> ... ejs_core_t*
 * error: ... -> ... error
 */
duk_ret_t ejs_core_new(duk_context *ctx, int argc, char **argv);
/**
 * delete resources
 */
void ejs_core_delete(ejs_core_t *core);

/**
 * Load and run the script
 */
EJS_ERROR_RET ejs_core_run(ejs_core_t *core, int argc, char **argv);
/**
 * dispatch event loop
 */
EJS_ERROR_RET ejs_core_dispatch(ejs_core_t *core);
#endif