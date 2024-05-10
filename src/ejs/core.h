#ifndef _EMBEDDED_JS_CORE_H_
#define _EMBEDDED_JS_CORE_H_

#include "error.h"
#include "duk.h"
#include "defines.h"

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
    typedef void (*ejs_register_f)(duk_context *ctx, const char *name, duk_c_function init);
    typedef void (*ejs_on_register_f)(duk_context *ctx, ejs_register_f f);
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

        // Register a custom native module in this callback
        ejs_on_register_f on_register;
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
    /**
     * return core version. vX.Y.Z
     */
    DUK_EXTERNAL const char *ejs_version();

    DUK_EXTERNAL ejs_core_t *ejs_require_core(duk_context *ctx);
#if defined(__cplusplus)
}
#endif

#endif