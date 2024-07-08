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
duk_bool_t __ejs_modules_shared_strings_contains_ctl(const uint8_t *s, const size_t s_len)
{
    uint8_t b;
    for (size_t i = 0; i < s_len; i++)
    {
        b = s[i];
        if (b < ' ' || b == 0x7f)
        {
            return 1;
        }
    }
    return 0;
}
