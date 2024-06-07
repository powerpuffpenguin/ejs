#include "_duk_rand.h"
#include <stdlib.h>
#include <time.h>
void _ejs_srand(unsigned int seed)
{
    static int flags = 0;
    if (seed)
    {
        if (!flags)
        {
            flags = 1;
        }
        srand(seed);
    }
    else if (!flags)
    {
        flags = 1;
        srand(time(0));
    }
}
int _ejs_rand()
{
    _ejs_srand(0);
    return rand();
}