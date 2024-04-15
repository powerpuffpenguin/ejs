#include <stdio.h>
#include "ejs/core.h"
#include "ejs/error.h"

int main(int argc, char **argv)
{
    // create execution environment
    int err = 0;
    ejs_core_t *core = ejs_core_new(&err);
    if (!core)
    {
        puts(ejs_error(err));
        return -1;
    }

    // dispatch event loop
    err = ejs_core_dispatch(core);
    if (err)
    {
        puts(ejs_error(err));
    }

    // release resources
    ejs_core_free(core);
    return 0;
}
