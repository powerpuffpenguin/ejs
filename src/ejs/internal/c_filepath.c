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
    if (path->len)
    {
        switch (path->str[path->len - 1])
        {
        case '/':
#ifdef PPP_FILEPATH_WINDOWS
        case '\\':
#endif
            return 0;
        }
    }

#ifdef PPP_FILEPATH_WINDOWS
    return ppp_c_string_append(path, "\\", 1);
#else
    return ppp_c_string_append(path, "/", 1);
#endif
}
int ppp_c_filepath_join_raw(ppp_c_string_t *path, const char *name, size_t n)
{
    if (n)
    {
        if (!path->len)
        {
            return ppp_c_string_append(path, name, n);
        }
#ifdef PPP_FILEPATH_WINDOWS
        if (ppp_c_string_end_with(path, "\\", 1) || ppp_c_string_end_with(path, "//", 1) ||
            (n > 0 && (name[0] == '\\' || name[0] == '/')))
        {
            return ppp_c_string_append(path, name, n);
        }
        else if (ppp_c_string_grow(path, n + 1))
        {
            return -1;
        }
        ppp_c_string_append_raw(path, "\\", 1);
#else
        if (ppp_c_string_end_with(path, "/", 1) ||
            (n > 0 && name[0] == '/'))
        {
            return ppp_c_string_append(path, name, n);
        }
        else if (ppp_c_string_grow(path, n + 1))
        {
            return -1;
        }
        ppp_c_string_append_raw(path, "/", 1);
#endif
        ppp_c_string_append_raw(path, name, n);
    }
    return 0;
}
BOOL ppp_c_filepath_is_abc(ppp_c_string_t *path)
{
#ifdef PPP_FILEPATH_WINDOWS
    if (path->len > 1 &&
        path->str[1] == ':' &&
        (('a' <= path->str[0] && path->str[0] <= 'z') ||
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
static int _ppp_c_filepath_remove_all_impl(ppp_c_string_t *path)
{
    size_t path_len = path->len;

    // remove all children
    DIR *dir = opendir(path->str);
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
        path->len = path_len;
        if (ppp_c_filepath_join_raw(path, dirent->d_name, len))
        {
            err = errno;
            closedir(dir);
            errno = err;
            return -1;
        }
        path->str[path->len] = 0;
        if (lstat(path->str, &info))
        {
            err = errno;
            closedir(dir);
            errno = err;
            return -1;
        }
        if (S_ISDIR(info.st_mode))
        {
            if (_ppp_c_filepath_remove_all_impl(path))
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
            if (remove(path->str))
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
    path->str[path_len] = 0;
    // printf(" rmdir %s\n", path->str);
    if (rmdir(path->str))
    {
        err = errno;
        if (err != ENOENT) // already remove by other
        {
            return -1;
        }
    }
    return 0;
}
int _ppp_c_filepath_rmdir_all_impl(ppp_c_string_t *path)
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
    if (_ppp_c_filepath_remove_all_impl(&dir))
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
        return _ppp_c_filepath_rmdir_all_impl(path);
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
        return _ppp_c_filepath_rmdir_all_impl(path);
    }
    return 0;
}
