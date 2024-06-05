#include "c_filepath.h"
#include <errno.h>
#include <stdio.h>
#include <string.h>

#include <sys/stat.h>
#include <sys/param.h>
#include <dirent.h>
#include <unistd.h>

int ppp_c_filepath_append_separator(ppp_c_string_t *path)
{
    if (path->len && PPP_FILEPATH_IS_SEPARATOR(path->str[path->len - 1]))
    {
        return 0;
    }
    return ppp_c_string_append_char(path, PPP_FILEPATH_SEPARATOR);
}
int ppp_c_filepath_join_raw(ppp_c_string_t *path, const char *name, size_t n)
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
        ppp_c_string_append_raw_char(path, PPP_FILEPATH_SEPARATOR);
        ppp_c_string_append_raw(path, name, n);
    }
    return 0;
}
BOOL ppp_c_filepath_is_abc(ppp_c_string_t *path)
{
#ifdef PPP_FILEPATH_WINDOWS
    if (path->len > 1 &&
        path->str[1] == ':' &&
        (('0' <= path->str[0] && path->str[0] <= '9') ||
         ('a' <= path->str[0] && path->str[0] <= 'z') ||
         ('A' <= path->str[0] && path->str[0] <= 'Z')) &&
        (path->len == 2 || path->str[2] == '\\' || path->str[2] == '/'))
#else
    if (path->len > 0 && path->str[0] == '/')
#endif
    {
        return TRUE;
    }
    return FALSE;
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
        if (ppp_c_filepath_join_raw(args->path, dirent->d_name, len))
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
int ppp_c_filepath_rmdir_all_impl(ppp_c_string_t *path)
{
    ppp_c_string_t dir = {0};
    if (ppp_c_filepath_is_abc(path))
    {
        if (ppp_c_string_append(&dir, path->str, path->len))
        {
            return -1;
        }
    }
    else
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
        if (ppp_c_filepath_join_raw(&dir, path->str, path->len))
        {
            int err = errno;
            free(dir.str);
            errno = err;
            return -1;
        }
    }
    dir.str[dir.len] = 0;
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
    if (rmdir(path->str))
    {
        int err = errno;
        switch (err)
        {
        case ENOTEMPTY:
            break;
        case ENOENT:
            return 0;
        default:
            return -1;
        }
        return ppp_c_filepath_rmdir_all_impl(path);
    }
    return 0;
}
int ppp_c_filepath_remove_all(ppp_c_string_t *path)
{
    if (remove(path->str))
    {
        int err = errno;
        switch (err)
        {
        case ENOTEMPTY:
            break;
        case ENOENT:
            return 0;
        default:
            return -1;
        }
        return ppp_c_filepath_rmdir_all_impl(path);
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
        size_t len;
        if (!args->path.cap)
        {
#ifdef PPP_FILEPATH_WINDOWS
            len = args->path.len + 2;
#else
            len = args->path.len + 1;
#endif
            char *s = malloc(len);
            if (!s)
            {
                return -1;
            }
            memmove(s, args->path.str, len);
            args->path.str = s;
            args->path.cap = args->path.len;
        }

        len = args->path.len;
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