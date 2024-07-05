#include "modules_shared.h"

duk_bool_t __ejs_modules_shared_ishex(char c)
{
    if ('0' <= c && c <= '9')
    {
        return 1;
    }
    else if ('a' <= c && c <= 'f')
    {
        return 1;
    }
    else if ('A' <= c && c <= 'F')
    {
        return 1;
    }
    return 0;
}