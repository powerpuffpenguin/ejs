#include "itoa.h"
size_t ppp_itoa(size_t num, unsigned char *str, size_t len, int base)
{
    if (!len)
    {
        return -1;
    }

    size_t sum = num;
    size_t i = 0;
    size_t digit;

    do
    {
        digit = sum % base;
        if (digit < 0xA)
        {
            str[i++] = '0' + digit;
        }
        else
        {
            str[i++] = 'A' + digit - 0xA;
        }
        sum /= base;
    } while (sum && (i < len));

    if (i == len && sum)
    {
        return -1;
    }

    for (int j = 0; j < i / 2; j++)
    {
        char temp = str[j];
        str[j] = str[i - j - 1];
        str[i - j - 1] = temp;
    }
    return i;
}