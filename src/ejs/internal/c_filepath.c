#include "c_filepath.h"

#include <errno.h>
#include <stdio.h>
#include <string.h>
#include <stdarg.h>

#include <sys/stat.h>
#include <sys/param.h>
#include <dirent.h>
#include <unistd.h>
#include <fcntl.h>

size_t ppp_filepath_itoa(size_t num, unsigned char *str, size_t len, int base)
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

#ifdef PPP_FILEPATH_WINDOWS
// cutPath slices path around the first path separator.
static BOOL ppp_c_filepath_cut_path(ppp_c_fast_string_t *path,
                                    ppp_c_fast_string_t *before, ppp_c_fast_string_t *after)
{
    for (size_t i = 0; i < path->len; i++)
    {
        switch (path->str[i])
        {
        case '\\':
        case '/':
            if (before)
            {
                ppp_c_string_sub_end(before, path, i);
            }
            if (after)
            {
                ppp_c_string_sub_begin(after, path, i + 1);
            }
            return TRUE;
        }
    }
    if (before)
    {
        *before = *path;
    }
    if (after)
    {
        after->len = 0;
        after->str = 0;
    }
    return FALSE;
}

static size_t ppp_c_filepath_volume_name_len(const char *path, size_t path_len)
{
    if (path_len < 2)
    {
        return 0;
    }
    // with drive letter
    if (path[1] == ':' &&
        (('a' <= path[0] && path[0] <= 'z') ||
         ('A' <= path[0] && path[0] <= 'Z')))
    {
        return 2;
    }
    // UNC and DOS device paths start with two slashes.
    if (!PPP_FILEPATH_IS_SEPARATOR(path[0]) || !PPP_FILEPATH_IS_SEPARATOR(path[1]))
    {
        return 0;
    }
    ppp_c_fast_string_t rest = {
        .str = path + 2,
        .len = path_len - 2,
    };
    ppp_c_fast_string_t p1, p2;
    ppp_c_filepath_cut_path(&rest, &p1, &rest);
    if (!ppp_c_filepath_cut_path(&rest, &p2, &rest))
    {
        return path_len;
    }

    if (p1.len != 1 || (p1.str[0] != '.' && p1.str[0] != '?'))
    {
        // This is a UNC path: \\${HOST}\${SHARE}\ 
		return path_len - rest.len - 1;
    }
    // This is a DOS device path.
    if (p2.len == 3 &&
        PPP_CHAR_TO_UPPER(p2.str[0]) == 'U' &&
        PPP_CHAR_TO_UPPER(p2.str[1]) == 'N' &&
        PPP_CHAR_TO_UPPER(p2.str[2]) == 'C')
    {
        // This is a DOS device path that links to a UNC: \\.\UNC\${HOST}\${SHARE}\ 
         ppp_c_filepath_cut_path(&rest, 0, &rest); // host
        if (!ppp_c_filepath_cut_path(&rest, 0, &rest)) // share
        {
            return path_len;
        }
    }
    return path_len - rest.len - 1;
}
#else
#define ppp_c_filepath_volume_name_len(path, path_len) 0
#endif

int ppp_c_filepath_append_separator(ppp_c_string_t *path)
{
    if (path->len && PPP_FILEPATH_IS_SEPARATOR(path->str[path->len - 1]))
    {
        return 0;
    }
    return ppp_c_string_append_char(path, PPP_FILEPATH_SEPARATOR);
}
int ppp_c_filepath_join_one_raw(ppp_c_string_t *path, const char *name, size_t n)
{
    if (n)
    {
        if (!path->len)
        {
            return ppp_c_string_append(path, name, n);
        }

        if (PPP_FILEPATH_IS_SEPARATOR(path->str[path->len - 1]) ||
            (n > 0 && PPP_FILEPATH_IS_SEPARATOR(name[0])))
        {
            return ppp_c_string_append(path, name, n);
        }
        else if (ppp_c_string_grow(path, n + 1))
        {
            return -1;
        }
        ppp_c_string_append_char_raw(path, PPP_FILEPATH_SEPARATOR);
        ppp_c_string_append_raw(path, name, n);
    }
    return 0;
}

int ppp_c_filepath_from_slash(ppp_c_string_t *path)
{
    if (PPP_FILEPATH_SEPARATOR != '/')
    {
        size_t i = 0;
        for (; i < path->len; i++)
        {
            if (path->str[i] == '/')
            {
                if (!path->cap)
                {
                    char *p = malloc(path->len + 1);
                    if (!p)
                    {
                        return -1;
                    }
                    memmove(p, path->str, path->len);
                    p[path->len] = 0;
                    path->str = p;
                    path->cap = path->len;
                }
                path->str[i++] = PPP_FILEPATH_SEPARATOR;
                break;
            }
        }
        for (; i < path->len; i++)
        {
            if (path->str[i] == '/')
            {
                path->str[i] = PPP_FILEPATH_SEPARATOR;
            }
        }
    }
    return 0;
}
int ppp_c_filepath_to_slash(ppp_c_string_t *path)
{
    if (PPP_FILEPATH_SEPARATOR != '/')
    {
        size_t i = 0;
        for (; i < path->len; i++)
        {
            if (path->str[i] == PPP_FILEPATH_SEPARATOR)
            {
                if (!path->cap)
                {
                    char *p = malloc(path->len + 1);
                    if (!p)
                    {
                        return -1;
                    }
                    memmove(p, path->str, path->len);
                    p[path->len] = 0;
                    path->str = p;
                }
                path->str[i++] = '/';
                break;
            }
        }
        for (; i < path->len; i++)
        {
            if (path->str[i] == PPP_FILEPATH_SEPARATOR)
            {
                path->str[i] = '/';
            }
        }
    }
    return 0;
}
typedef struct
{
    ppp_c_fast_string_t path;
    char *buf;
    size_t buf_len;
    size_t w;
    ppp_c_string_t *volAndPath;

#ifdef PPP_FILEPATH_WINDOWS
    char *p;
    size_t volLen;
#endif
} ppp_c_filepath_lazybuf_t;
static int ppp_c_filepath_lazybuf_append_char(ppp_c_filepath_lazybuf_t *b, char c)
{
    if (!b->buf)
    {
        if (b->w < b->path.len && b->path.str[b->w] == c)
        {
            b->w++;
            return 0;
        }

#ifdef PPP_FILEPATH_WINDOWS
        b->buf_len = b->path.len + b->volLen + 2;
        b->p = malloc(b->buf_len + 1); // '.\'
        if (!b->p)
        {
            return -1;
        }
        b->buf = b->p + b->volLen + 2;
#else
        b->buf_len = b->path.len;
        b->buf = malloc(b->buf_len + 1);
        if (!b->buf)
        {
            return -1;
        }
#endif
        memcpy(b->buf, b->path.str, b->w);
    }
    b->buf[b->w++] = c;
    return 0;
}
static inline char ppp_c_filepath_lazybuf_index(ppp_c_filepath_lazybuf_t *b, size_t i)
{
    return b->buf ? b->buf[i] : b->path.str[i];
}
static void ppp_c_filepath_lazybuf_string(ppp_c_filepath_lazybuf_t *b, ppp_c_string_t *s)
{
    if (b->buf)
    {
#ifdef PPP_FILEPATH_WINDOWS
        if (b->volLen)
        {
            s->len = b->volLen + b->w;
            b->buf -= b->volLen;
            memmove(b->buf, b->volAndPath->str, b->volLen);
        }
        else
        {
            s->len = b->w;
        }
        if (b->buf != b->p)
        {
            memmove(b->p, b->buf, b->volAndPath->len);
        }
        s->str = b->p;
        s->cap = b->buf_len;
#else
        s->len = b->w;
        s->cap = b->buf_len;
        s->str = b->buf;
#endif
    }
    else
    {
        s->cap = b->volAndPath->cap;
        s->str = b->volAndPath->str;
#ifdef PPP_FILEPATH_WINDOWS
        s->len = b->volLen + b->w;
#else
        s->len = b->w;
#endif
    }
}
int ppp_c_filepath_clean_raw(ppp_c_string_t *originalPath, ppp_c_string_t *cleaned)
{
    ppp_c_fast_string_t path = {
        .str = originalPath->str,
        .len = originalPath->len,
    };
    size_t volLen = ppp_c_filepath_volume_name_len(path.str, path.len);
    path.str += volLen;
    path.len -= volLen;
    if (!path.len)
    {
        *cleaned = *originalPath;
        if (volLen > 1 &&
            PPP_FILEPATH_IS_SEPARATOR(originalPath->str[0]) &&
            PPP_FILEPATH_IS_SEPARATOR(originalPath->str[1]))
        {
            // should be UNC
            return ppp_c_filepath_from_slash(cleaned);
        }
        return ppp_c_string_append_char(cleaned, '.');
    }
    uint8_t rooted = PPP_FILEPATH_IS_SEPARATOR(path.str[0]);
    // Invariants:
    //	reading from path; r is index of next byte to process.
    //	writing to buf; w is index of next byte to write.
    //	dotdot is index in buf where .. must stop, either because
    //		it is the leading slash or it is a leading ../../.. prefix.
    size_t n = path.len;
#ifdef PPP_FILEPATH_WINDOWS
    ppp_c_filepath_lazybuf_t out = {
        .path = path,
        .buf = 0,
        .p = 0,
        .buf_len = 0,
        .w = 0,
        .volAndPath = originalPath,
        .volLen = volLen,
    };
#else
    ppp_c_filepath_lazybuf_t out = {
        .path = path,
        .buf = 0,
        .buf_len = 0,
        .w = 0,
        .volAndPath = originalPath,
    };
#endif

    size_t r = 0;
    size_t dotdot = 0;
    if (rooted)
    {
        if (ppp_c_filepath_lazybuf_append_char(&out, PPP_FILEPATH_SEPARATOR))
        {
            return -1;
        }
        r = 1;
        dotdot = 1;
    }
    while (r < n)
    {
        if (PPP_FILEPATH_IS_SEPARATOR(path.str[r]))
        {
            r++;
        }
        else if (path.str[r] == '.' &&
                 (r + 1 == n || PPP_FILEPATH_IS_SEPARATOR(path.str[r + 1])))
        {
            r++;
        }
        else if (path.str[r] == '.' &&
                 path.str[r + 1] == '.' &&
                 (r + 2 == n || PPP_FILEPATH_IS_SEPARATOR(path.str[r + 2])))
        {
            // .. element: remove to last separator
            r += 2;
            if (out.w > dotdot)
            {
                // can backtrack
                out.w--;
                char c;

                while (out.w > dotdot)
                {
                    c = ppp_c_filepath_lazybuf_index(&out, out.w);
                    if (PPP_FILEPATH_IS_SEPARATOR(c))
                    {
                        break;
                    }
                    out.w--;
                }
            }
            else if (!rooted)
            {
                // cannot backtrack, but not rooted, so append .. element.
                if (out.w > 0)
                {
                    if (ppp_c_filepath_lazybuf_append_char(&out, PPP_FILEPATH_SEPARATOR))
                    {
                        return -1;
                    }
                }

                if (ppp_c_filepath_lazybuf_append_char(&out, '.'))
                {
                    return -1;
                }
                if (ppp_c_filepath_lazybuf_append_char(&out, '.'))
                {
                    return -1;
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
                if (ppp_c_filepath_lazybuf_append_char(&out, PPP_FILEPATH_SEPARATOR))
                {
                    return -1;
                }
            }
            // copy element
            for (; r < n && !PPP_FILEPATH_IS_SEPARATOR(path.str[r]); r++)
            {
                if (ppp_c_filepath_lazybuf_append_char(&out, path.str[r]))
                {
                    return -1;
                }
            }
        }
    }

    // Turn empty string into "."
    if (out.w == 0)
    {
#ifdef PPP_FILEPATH_WINDOWS
        if (out.volLen)
        {
            if (ppp_c_filepath_lazybuf_append_char(&out, '.'))
            {
                return -1;
            }
            ppp_c_filepath_lazybuf_string(&out, cleaned);
            return ppp_c_filepath_from_slash(cleaned);
        }
#endif

        if (out.buf)
        {
#ifdef PPP_FILEPATH_WINDOWS
            cleaned->str = out.p;
#else
            cleaned->str = out.buf;
#endif
            cleaned->str[0] = '.';
            cleaned->len = 1;
            cleaned->cap = out.buf_len;
        }
        else
        {
            cleaned->str = ".";
            cleaned->len = 1;
            cleaned->cap = 0;
        }
        return 0;
    }
#ifdef PPP_FILEPATH_WINDOWS
    if (!out.volLen && out.buf)
    {
        // If a ':' appears in the path element at the start of a Windows path,
        // insert a .\ at the beginning to avoid converting relative paths
        // like a/../c: into c:.
        for (size_t i = 0; i < out.w; i++)
        {
            if (PPP_FILEPATH_IS_SEPARATOR(out.buf[i]))
            {
                break;
            }
            else if (out.buf[i] == ':')
            {
                out.buf -= 2;
                out.buf[0] = '.';
                out.buf[1] = '\\';
                out.w += 2;
                out.buf_len += 2;
                break;
            }
        }
    }
#endif

    ppp_c_filepath_lazybuf_string(&out, cleaned);
    return ppp_c_filepath_from_slash(cleaned);
}

int ppp_c_filepath_clean(ppp_c_string_t *path)
{
    ppp_c_string_t cleaned = {0};
    int err = ppp_c_filepath_clean_raw(path, &cleaned);
    if (err)
    {
        return err;
    }
    if (path->cap)
    {
        if (path->str != cleaned.str)
        {
            free(path->str);
        }
    }
    *path = cleaned;
    return 0;
}
BOOL ppp_c_filepath_is_abs_raw(const char *path, size_t path_len)
{
#ifdef PPP_FILEPATH_WINDOWS
    if (path_len < 2)
    {
        return FALSE;
    }
    size_t l = ppp_c_filepath_volume_name_len(path, path_len);
    if (!l)
    {
        return FALSE;
    }
    // If the volume name starts with a double slash, this is an absolute path.
    if (PPP_FILEPATH_IS_SEPARATOR(path[0]) && PPP_FILEPATH_IS_SEPARATOR(path[1]))
    {
        return TRUE;
    }
    path_len -= l;
    if (path_len == l)
    {
        return FALSE;
    }
    switch (path[l])
    {
    case '/':
    case '\\':
        return TRUE;
    }
    return FALSE;
#else
    return path_len > 0 && path[0] == '/' ? TRUE : FALSE;
#endif
}
void ppp_c_filepath_split_raw(const char *path, const size_t path_len, ppp_c_fast_string_t *dir, ppp_c_fast_string_t *file)
{
    if (!path_len)
    {
        if (dir)
        {
            dir->len = 0;
            dir->str = "";
        }
        if (file)
        {
            file->len = 0;
            file->str = "";
        }
        return;
    }
    size_t vol = ppp_c_filepath_volume_name_len(path, path_len);
    size_t i = path_len - 1;
    while (i >= vol && i != -1 && !PPP_FILEPATH_IS_SEPARATOR(path[i]))
    {
        i--;
    }
    i++;
    if (dir)
    {
        dir->len = i;
        dir->str = path;
    }
    if (file)
    {
        file->len = path_len - i;
        file->str = path + i;
    }
}

#ifndef PPP_FILEPATH_WINDOWS
typedef struct
{
    ppp_c_string_iteratorable_t *raw;
    size_t skip;
    size_t i;
    uint8_t join;
} ppp_c_filepath_iteratorable_state_t;

static void __ppp_c_filepath_iterator_next(void *p, ppp_c_string_iterator_t *iter)
{
    ppp_c_filepath_iteratorable_state_t *state = p;
    while (state->skip != state->i)
    {
        state->raw->next(state->raw->state, iter);
        ++state->i;
        if (!iter->ok)
        {
            return;
        }
    }
    state->raw->next(state->raw->state, iter);
    if (state->join < 2)
    {
        state->join++;
    }
}
static void __ppp_c_filepath_iterator_reset(void *p)
{
    ppp_c_filepath_iteratorable_state_t *state = p;
    state->raw->reset(state->raw->state);
    state->i = 0;
    state->join = 0;
}
#endif
int ppp_c_filepath_join(ppp_c_string_t *output, ppp_c_string_iteratorable_t *iteratorable)
{
    ppp_c_string_iterator_t iter;
#ifdef PPP_FILEPATH_WINDOWS
    char lastChar = 0;
    const char *s;
    size_t s_len;
    output->len = 0;
    for (iteratorable->next(iteratorable->state, &iter); iter.ok; iteratorable->next(iteratorable->state, &iter))
    {
        s = iter.str;
        s_len = iter.len;
        if (output->len) // Add the first non-empty path element unchanged.
        {
            switch (lastChar)
            {
            case '\\':
            case '/':
                // If the path ends in a slash, strip any leading slashes from the next
                // path element to avoid creating a UNC path (any path starting with "\\")
                // from non-UNC elements.
                //
                // The correct behavior for Join when the first element is an incomplete UNC
                // path (for example, "\\") is underspecified. We currently join subsequent
                // elements so Join("\\", "host", "share") produces "\\host\share".
                while (s_len && s[0] == '\\' || s[0] == '/')
                {
                    s++;
                    s_len--;
                }
                break;
            case ':':
                // If the path ends in a colon, keep the path relative to the current directory
                // on a drive and don't add a separator. Preserve leading slashes in the next
                // path element, which may make the path absolute.
                //
                // 	Join(`C:`, `f`) = `C:f`
                //	Join(`C:`, `\f`) = `C:\f`
                break;
            default:
                // In all other cases, add a separator between elements.
                if (ppp_c_string_append_char(output, '\\'))
                {
                    return -1;
                }
                lastChar = '\\';
                break;
            }
        }
        if (s_len)
        {
            if (ppp_c_string_append(output, s, s_len))
            {
                return -1;
            }
            lastChar = s[s_len - 1];
        }
    }
    if (!output->len)
    {
        return 0;
    }
#else
    ppp_c_filepath_iteratorable_state_t join_state = {
        .raw = iteratorable,
        .skip = 0,
        .i = 0,
        .join = 0,
    };
    iteratorable->reset(iteratorable->state);
    for (iteratorable->next(iteratorable->state, &iter); iter.ok; iteratorable->next(iteratorable->state, &iter))
    {
        if (iter.len)
        {
            break;
        }
        else
        {
            join_state.skip++;
        }
    }
    if (!iter.ok)
    {
        output->len = 0;
        return 0;
    }
    iteratorable->reset(iteratorable->state);

    char c = PPP_FILEPATH_SEPARATOR;
    ppp_c_string_iteratorable_t join_iteratorable = {
        .state = &join_state,
        .reset = __ppp_c_filepath_iterator_reset,
        .next = __ppp_c_filepath_iterator_next,
    };
    if (ppp_c_string_join(output, &join_iteratorable, &c, 1))
    {
        return -1;
    }
    if (join_state.join < 2)
    {
        return 0;
    }
#endif
    return ppp_c_filepath_clean(output);
}

int ppp_c_filepath_abs(ppp_c_string_t *path)
{
    // path empth return current work directory
    if (!path->len)
    {
        if (path->cap)
        {
            if (getcwd(path->str, path->cap))
            {
                path->len = strlen(path->str);
                return 0;
            }
            else if (errno != ERANGE || path->cap >= MAXPATHLEN)
            {
                return -1;
            }
        }
        char *dir = malloc(MAXPATHLEN + 1);
        if (!dir)
        {
            return -1;
        }
        if (!getcwd(dir, MAXPATHLEN))
        {
            free(dir);
            return -1;
        }
        if (path->cap)
        {
            free(path->str);
        }
        path->str = dir;
        path->len = strlen(dir);
        path->cap = MAXPATHLEN;
        return 0;
    }

    // if abs return clean
    if (ppp_c_filepath_is_abs(path))
    {
        return ppp_c_filepath_clean(path);
    }

    // return clean(join(cwd,path))
    char dir[MAXPATHLEN + 1];
    if (!getcwd(dir, MAXPATHLEN))
    {
        return -1;
    }

    size_t dir_len = strlen(dir);
    size_t offset = (path->len && PPP_FILEPATH_IS_SEPARATOR(path->str[0])) ? 0 : 1;
    if (ppp_c_string_grow(path, dir_len + offset))
    {
        return -1;
    }
    memmove(path->str + dir_len + offset, path->str, path->len);
    memcpy(path->str, dir, dir_len);
    if (offset)
    {
        path->str[dir_len] = PPP_FILEPATH_SEPARATOR;
    }
    path->len += dir_len + offset;

    return ppp_c_filepath_clean(path);
}

void ppp_c_filepath_base_raw(ppp_c_fast_string_t *output, const char *path, size_t path_len)
{
    if (!path_len)
    {
        output->str = ".";
        output->len = 1;
        return;
    }

    // Strip trailing slashes.
    while (path_len > 0 && PPP_FILEPATH_IS_SEPARATOR(path[path_len - 1]))
    {
        path_len--;
    }
// Throw away volume name
#ifdef PPP_FILEPATH_WINDOWS
    size_t vollen = ppp_c_filepath_volume_name_len(path, path_len);
    path += vollen;
    path_len -= vollen;
#endif
    // Find the last element
    size_t i = path_len - 1;
    while (i != -1 && !PPP_FILEPATH_IS_SEPARATOR(path[i]))
    {
        i--;
    }
    if (i != -1)
    {
        i++;
        path += i;
        path_len -= i;
    }
    // If empty now, it had only slashes.
    if (!path_len)
    {
        output->len = 1;
#ifdef PPP_FILEPATH_WINDOWS
        output->str = "\\";
#else
        output->str = "/";
#endif
        return;
    }

    output->len = path_len;
    output->str = path;
}

void ppp_c_filepath_ext_raw(ppp_c_fast_string_t *output, const char *path, size_t path_len)
{
    for (size_t i = path_len - 1; i != -1 && !PPP_FILEPATH_IS_SEPARATOR(path[i]); i--)
    {
        if (path[i] == '.')
        {
            output->str = path + i;
            output->len = path_len - i;
            return;
        }
    }
    output->len = 0;
    output->str = "";
}
typedef struct
{
    ppp_c_string_t *path;
} ppp_c_filepath_remove_all_args_t;

static int ppp_c_filepath_remove_all_impl(ppp_c_filepath_remove_all_args_t *args)
{
    size_t path_len = args->path->len;

    // remove all children
    DIR *dir = opendir(args->path->str);
    if (!dir)
    {
        return -1;
    }
    struct dirent *dirent;
    size_t len;
    struct stat info;
    int err;
    while (1)
    {
        errno = 0;
        dirent = readdir(dir);
        if (!dirent)
        {
            if (errno)
            {
                err = errno;
                closedir(dir);
                errno = err;
                return -1;
            }
            closedir(dir);
            break;
        }
        if (dirent->d_name[0] == '.')
        {
            if (dirent->d_name[1] == 0)
            {
                continue;
            }
            else if (dirent->d_name[2] == 0 && dirent->d_name[1] == '.')
            {
                continue;
            }
        }
        len = strlen(dirent->d_name);
        if (!len)
        {
            continue;
        }
        args->path->len = path_len;
        if (ppp_c_filepath_join_one_raw(args->path, dirent->d_name, len))
        {
            err = errno;
            closedir(dir);
            errno = err;
            return -1;
        }
        args->path->str[args->path->len] = 0;
        if (lstat(args->path->str, &info))
        {
            err = errno;
            closedir(dir);
            errno = err;
            return -1;
        }
        if (S_ISDIR(info.st_mode))
        {
            if (ppp_c_filepath_remove_all_impl(args))
            {
                err = errno;
                closedir(dir);
                errno = err;
                return -1;
            }
        }
        else
        {
            // printf(" remove %s\n", path->str);
            if (remove(args->path->str))
            {
                err = errno;
                if (err != ENOENT)
                {
                    closedir(dir);
                    errno = err;
                    return -1;
                }
            }
        }
    }

    // remove empty dir
    args->path->str[path_len] = 0;
    // printf(" rmdir %s\n", path->str);
    if (rmdir(args->path->str))
    {
        err = errno;
        if (err != ENOENT) // already remove by other
        {
            return -1;
        }
    }
    return 0;
}
static int ppp_c_filepath_rmdir_all_impl(ppp_c_string_t *path, ppp_c_string_t *cdir)
{
    ppp_c_string_t dir = {0};
    if (ppp_c_filepath_is_abs(path))
    {
        if (cdir)
        {
            dir = *cdir;
        }
        else
        {
            if (ppp_c_string_append(&dir, path->str, path->len))
            {
                return -1;
            }
            dir.str[dir.len] = 0;
        }
    }
    else
    {
        if (cdir)
        {
            if (getcwd(cdir->str, cdir->cap))
            {
                dir.str = cdir->str;
                dir.cap = cdir->cap;
                dir.len = strlen(dir.str);
            }
            else
            {
                int err = errno;
                free(cdir->str);
                if (err != ERANGE)
                {
                    errno = err;
                    return -1;
                }
            }
        }
        if (!dir.str)
        {
            dir.cap = MAXPATHLEN;
            dir.str = malloc(MAXPATHLEN + 1);
            if (!dir.str)
            {
                return -1;
            }
            if (!getcwd(dir.str, MAXPATHLEN))
            {
                int err = errno;
                free(dir.str);
                errno = err;
                return -1;
            }
            dir.len = strlen(dir.str);
        }
        if (ppp_c_filepath_join_one_raw(&dir, path->str, path->len))
        {
            int err = errno;
            free(dir.str);
            errno = err;
            return -1;
        }
        dir.str[dir.len] = 0;
    }
    ppp_c_filepath_remove_all_args_t args = {
        .path = &dir,
    };
    if (ppp_c_filepath_remove_all_impl(&args))
    {
        int err = errno;
        free(dir.str);
        errno = err;
        return -1;
    }
    free(dir.str);
    return 0;
}
int ppp_c_filepath_rmdir_all(ppp_c_string_t *path)
{
    if (!path->len)
    {
        return 0;
    }

    int ret;
    ppp_c_string_t dir = {0};
    if (path->str[path->len])
    {
        ret = rmdir(path->str);
    }
    else
    {
        if (path->cap)
        {
            char c = path->str[path->len];
            path->str[path->len] = 0;
            ret = rmdir(path->str);
            path->str[path->len] = c;
        }
        else
        {
            if (ppp_c_string_append(&dir, path->str, path->len))
            {
                return -1;
            }
            dir.str[path->len] = 0;
            ret = rmdir(dir.str);
        }
    }

    if (ret)
    {
        switch (errno)
        {
        case ENOTEMPTY:
            return ppp_c_filepath_rmdir_all_impl(path, &dir);
        case ENOENT:
            break;
        default:
            if (dir.str)
            {
                int err = errno;
                free(dir.str);
                errno = err;
            }
            return -1;
        }
    }
    if (dir.str)
    {
        free(dir.str);
    }
    return 0;
}
int ppp_c_filepath_remove_all(ppp_c_string_t *path)
{
    if (!path->len)
    {
        return 0;
    }

    int ret;
    ppp_c_string_t dir = {0};
    if (path->str[path->len])
    {
        ret = remove(path->str);
    }
    else
    {
        if (path->cap)
        {
            char c = path->str[path->len];
            path->str[path->len] = 0;
            ret = remove(path->str);
            path->str[path->len] = c;
        }
        else
        {
            if (ppp_c_string_append(&dir, path->str, path->len))
            {
                return -1;
            }
            dir.str[path->len] = 0;
            ret = remove(dir.str);
        }
    }

    if (ret)
    {
        int err = errno;
        switch (err)
        {
        case ENOTEMPTY:
            return ppp_c_filepath_rmdir_all_impl(path, &dir);
        case ENOENT:
            break;
        default:
            if (dir.str)
            {
                int err = errno;
                free(dir.str);
                errno = err;
            }
            return -1;
        }
    }
    if (dir.str)
    {
        free(dir.str);
    }
    return 0;
}
typedef struct
{
    ppp_c_string_t *inpath;
    int perm;

    ppp_c_string_t path;
    struct stat info;
} ppp_c_filepath_mkdir_all_args_t;

static int ppp_c_filepath_mkdir_all_impl(ppp_c_filepath_mkdir_all_args_t *args)
{
    // Fast path: if we can tell whether path is a directory or file, stop with success or error.
    if (!lstat(args->path.str, &args->info))
    {
        if (S_ISDIR(args->info.st_mode))
        {
            return 0;
        }
        errno = ENOTDIR;
        return -1;
    }
    switch (errno)
    {
    case EPERM:
    case ENOENT:
        break;
    default:
        return -1;
    }

    // Slow path: make sure parent exists and then call Mkdir for path.
    size_t i = args->path.len;
    while (i > 0 && PPP_FILEPATH_IS_SEPARATOR(args->path.str[i - 1]))
    {
        // Skip trailing path separator.
        i--;
    }

    size_t j = i;
    while (j > 0 && !PPP_FILEPATH_IS_SEPARATOR(args->path.str[j - 1]))
    {
        // Scan backward over element.
        j--;
    }

    if (j > 1)
    {
        // Create parent.

        --j;
        if (!args->path.cap)
        {
#ifdef PPP_FILEPATH_WINDOWS
            char *s = malloc(args->path.len + 2);
#else
            char *s = malloc(args->path.len + 1);
#endif
            if (!s)
            {
                return -1;
            }
            memmove(s, args->path.str, args->path.len);
            args->path.str = s;
            args->path.cap = args->path.len;
        }

        size_t len = args->path.len;
        char c = args->path.str[j];

#ifdef PPP_FILEPATH_WINDOWS
        char c1 = args->path.str[j + 1];
        if (args->path.len == 6 &&
            PPP_FILEPATH_IS_SEPARATOR(args->path.str[0]) &&
            PPP_FILEPATH_IS_SEPARATOR(args->path.str[1]) &&
            args->path.str[1] == '?' &&
            PPP_FILEPATH_IS_SEPARATOR(args->path.str[3]) &&
            args->path.str[5] == ':')
        {
            args->path.str[j] = '\\';
            args->path.str[j + 1] = 0;
            args->path.len = j + 1;
        }
        else
        {
            args->path.str[j] = 0;
            args->path.len = j;
        }
#else
        args->path.str[j] = 0;
        args->path.len = j;
#endif
        if (ppp_c_filepath_mkdir_all_impl(args))
        {
            return -1;
        }
        args->path.str[j] = c;
#ifdef PPP_FILEPATH_WINDOWS
        args->path.str[j + 1] = c1;
#endif
        args->path.len = len;
    }
    // Parent now exists; invoke Mkdir and use its result.
    if (!mkdir(args->path.str, args->perm))
    {
        // Handle arguments like "foo/." by
        // double-checking that directory doesn't exist.
        if (!lstat(args->path.str, &args->info) && S_ISDIR(args->info.st_mode))
        {
            return 0;
        }
    }
    return -1;
}
int ppp_c_filepath_mkdir_all(ppp_c_string_t *path, int perm)
{
    ppp_c_filepath_mkdir_all_args_t args = {
        .inpath = path,
        .path = *path,
        .perm = perm,
    };
    if (path->str[path->len] && !path->cap)
    {
#ifdef PPP_FILEPATH_WINDOWS
        args.path.str = malloc(path->len + 2);
#else
        args.path.str = malloc(path->len + 1);
#endif
        if (!args.path.str)
        {
            return -1;
        }
        memmove(args.path.str, path->str, path->len);
        args.path.str[path->len] = 0;
        args.path.len = args.path.cap = path->len;
    }
    else
    {
        args.path = *path;
    }
    int err = ppp_c_filepath_mkdir_all_impl(&args);
    if (args.path.cap && args.path.str != path->str)
    {
        if (err)
        {
            int ec = errno;
            free(args.path.str);
            errno = ec;
        }
        else
        {
            free(args.path.str);
        }
    }
    return err;
}

static int __ppp_c_filepath_create_temp_file_or_dir(
    ppp_c_filepath_create_temp_options_t *opts,
    ppp_c_filepath_mkdir_temp_result_t *result,
    char *buf, size_t buf_len,
    BOOL dir)
{
    size_t pos = opts->pattern_len;
    for (size_t i = 0; i < opts->pattern_len; i++)
    {
        switch (opts->pattern[i])
        {
        case '/':
#ifdef EJS_OS_WINDOWS
        case '\\':
#endif
            result->err = 0;
            return -1;
        case '*':
            pos = i;
            break;
        }
    }
    // name len
    size_t cap = opts->pattern_len + 10;
    if (pos != opts->pattern_len)
    {
        // '*' length is 1
        --cap;
    }

    ppp_c_string_t s = {0};
    if (buf && buf_len)
    {
        s.cap = buf_len;
        s.str = buf;
    }

    if (opts->dir_len && opts->dir)
    {
        cap += opts->dir_len;
        uint8_t joinSeparator = 0;
        switch (opts->dir[opts->dir_len - 1])
        {
        case '/':
#ifdef EJS_OS_WINDOWS
        case '\\':
#endif
            break;
        default:
            // join separator length is 1. '/' or '\\'
            ++cap;
            joinSeparator = 1;
            break;
        }

        if (s.cap < cap)
        {
            s.str = malloc(cap + 1);
            if (!s.str)
            {
                result->err = errno;
                return -1;
            }
            s.cap = cap;
        }
        memmove(s.str, opts->dir, opts->dir_len);
        if (joinSeparator)
        {
            s.str[opts->dir_len] = PPP_FILEPATH_SEPARATOR;
            s.len = opts->dir_len + 1;
        }
        else
        {
            s.len = opts->dir_len;
        }
    }
    else
    {
        if (s.cap < cap)
        {
            s.str = malloc(cap + 1);
            if (!s.str)
            {
                result->err = errno;
                return -1;
            }
            s.cap = cap;
        }
    }

    if (pos)
    {
        ppp_c_string_append_raw(&s, opts->pattern, pos);
    }

    size_t prefix = s.len;
    size_t suffix_len = 0;
    const char *suffix = 0;
    if (pos != opts->pattern_len)
    {
        suffix_len = pos + 1;
        suffix = opts->pattern + suffix_len;
        suffix_len = opts->pattern_len - suffix_len;
    }
    char random[10] = {0};
    int random_len;
    size_t try = 0;
    if (dir)
    {
        while (1)
        {
            s.len = prefix;
            random_len = ppp_filepath_itoa(rand() & 2147483647, random, sizeof(random), 10);
            if (random_len == -1)
            {
                continue;
            }
            ppp_c_string_append_raw(&s, random, random_len);
            if (suffix)
            {
                ppp_c_string_append_raw(&s, suffix, suffix_len);
            }
            if (mkdir(ppp_c_string_c_str(&s), opts->perm))
            {
                if (errno == EEXIST && ++try < 10000)
                {
                    continue;
                }
                result->err = errno;
                if (buf && buf_len)
                {
                    if (s.str != buf)
                    {
                        free(s.str);
                    }
                }
                else
                {
                    free(s.str);
                }
                return -1;
            }
            result->name = s;
            result->err = 0;
            break;
        }
        return 1;
    }
    else
    {
        int fd;
        while (1)
        {
            s.len = prefix;
            random_len = ppp_filepath_itoa(rand() & 2147483647, random, sizeof(random), 10);
            if (random_len == -1)
            {
                continue;
            }
            ppp_c_string_append_raw(&s, random, random_len);
            if (suffix)
            {
                ppp_c_string_append_raw(&s, suffix, suffix_len);
            }
            fd = open(ppp_c_string_c_str(&s), O_RDWR | O_CREAT | O_EXCL, opts->perm);
            if (fd == -1)
            {
                if (errno == EEXIST && ++try < 10000)
                {
                    continue;
                }
                result->err = errno;
                if (buf && buf_len)
                {
                    if (s.str != buf)
                    {
                        free(s.str);
                    }
                }
                else
                {
                    free(s.str);
                }
                return -1;
            }
            result->name = s;
            result->err = 0;
            break;
        }
        return fd;
    }
}
BOOL ppp_c_filepath_create_temp_with_buffer(ppp_c_filepath_create_temp_options_t *opts, ppp_c_filepath_create_temp_result_t *result, char *buf, size_t buf_len)
{
    ppp_c_filepath_mkdir_temp_result_t temp;
    result->fd = __ppp_c_filepath_create_temp_file_or_dir(opts, &temp, buf, buf_len, 0);
    if (result->fd == -1)
    {
        result->err = temp.err;
        return FALSE;
    }
    result->name = temp.name;
    return TRUE;
}
BOOL ppp_c_filepath_mkdir_temp_with_buffer(ppp_c_filepath_create_temp_options_t *opts, ppp_c_filepath_mkdir_temp_result_t *result, char *buf, size_t buf_len)
{
    int fd = __ppp_c_filepath_create_temp_file_or_dir(opts, result, buf, buf_len, 1);
    return fd == -1 ? FALSE : TRUE;
}