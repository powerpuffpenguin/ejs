#include "core.h"
#include "utils.h"
#include "error.h"

#include <stdlib.h>
#include <string.h>

ejs_core_t *ejs_core_new(int *err)
{
    ejs_core_t *core = (ejs_core_t *)malloc(sizeof(ejs_core_t));
    if (!core)
    {
        EJS_SAFE_SET_ERROR(err, EJS_ERROR_MALLOC);
        return 0;
    }
    memset(core, 0, sizeof(ejs_core_t));
    core->base = event_base_new();
    if (!core->base)
    {
        EJS_SAFE_SET_ERROR(err, EJS_ERROR_EVENT_BASE_NEW);
        goto ERR;
    }
    EJS_SAFE_SET_ERROR(err, EJS_ERROR_OK)
    return core;
ERR:
    ejs_core_free(core);
    return 0;
}
void ejs_core_free(ejs_core_t *core)
{
    EJS_SAFE_DELETE_F(event_base_free, core->base);

    free(core);
}

int ejs_core_dispatch(ejs_core_t *core)
{
    int err = event_base_dispatch(core->base);
    if (err == 0)
    {
        return EJS_ERROR_OK;
    }
    return err > 0 ? EJS_ERROR_NO_EVENT : EJS_ERROR_NO_EVENT_BASE_DISPATCH;
}