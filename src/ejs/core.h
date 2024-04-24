#ifndef _EMBEDDED_JS_CORE_H_
#define _EMBEDDED_JS_CORE_H_

#include "dns.h"
#include "error.h"

#include "../duk/duktape.h"

#if defined(__cplusplus)
extern "C"
{
#endif

    typedef struct
    {
        struct event_base *base;
        duk_context *duk;
        uint32_t flags;
    } ejs_core_t;

    typedef struct
    {
        // Startup parameters, usually set directly to the parameter value of the ‘main’ function
        const char **argv;
        int argc;
        // Module search path
        const char **modulev;
        int modulec;

        // Use an externally created event_base. ejs_core_delete will not delete externally created event_base
        struct event_base *base;
    } ejs_core_options_t;

    /**
     * create execution environment
     *
     * success: ... -> ... ejs_core_t*
     * error: ... -> ... error
     */
    DUK_EXTERNAL duk_ret_t ejs_core_new(duk_context *ctx, ejs_core_options_t *opts);
    /**
     * delete resources
     */
    DUK_EXTERNAL void ejs_core_delete(ejs_core_t *core);

    /**
     * run main.js
     */
    DUK_EXTERNAL duk_ret_t ejs_core_run_source(ejs_core_t *core, const char *source);

    /**
     * load and run main.js
     */
    DUK_EXTERNAL duk_ret_t ejs_core_run(ejs_core_t *core, const char *path);

    /**
     * dispatch event loop
     */
    DUK_EXTERNAL EJS_ERROR_RET ejs_core_dispatch(ejs_core_t *core);

#if defined(__cplusplus)
}
#endif

#endif