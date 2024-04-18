#ifndef _EMBEDDED_JS_CONFIG_H_
#define _EMBEDDED_JS_CONFIG_H_

/**
 * max js module size. default is 8m
 */
#ifndef EJS_CONFIG_MAX_JS_SIZE
#define EJS_CONFIG_MAX_JS_SIZE 8
#endif

#ifndef EJS_CONFIG_OS
#define EJS_CONFIG_OS "unknow-os", 9
#endif

#ifndef EJS_CONFIG_ARCH
#define EJS_CONFIG_ARCH "unknow-arch", 11
#endif

// #ifndef EJS_CONFIG_SEPARATOR_WINDOWS
#define EJS_CONFIG_SEPARATOR_WINDOWS
// #endif

#endif