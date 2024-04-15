#include "error.h"

const char *ejs_error(const int err)
{
    switch (err)
    {
    case EJS_ERROR_OK:
        return "ok";

    case EJS_ERROR_MALLOC:
        return "malloc fail";

    case EJS_ERROR_EVENT_BASE_NEW:
        return "event_base_new fail";
    case EJS_ERROR_NO_EVENT:
        return "event_base_dispatch no event";
    case EJS_ERROR_NO_EVENT_BASE_DISPATCH:
        return "event_base_dispatch fail";
    }

    return "Unknow";
}