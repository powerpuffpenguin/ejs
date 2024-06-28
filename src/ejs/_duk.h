#ifndef _EMBEDDED_JS__DUK_H_
#define _EMBEDDED_JS__DUK_H_
#include "../duk/duktape.h"
#include <sys/stat.h>

void _ejs_init_base(duk_context *ctx);
void _ejs_init_extras(duk_context *ctx);

/**
 * open source file return fd and source_len
 */
int _ejs_open_source(const char *path, struct stat *info);

/**
 * read fd,
 * success return 0, fail return -1
 */
int _ejs_read_limit(int fd, char *source, size_t minread);

#endif