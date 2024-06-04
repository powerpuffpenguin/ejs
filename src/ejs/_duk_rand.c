#include "_duk_rand.h"
#include <stdlib.h>
#include <time.h>
int _ejs_rand()
{
    static int seed = 0;
    if (!seed)
    {
        srand(time(0));
        seed = 1;
    }
    return rand();
}