#include "error.h"

DUK_EXTERNAL const char *ejs_error(const EJS_ERROR_RET err)
{
    switch (err)
    {
    case EJS_ERROR_OK:
        return "ok";
    case EJS_ERROR_INVALID_ARGUMENT:
        return "invalid argument";
    case EJS_ERROR_NOT_SUPPORT:
        return "platform not support";

    case EJS_ERROR_OS:
        return "os error";

    case EJS_ERROR_SHORT_READ:
        return "short read";

    case EJS_ERROR_INVALID_MODULE_NAME:
        return "invalid module name";
    case EJS_ERROR_INVALID_MODULE_FILE:
        return "invalid module file";
    case EJS_ERROR_LARGE_MODULE:
        return "module size exceeds  limit";
    case EJS_ERROR_MODULE_READ_FAIL:
        return "an exception occurred while reading the module";
    case EJS_ERROR_MODULE_NOT_EXISTS:
        return "module not exists";
    case EJS_ERROR_MODULE_NO_PACKAGE:
        return "not found package.json";
    case EJS_ERROR_MODULE_UNKNOW_PACKAGE:
        return "package.json format unknow";
    case EJS_ERROR_MODULE_PACKAGE_READ_FAIL:
        return "an exception occurred while reading the package.json";
    case EJS_ERROR_MODULE_NAME_REPEAT:
        return "module name repeat";
    case EJS_ERROR_INVALID_MODULE_FUNC:
        return "invalid module init func";

    case EJS_ERROR_MALLOC:
        return "malloc fail";
    case EJS_ERROR_GETCWD:
        return "getcwd fail";

    case EJS_ERROR_DUK_CREATE_HEAP:
        return "duk_create_heap_default fail";
    case EJS_ERROR_DUK_CHECK_STACK_TOP:
        return "duk_check_stack_top fail";
    case EJS_ERROR_DUK_EXTRAS_INIT:
        return "duk extras init fail";

    case EJS_ERROR_EVENT_BASE_NEW:
        return "event_base_new fail";
    case EJS_ERROR_EVENT_BASE_SET:
        return "event_base_set fail";
    case EJS_ERROR_EVENT_NEW:
        return "event_new fail";
    case EJS_ERROR_EVENT_ASSIGN:
        return "event_assign fail";
    case EJS_ERROR_EVENT_ADD:
        return "event_add fail";
    case EJS_ERROR_EVENT_DEL:
        return "event_del fail";
    case EJS_ERROR_NO_EVENT:
        return "event_base_dispatch no event";
    case EJS_ERROR_NO_EVENT_BASE_DISPATCH:
        return "event_base_dispatch fail";
    }

    return "unknow";
}