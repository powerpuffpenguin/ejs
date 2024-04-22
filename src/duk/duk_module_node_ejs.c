#include "duk_module_node_ejs.h"
#include "../ejs/config.h"
void ejs_duk_module_node_push_dir(duk_context *ctx)
{
    duk_size_t len;
    const char *s = duk_require_lstring(ctx, -1, &len);
    duk_size_t i = 0;
    char c;
    for (; i < len; i++)
    {
        c = s[len - 1 - i];
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
        if (c == '\\' || c == '/')
#else
        if (c == '/')
#endif
        {
            break;
        }
    }
    if (i == len)
    {
        duk_push_undefined(ctx);
    }
    else
    {
        i = len - 1 - i;
#ifdef EJS_CONFIG_SEPARATOR_WINDOWS
        duk_dup_top(ctx, -1);
        duk_substring(ctx, -1, 0, i);
#else
        duk_dup_top(ctx);
        if (i)
        {
            duk_substring(ctx, -1, 0, i);
        }
        else
        {
            duk_substring(ctx, -1, 0, 1);
        }
#endif
    }
}