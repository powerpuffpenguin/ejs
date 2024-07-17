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
uint8_t __ejs_modules_shared_unhex(uint8_t c, duk_bool_t *ok)
{

    if ('0' <= c && c <= '9')
    {
        EJS_SET_OUTPUT(ok, 1);
        return c - '0';
    }
    else if ('a' <= c && c <= 'f')
    {
        EJS_SET_OUTPUT(ok, 1);
        return c - 'a' + 10;
    }
    else if ('A' <= c && c <= 'F')
    {
        EJS_SET_OUTPUT(ok, 1);
        return c - 'A' + 10;
    }
    EJS_SET_OUTPUT(ok, 0);
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
size_t __ejs_modules_shared_strings_index(const uint8_t *s, const size_t s_len, uint8_t c)
{
    for (size_t i = 0; i < s_len; i++)
    {
        if (s[i] == c)
        {
            return i;
        }
    }
    return -1;
}

duk_bool_t __ejs_modules_shared_strings_contains(const uint8_t *s, const size_t s_len, uint8_t c)
{
    for (size_t i = 0; i < s_len; i++)
    {
        if (s[i] == c)
        {
            return 1;
        }
    }
    return 0;
}
duk_bool_t __ejs_modules_shared_strings_contains_any(const uint8_t *s, const size_t s_len, const uint8_t *c, const size_t c_len)
{
    size_t j;
    for (size_t i = 0; i < s_len; i++)
    {
        for (j = 0; j < c_len; j++)
        {
            if (s[i] == c[j])
            {
                return 1;
            }
        }
    }
    return 0;
}