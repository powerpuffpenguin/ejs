#include "path.h"

#include <stdlib.h>
#include <string.h>
// A lazybuf is a lazily constructed path buffer.
// It supports append, reading previously appended bytes,
// and retrieving the final string. It does not allocate a buffer
// to hold the output until that output diverges from s.
typedef struct
{
    ejs_string_t *s;
    char *buf;
    int w;
} lazybuf_t;

static char lazybuf_index(lazybuf_t *b, int i)
{
    if (b->buf != NULL)
    {
        return b->buf[i];
    }
    return b->s->c[i];
}
static EJS_ERROR_RET lazybuf_append(lazybuf_t *b, char c)
{
    if (!b->buf)
    {
        if (b->w < b->s->len && b->s->c[b->w] == c)
        {
            b->w++;
            return EJS_ERROR_OK;
        }
        b->buf = (char *)malloc(b->s->len);
        if (!b->buf)
        {
            return EJS_ERROR_MALLOC;
        }
        memmove(b->buf, b->s->c, b->w);
    }
    b->buf[b->w] = c;
    b->w++;
    return EJS_ERROR_OK;
}
static EJS_ERROR_RET ejs_path_clean_impl(ejs_string_t *path, ejs_string_t *out_path, ejs_stirng_reference_t *reference)
{
    EJS_ERROR_RET ret = EJS_ERROR_OK;
    if (path->len == 0)
    {
        ejs_string_set_lstring(out_path, ".", 1);
        return ret;
    }
    BOOL rooted = path->c[0] == '/';
    int n = path->len;

    // Invariants:
    //	reading from path; r is index of next byte to process.
    //	writing to buf; w is index of next byte to write.
    //	dotdot is index in buf where .. must stop, either because
    //		it is the leading slash or it is a leading ../../.. prefix.

    lazybuf_t out;
    out.s = path;
    out.buf = NULL;
    out.w = 0;

    char r = 0;
    char dotdot = 0;
    if (rooted)
    {
        ret = lazybuf_append(&out, '/');
        if (ret)
        {
            return ret;
        }
        r = 1;
        dotdot = 1;
    }
    while (r < n)
    {
        if (path->c[r] == '/')
        {
            // empty path element
            r++;
        }
        else if (path->c[r] == '.' && (r + 1 == n || path->c[r + 1] == '/'))
        {
            // . element
            r++;
        }
        else if (path->c[r] == '.' && path->c[r + 1] == '.' && (r + 2 == n || path->c[r + 2] == '/'))
        {
            // .. element: remove to last /
            r += 2;
            if (out.w > dotdot)
            {
                while (out.w > dotdot && lazybuf_index(&out, out.w) != '/')
                {
                    out.w--;
                }
            }
            else if (!rooted)
            {
                // cannot backtrack, but not rooted, so append .. element.
                if (out.w > 0)
                {
                    ret = lazybuf_append(&out, '/');
                    if (ret)
                    {
                        return ret;
                    }
                }
                ret = lazybuf_append(&out, '.');
                if (ret)
                {
                    return ret;
                }
                ret = lazybuf_append(&out, '.');
                if (ret)
                {
                    return ret;
                }
                dotdot = out.w;
            }
        }
        else
        {
            // real path element.
            // add slash if needed
            if (rooted && out.w != 1 || !rooted && out.w != 0)
            {
                ret = lazybuf_append(&out, '/');
                if (ret)
                {
                    return ret;
                }
            }
            // copy element
            for (; r < n && path->c[r] != '/'; r++)
            {
                ret = lazybuf_append(&out, path->c[r]);
                if (ret)
                {
                    return ret;
                }
            }
        }
    }

    // Turn empty string into "."
    if (out.w == 0)
    {
        ejs_string_set_lstring(out_path, ".", 1);
        return ret;
    }

    if (out.buf)
    {
        ejs_string_set_lstring(out_path, out.buf, out.w);
        out_path->reference = reference;
        reference->used = 1;
        reference->c = out.buf;
        reference->len = path->len;
    }
    else
    {
        ejs_string_substr(out_path, path, 0, out.w);
    }
    return ret;
}
EJS_ERROR_RET ejs_path_clean(ejs_string_t *path, ejs_string_t *out_path, ejs_stirng_reference_t *reference)
{
    ejs_string_t tmp = *path;
    while (tmp.len >= 2 && tmp.c[0] == '.' && tmp.c[1] == '/')
    {
        tmp.c += 2;
        tmp.len -= 2;
    }
    return ejs_path_clean_impl(&tmp, out_path, reference);
}
static int lastSlash(ejs_string_t *s)
{
    int i = s->len - 1;
    while (i >= 0 && s->c[i] != '/')
    {
        i--;
    }
    return i;
}
void ejs_path_dir(ejs_string_t *path, ejs_string_t *dir)
{
    int i = lastSlash(path);
    if (i == 0)
    {
        ejs_string_set_lstring(dir, "", 0);
    }
    else
    {
        ejs_string_substr(dir, path, 0, i + 1);
    }
}

EJS_ERROR_RET ejs_path_join(ejs_string_t **s, int n, ejs_string_t *join, ejs_stirng_reference_t *reference)
{
    int size = 0;
    for (int i = 0; i < n; i++)
    {
        size += s[i]->len;
    }
    if (size == 0)
    {
        ejs_string_set_lstring(join, "", 0);
        return EJS_ERROR_OK;
    }

    return EJS_ERROR_OK;
}