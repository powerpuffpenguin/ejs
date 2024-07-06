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
uint8_t __ejs_modules_shared_unhex(uint8_t c)
{

    if ('0' <= c && c <= '9')
    {
        return c - '0';
    }
    else if (
        'a' <= c && c <= 'f')
    {
        return c - 'a' + 10;
    }
    else if (
        'A' <= c && c <= 'F')
    {
        return c - 'A' + 10;
    }
    return 0;
}