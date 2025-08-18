#include "modules_shared.h"

#ifdef EJS_OS_WINDOWS
#else
#include "../js/os_exec.h"
#include <stdio.h>
#include <stdlib.h>
#include <unistd.h>
#include <sys/types.h>
#include <sys/wait.h>
#include <errno.h>
#include <fcntl.h>
#include <sys/epoll.h>
#include "../binary.h"
#include "../internal/c_string.h"
#include <sys/stat.h>
#include <event2/bufferevent.h>
#include <event2/buffer.h>

#define EJS_OS_EXEC_REDIRECT_IGNORE 1
#define EJS_OS_EXEC_REDIRECT_PIPE 2
#define EJS_OS_EXEC_REDIRECT_TEXT 3

#define EJS_OS_EXEC_IS_PIPE(r) (((r) == EJS_OS_EXEC_REDIRECT_PIPE) || ((r) == EJS_OS_EXEC_REDIRECT_TEXT))

#define EJS_OS_EXEC_CHILD_READ 0
#define EJS_OS_EXEC_PARENT_WRITE 1
#define EJS_OS_EXEC_PARENT_READ 2
#define EJS_OS_EXEC_CHILD_WRITE 3
#define EJS_OS_EXEC_STDIN_READ 4
#define EJS_OS_EXEC_STDIN_WRITE 5
#define EJS_OS_EXEC_STDOUT_READ 6
#define EJS_OS_EXEC_STDOUT_WRITE 7
#define EJS_OS_EXEC_STDERR_READ 8
#define EJS_OS_EXEC_STDERR_WRITE 9

#define EJS_OS_EXEC_FORK_OK 0
#define EJS_OS_EXEC_FORK_ERR 1
#define EJS_OS_EXEC_FORK_TYPE 2
#define EJS_OS_EXEC_FORK_OS 3

extern char **environ;
static int lookpath(ppp_c_string_t *filepath, duk_bool_t clean)
{
    if (ppp_c_filepath_is_abs(filepath))
    {
        return 0;
    }
    struct stat info;
    if (!stat(filepath->str, &info) &&
        S_ISREG(info.st_mode) &&
        (info.st_mode & (S_IXUSR | S_IXGRP | S_IXOTH)))
    {
        if (clean && ppp_c_filepath_clean(filepath))
        {
        }
        return 0;
    }
    uint8_t *s = getenv("PATH");
    duk_size_t len;
    duk_size_t i;
    duk_size_t name_len = filepath->len;
    const uint8_t *name = filepath->str;
    while (s[0])
    {
#ifdef EJS_OS_WINDOWS
        for (i = 0; s[i] && s[i] != ';'; i++)
#else
        for (i = 0; s[i] && s[i] != ':'; i++)
#endif
        {
        }
        if (i != 0)
        {
            len = i + 1 + name_len;
            filepath->len = 0;
            if (ppp_c_string_grow(filepath, len) ||
                ppp_c_string_append(filepath, s, i) ||
                ppp_c_string_append_char(filepath, PPP_FILEPATH_SEPARATOR) ||
                ppp_c_string_append(filepath, name, name_len))
            {
                return -1;
            }
            filepath->str[len] = 0;
            if (!stat(filepath->str, &info) &&
                S_ISREG(info.st_mode) &&
                (info.st_mode & (S_IXUSR | S_IXGRP | S_IXOTH)))
            {
                if (!ppp_c_filepath_is_abs(filepath))
                {
                    if (clean && ppp_c_filepath_clean(filepath))
                    {
                        return -1;
                    }
                }
                return 0;
            }
        }
        if (!s[i])
        {
            break;
        }
        s += i + 1;
    }
    errno = ENOENT;
    return -1;
}

static duk_bool_t send_all(int fd, const void *buf, duk_size_t buf_len)
{
    ssize_t written;
    while (buf_len)
    {
        written = write(fd, buf, buf_len);
        if (written < 0)
        {
            return -1;
        }
        buf += written;
        buf_len -= written;
    }
    return 0;
}
static int send_message(int fd, uint8_t t, int err, const void *buf, duk_size_t buf_len)
{
    char b[1 + 8 + 8];
    b[0] = t;
    ejs_get_binary()->little.put_uint64(b + 1, (uint64_t)err);
    ejs_get_binary()->little.put_uint64(b + 1 + 8, (uint64_t)buf_len);
    if (send_all(fd, b, 1 + 8 + 8))
    {
        return -1;
    }
    return send_all(fd, buf, buf_len);
}
static int send_message_n(int fd, uint8_t t, int err,
                          ppp_c_fast_string_t *buf, int buf_count)
{
    char b[1 + 8 + 8];
    b[0] = t;
    uint64_t len = 0;
    for (int i = 0; i < buf_count; i++)
    {
        if (buf[i].str && !buf[i].len)
        {
            buf[i].len = strlen(buf[i].str);
        }
        len += buf[i].len;
    }

    ejs_get_binary()->little.put_uint64(b + 1, (uint64_t)err);
    ejs_get_binary()->little.put_uint64(b + 1 + 8, (uint64_t)len);

    if (send_all(fd, b, 1 + 8 + 8))
    {
        return -1;
    }
    for (int i = 0; i < buf_count; i++)
    {
        if (send_all(fd, buf[i].str, buf[i].len))
        {
            return -1;
        }
    }
    return 0;
}

static int read_full(int fd, void *buf, duk_size_t buf_len)
{
    ssize_t n;
    while (buf_len)
    {
        n = read(fd, buf, buf_len);
        if (n < 1)
        {
            return -1;
        }
        buf += n;
        buf_len -= n;
    }
    return 0;
}
typedef struct
{
    int chan[4 + 2 * 3];
    pid_t pid;

    uint8_t stdin;
    uint8_t stdout;
    uint8_t stderr;
    uint8_t is_child : 1;
} run_t;

typedef struct
{
    run_t run;

    int epoll;
    ppp_c_fast_string_t buffer_in;
    ppp_c_string_t buffer_out;
    ppp_c_string_t buffer_err;
} run_sync_t;
static void fork_child_throw_os_n(
    int *chan,
    int err,
    ppp_c_fast_string_t *buf, int buf_count)
{
    send_message_n(
        chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_OS,
        err,
        buf, buf_count);

    close(chan[EJS_OS_EXEC_CHILD_WRITE]);
    chan[EJS_OS_EXEC_CHILD_WRITE] = -1;
    close(chan[EJS_OS_EXEC_CHILD_READ]);
    chan[EJS_OS_EXEC_CHILD_READ] = -1;
}
static void fork_child_throw_os(int *chan, int err, const char *str)
{
    send_message(chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_OS, err, str, strlen(str));
    close(chan[EJS_OS_EXEC_CHILD_WRITE]);
    chan[EJS_OS_EXEC_CHILD_WRITE] = -1;
    close(chan[EJS_OS_EXEC_CHILD_READ]);
    chan[EJS_OS_EXEC_CHILD_READ] = -1;
}
static int fork_child_sync_dup2(duk_context *ctx, int *chan, int *pfd, int std)
{
    int fd = *pfd;
    if (EJS_IS_INVALID_FD(fd))
    {
        fd = open("/dev/null", O_RDWR);
        if (EJS_IS_INVALID_FD(fd))
        {
            int err = errno;
            ppp_c_fast_string_t buf[] = {
                {
                    .str = "open /dev/null failed: ",
                    .len = 23,
                },
                {
                    .str = strerror(err),
                    .len = 0,
                },
            };
            fork_child_throw_os_n(chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
            return -1;
        }
    }
    if (dup2(fd, std) == -1)
    {
        int err = errno;
        close(fd);
        ppp_c_fast_string_t buf[] = {
            {.len = 20},
            {
                .str = strerror(err),
                .len = 0,
            },
        };
        switch (std)
        {
        case STDOUT_FILENO:
            buf[0].str = "dup2 STDOUT failed: ";
            break;
        case STDERR_FILENO:
            buf[0].str = "dup2 STDERR failed: ";
            break;
        default:
            buf[0].str = "dup2 STDIN failed: ";
            buf[0].len = 19;
            break;
        }
        fork_child_throw_os_n(chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
        return -1;
    }
    *pfd = fd;
    return 0;
}
static int fork_child_sync_ignore(duk_context *ctx, run_t *args)
{
    int fd = -1;
    if (EJS_OS_EXEC_REDIRECT_IGNORE == args->stdin &&
        fork_child_sync_dup2(ctx, args->chan, &fd, STDIN_FILENO))
    {
        return -1;
    }
    if (EJS_OS_EXEC_REDIRECT_IGNORE == args->stdout &&
        fork_child_sync_dup2(ctx, args->chan, &fd, STDOUT_FILENO))
    {
        return -1;
    }
    if (EJS_OS_EXEC_REDIRECT_IGNORE == args->stderr &&
        fork_child_sync_dup2(ctx, args->chan, &fd, STDERR_FILENO))
    {
        return -1;
    }
    if (EJS_IS_VALID_FD(fd))
    {
        close(fd);
    }
    return 0;
}
/**
 * The child process prepares the environment and executes
 */
static duk_ret_t fork_child_sync_impl(duk_context *ctx)
{
    run_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "name", 4);
    char *name = (char *)duk_require_string(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "workdir", 7);
    ppp_c_string_t path = {
        .str = name,
        .cap = 0,
        .len = strlen(name),
    };
    if (duk_is_null_or_undefined(ctx, -1))
    {
        if (lookpath(&path, 0))
        {
            int err = errno;
            ppp_c_fast_string_t buf[] = {
                {
                    .str = "lookpath",
                    .len = 8,
                },
                {
                    .str = name,
                    .len = 0,
                },
                {
                    .str = " failed: ",
                    .len = 9,
                },
                {
                    .str = strerror(err),
                    .len = 1,
                },
            };
            fork_child_throw_os_n(args->chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
            return 0;
        }
    }
    else
    {
        if (lookpath(&path, 1))
        {
            int err = errno;
            ppp_c_fast_string_t buf[] = {
                {
                    .str = "lookpath",
                    .len = 8,
                },
                {
                    .str = name,
                    .len = 0,
                },
                {
                    .str = " failed: ",
                    .len = 9,
                },
                {
                    .str = strerror(err),
                    .len = 1,
                },
            };
            fork_child_throw_os_n(args->chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
            return 0;
        }
        const char *workdir = duk_require_string(ctx, -1);
        if (chdir(workdir) == -1)
        {
            int err = errno;
            ppp_c_fast_string_t buf[] = {
                {
                    .str = strerror(err),
                    .len = 0,
                },
                {
                    .str = ": ",
                    .len = 2,
                },
                {
                    .str = workdir,
                    .len = 0,
                },
            };
            fork_child_throw_os_n(args->chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
            return 0;
        }
    }
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "env", 3);
    if (duk_is_array(ctx, -1))
    {
        const uint8_t *key;
        const uint8_t *value;
        duk_size_t count = duk_get_length(ctx, -1);
        for (duk_size_t i = 0; i < count; i++)
        {
            duk_get_prop_index(ctx, -1, i);

            duk_get_prop_index(ctx, -1, 0);
            key = duk_require_string(ctx, -1);
            duk_pop(ctx);
            duk_get_prop_index(ctx, -1, 1);
            value = duk_require_string(ctx, -1);

            duk_pop_2(ctx);

            if (setenv(key, value, 1))
            {
                int err = errno;
                ppp_c_fast_string_t buf[] = {
                    {
                        .str = strerror(err),
                        .len = 0,
                    },
                    {
                        .str = ": ",
                        .len = 2,
                    },
                    {
                        .str = key,
                        .len = 0,
                    },
                    {
                        .str = "=",
                        .len = 1,
                    },
                    {
                        .str = value,
                        .len = 0,
                    },
                };
                fork_child_throw_os_n(args->chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
                return 0;
            }
        }
    }
    duk_pop(ctx);

    // stdin stdout stderr
    if (fork_child_sync_ignore(ctx, args))
    {
        return 0;
    }
    // pipe
    if (EJS_IS_VALID_FD(args->chan[EJS_OS_EXEC_STDIN_READ]))
    {
        close(args->chan[EJS_OS_EXEC_STDIN_WRITE]);
        args->chan[EJS_OS_EXEC_STDIN_WRITE] = -1;
        if (dup2(args->chan[EJS_OS_EXEC_STDIN_READ], STDIN_FILENO) == -1)
        {
            int err = errno;
            ppp_c_fast_string_t buf[] = {
                {
                    .str = "dup2 stdin failed: ",
                    .len = 19,
                },
                {
                    .str = strerror(err),
                    .len = 0,
                },
            };
            fork_child_throw_os_n(args->chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
            return 0;
        }
    }
    if (EJS_IS_VALID_FD(args->chan[EJS_OS_EXEC_STDOUT_READ]))
    {
        close(args->chan[EJS_OS_EXEC_STDOUT_READ]);
        args->chan[EJS_OS_EXEC_STDOUT_READ] = -1;
        if (dup2(args->chan[EJS_OS_EXEC_STDOUT_WRITE], STDOUT_FILENO) == -1)
        {
            int err = errno;
            ppp_c_fast_string_t buf[] = {
                {
                    .str = "dup2 stdout failed: ",
                    .len = 20,
                },
                {
                    .str = strerror(err),
                    .len = 0,
                },
            };
            fork_child_throw_os_n(args->chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
            return 0;
        }
    }
    if (EJS_IS_VALID_FD(args->chan[EJS_OS_EXEC_STDERR_READ]))
    {
        close(args->chan[EJS_OS_EXEC_STDERR_READ]);
        args->chan[EJS_OS_EXEC_STDERR_READ] = -1;
        if (dup2(args->chan[EJS_OS_EXEC_STDERR_WRITE], STDERR_FILENO) == -1)
        {
            int err = errno;
            ppp_c_fast_string_t buf[] = {
                {
                    .str = "dup2 stderr failed: ",
                    .len = 20,
                },
                {
                    .str = strerror(err),
                    .len = 0,
                },
            };
            fork_child_throw_os_n(args->chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
            return 0;
        }
    }

    // args
    duk_get_prop_lstring(ctx, 0, "args", 4);
    char **argv = 0;
    if (duk_is_array(ctx, -1))
    {
        duk_size_t n = duk_get_length(ctx, -1);
        if (n)
        {
            argv = malloc(sizeof(char *) * (n + 2));
            if (!argv)
            {
                int err = errno;
                fork_child_throw_os(args->chan, err, strerror(err));
                return 0;
            }
            argv[0] = name;
            for (duk_size_t i = 0; i < n; i++)
            {
                duk_get_prop_index(ctx, -1, i);
                argv[i + 1] = (char *)duk_require_string(ctx, -1);
                duk_pop(ctx);
            }
            argv[n + 1] = 0;
        }
    }
    duk_pop(ctx);

    // Notify the parent process that it is ready
    uint8_t header[17] = {0};
    send_all(args->chan[EJS_OS_EXEC_CHILD_WRITE], header, sizeof(header));
    // close(args->chan[EJS_OS_EXEC_CHILD_WRITE]);
    // args->chan[EJS_OS_EXEC_CHILD_WRITE] = -1;

    read_full(args->chan[EJS_OS_EXEC_CHILD_READ], header, sizeof(header));
    close(args->chan[EJS_OS_EXEC_CHILD_READ]);
    args->chan[EJS_OS_EXEC_CHILD_READ] = -1;

    if (argv)
    {
        execve(ppp_c_string_c_str(&path), argv, environ);
    }
    else
    {
        char *const argv[] = {name, 0};
        execve(ppp_c_string_c_str(&path), argv, environ);
    }

    int err = errno;
    ppp_c_fast_string_t buf[] = {
        {
            .str = strerror(err),
            .len = 0,
        },
        {
            .str = ": ",
            .len = 2,
        },
        {
            .str = path.str,
            .len = path.len,
        },
    };
    fork_child_throw_os_n(args->chan, err, buf, sizeof(buf) / sizeof(ppp_c_fast_string_t));
    return 0;
}
/**
 * The child process code after fork
 */
static void fork_child_sync(
    duk_context *ctx,
    pid_t pid, run_t *args)
{
    close(args->chan[EJS_OS_EXEC_PARENT_WRITE]);
    close(args->chan[EJS_OS_EXEC_PARENT_READ]);

    // child
    duk_push_c_lightfunc(ctx, fork_child_sync_impl, 2, 2, 0);
    duk_swap_top(ctx, -3);
    duk_swap_top(ctx, -2);
    duk_pcall(ctx, 2);

    EJS_RESET_FD(args->chan[EJS_OS_EXEC_CHILD_READ]);
    if (args->chan[EJS_OS_EXEC_CHILD_WRITE] != -1)
    {
        if (duk_is_type_error(ctx, -1))
        {
            duk_get_prop_lstring(ctx, -1, "message", 7);
            duk_size_t s_len;
            const uint8_t *s = duk_require_lstring(ctx, -1, &s_len);
            send_message(args->chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_TYPE, 0, s, s_len);
        }
        else if (duk_is_error(ctx, -1))
        {
            duk_get_prop_lstring(ctx, -1, "message", 7);
            duk_size_t s_len;
            const uint8_t *s = duk_require_lstring(ctx, -1, &s_len);
            send_message(args->chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_ERR, 0, s, s_len);
        }
        else
        {
            send_message(args->chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_ERR, 0, "unknow error", 12);
        }
        close(args->chan[EJS_OS_EXEC_CHILD_WRITE]);
    }
}

/**
 * The parent process obtains the child process preparation information from the pipe
 */
static void fork_parent_read_sync(
    duk_context *ctx,
    int *chan,
    uint8_t *header, duk_bool_t first)
{
    if (first)
    {
        if (read_full(chan[EJS_OS_EXEC_PARENT_READ], header, 17))
        {
            duk_push_error_object(ctx, DUK_ERR_ERROR, "init read pipe fail");
            duk_throw(ctx);
        }
    }
    else if (read(chan[EJS_OS_EXEC_PARENT_READ], header, 1) != 1)
    {
        return;
    }
    else if (read_full(chan[EJS_OS_EXEC_PARENT_READ], header + 1, 16))
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "init read pipe fail");
        duk_throw(ctx);
    }

    switch (header[0])
    {
    case EJS_OS_EXEC_FORK_ERR:
    case EJS_OS_EXEC_FORK_TYPE:
    {
        duk_size_t buf_len = ejs_get_binary()->little.uint64(header + 1 + 8);
        uint8_t *buf = duk_push_fixed_buffer(ctx, buf_len + 1);
        if (read_full(chan[EJS_OS_EXEC_PARENT_READ], buf, buf_len))
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, "init read pipe failed: %s", strerror(err));
        }
        buf[buf_len] = 0;
        duk_push_error_object(ctx, header[0] == EJS_OS_EXEC_FORK_ERR ? DUK_ERR_ERROR : DUK_ERR_TYPE_ERROR, buf);
        duk_throw(ctx);
        return;
    }
    case EJS_OS_EXEC_FORK_OS:
    {
        duk_size_t buf_len = ejs_get_binary()->little.uint64(header + 1 + 8);
        uint8_t *buf = duk_push_fixed_buffer(ctx, buf_len + 1);
        if (read_full(chan[EJS_OS_EXEC_PARENT_READ], buf, buf_len))
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, "init read pipe failed: %s", strerror(err));
        }
        buf[buf_len] = 0;
        ejs_throw_os(ctx, ejs_get_binary()->little.uint64(header + 1), buf);
        return;
    }
    case EJS_OS_EXEC_FORK_OK:
        if (first)
        {
            if (send_all(chan[EJS_OS_EXEC_PARENT_WRITE], header, 17))
            {
                int err = errno;
                ejs_throw_os_format(ctx, err, "init write pipe failed: %s", strerror(err));
            }
            return;
        }
        break;
    }
    duk_push_error_object(ctx, DUK_ERR_ERROR, "read unknow data from pipe");
    duk_throw(ctx);
}

static void fork_parent_read_sync_impl(duk_context *ctx, int fd, ppp_c_string_t *s)
{
    ssize_t n;
    while (1)
    {
        if (s->len >= s->cap)
        {
            if (ppp_c_string_grow(s, 128))
            {
                ejs_throw_os_errno(ctx);
            }
        }

        n = read(fd, s->str + s->len, s->cap - s->len);
        if (n == 0)
        {
            return;
        }
        else if (n < 0)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, "read pipe failed: %s", strerror(err));
        }
        else
        {
            s->len += n;
        }
    }
}
static void fork_parent_put_prop_lstring(
    duk_context *ctx,
    int std,
    ppp_c_string_t *s,
    const uint8_t *key,
    duk_size_t key_len)
{
    switch (std)
    {
    case EJS_OS_EXEC_REDIRECT_PIPE:
        if (s->len)
        {
            uint8_t *dst = duk_push_fixed_buffer(ctx, s->len);
            memcpy(dst, s->str, s->len);
        }
        else
        {
            duk_push_fixed_buffer(ctx, 0);
        }
        if (s->cap)
        {
            free(s->str);
            s->cap = 0;
        }
        duk_put_prop_lstring(ctx, -2, key, key_len);
        break;
    case EJS_OS_EXEC_REDIRECT_TEXT:
        if (s->len)
        {
            duk_push_lstring(ctx, s->str, s->len);
        }
        else
        {
            duk_push_lstring(ctx, "", 0);
        }
        if (s->cap)
        {
            free(s->str);
            s->cap = 0;
        }
        duk_put_prop_lstring(ctx, -2, key, key_len);
        break;
    }
}
static void fork_parent_wait(
    duk_context *ctx,
    run_sync_t *args)
{
    // wait child exit
    int status;
    if (waitpid(args->run.pid, &status, 0) == -1)
    {
        int err = errno;
        ejs_throw_os_format(ctx, err, "waitpid failed: %s", strerror(err));
    }
    args->run.pid = 0;
    if (WIFEXITED(status))
    {
        // get exit code
        int exit_code = WEXITSTATUS(status);
        duk_push_object(ctx);
        duk_push_int(ctx, exit_code);
        duk_put_prop_lstring(ctx, -2, "exit", 4);
        fork_parent_put_prop_lstring(ctx, args->run.stdout, &args->buffer_out, "stdout", 6);
        fork_parent_put_prop_lstring(ctx, args->run.stderr, &args->buffer_err, "stderr", 6);
    }
    else
    {
        duk_push_error_object(ctx, DUK_ERR_ERROR, "WIFEXITED fail");
        duk_throw(ctx);
    }
}
static void fork_parent_pipe_wait(
    duk_context *ctx,
    run_sync_t *args,
    uint8_t *header)
{
    // wait child start
    fork_parent_read_sync(ctx, args->run.chan, header, 0);
    close(args->run.chan[EJS_OS_EXEC_PARENT_READ]);
    args->run.chan[EJS_OS_EXEC_PARENT_READ] = -1;

    // pipe
    if (args->buffer_in.len)
    {
        close(args->run.chan[EJS_OS_EXEC_STDIN_READ]);
        args->run.chan[EJS_OS_EXEC_STDIN_READ] = -1;
        ssize_t n;
        while (args->buffer_in.len)
        {
            n = write(args->run.chan[EJS_OS_EXEC_STDIN_WRITE], args->buffer_in.str, args->buffer_in.len);
            if (n < 0)
            {
                kill(args->run.pid, SIGKILL);
                args->run.pid = 0;
                break;
            }
            args->buffer_in.str += n;
            args->buffer_in.len -= n;
        }
        close(args->run.chan[EJS_OS_EXEC_STDIN_WRITE]);
        args->run.chan[EJS_OS_EXEC_STDIN_READ] = -1;
    }
    else if (EJS_IS_VALID_FD(args->run.chan[EJS_OS_EXEC_STDOUT_READ]))
    {
        close(args->run.chan[EJS_OS_EXEC_STDOUT_WRITE]);
        args->run.chan[EJS_OS_EXEC_STDOUT_WRITE] = -1;
        fork_parent_read_sync_impl(ctx, args->run.chan[EJS_OS_EXEC_STDOUT_READ], &args->buffer_out);
    }
    else if (EJS_IS_VALID_FD(args->run.chan[EJS_OS_EXEC_STDERR_READ]))
    {
        close(args->run.chan[EJS_OS_EXEC_STDERR_WRITE]);
        args->run.chan[EJS_OS_EXEC_STDERR_WRITE] = -1;
        fork_parent_read_sync_impl(ctx, args->run.chan[EJS_OS_EXEC_STDERR_READ], &args->buffer_err);
    }
    // wait
    fork_parent_wait(ctx, args);
}

static void fork_parent_epoll_wait(
    duk_context *ctx,
    run_sync_t *args,
    uint8_t *header,
    int pipe_count)
{
    // create epoll
#ifdef EPOLL_CLOEXEC
    args->epoll = epoll_create1(0);
#else
    args->epoll = epoll_create(pipe_count);
#endif
    if (EJS_IS_INVALID_FD(args->epoll))
    {
        int err = errno;
        ejs_throw_os_format(ctx, err, "create epoll failed: %s", strerror(err));
    }
    struct epoll_event ev = {0};

    // stdout
    if (EJS_IS_VALID_FD(args->run.chan[EJS_OS_EXEC_STDOUT_READ]))
    {
        close(args->run.chan[EJS_OS_EXEC_STDOUT_WRITE]);
        args->run.chan[EJS_OS_EXEC_STDOUT_WRITE] = -1;

        ev.events = EPOLLIN;
        ev.data.fd = args->run.chan[EJS_OS_EXEC_STDOUT_READ];
        if (epoll_ctl(args->epoll, EPOLL_CTL_ADD, args->run.chan[EJS_OS_EXEC_STDOUT_READ], &ev) == -1)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, "epoll_ctl failed for stdout: %s", strerror(err));
        }
    }
    // stderr
    if (EJS_IS_VALID_FD(args->run.chan[EJS_OS_EXEC_STDERR_READ]))
    {
        close(args->run.chan[EJS_OS_EXEC_STDERR_WRITE]);
        args->run.chan[EJS_OS_EXEC_STDERR_WRITE] = -1;

        ev.events = EPOLLIN;
        ev.data.fd = args->run.chan[EJS_OS_EXEC_STDERR_READ];
        if (epoll_ctl(args->epoll, EPOLL_CTL_ADD, args->run.chan[EJS_OS_EXEC_STDERR_READ], &ev) == -1)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, "epoll_ctl failed for stderr: %s", strerror(err));
        }
    }
    // stdin
    if (EJS_IS_VALID_FD(args->run.chan[EJS_OS_EXEC_STDIN_WRITE]))
    {
        close(args->run.chan[EJS_OS_EXEC_STDIN_READ]);
        args->run.chan[EJS_OS_EXEC_STDIN_READ] = -1;

        ev.events = EPOLLOUT;
        ev.data.fd = args->run.chan[EJS_OS_EXEC_STDIN_WRITE];
        if (epoll_ctl(args->epoll, EPOLL_CTL_ADD, args->run.chan[EJS_OS_EXEC_STDIN_WRITE], &ev) == -1)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, "epoll_ctl failed for stdin: %s", strerror(err));
        }
    }

    // wait child start
    fork_parent_read_sync(ctx, args->run.chan, header, 0);
    close(args->run.chan[EJS_OS_EXEC_PARENT_READ]);
    args->run.chan[EJS_OS_EXEC_PARENT_READ] = -1;

    // pipe
    struct epoll_event events[3];
    int i, nfds;
    ppp_c_string_t *buffer;
    ssize_t n;
    while (pipe_count)
    {
        nfds = epoll_wait(args->epoll, events, pipe_count, -1);
        if (nfds == -1)
        {
            if (errno == EINTR)
            {
                continue;
            }
            int err = errno;
            ejs_throw_os_format(ctx, err, "epoll_wait failed: %s", strerror(err));
        }
        for (i = 0; i < nfds; ++i)
        {
            if (events[i].events & (EPOLLHUP | EPOLLERR))
            {
                if (args->run.chan[EJS_OS_EXEC_STDIN_WRITE] == events[i].data.fd)
                {
                    epoll_ctl(args->epoll, EPOLL_CTL_DEL, events[i].data.fd, NULL);
                    --pipe_count;
                    close(events[i].data.fd);
                    args->run.chan[EJS_OS_EXEC_STDIN_WRITE] = -1;
                }
                else if (args->run.chan[EJS_OS_EXEC_STDOUT_READ] == events[i].data.fd)
                {
                    epoll_ctl(args->epoll, EPOLL_CTL_DEL, events[i].data.fd, NULL);
                    --pipe_count;
                    close(events[i].data.fd);
                    args->run.chan[EJS_OS_EXEC_STDOUT_READ] = -1;
                }
                else if (args->run.chan[EJS_OS_EXEC_STDERR_READ] == events[i].data.fd)
                {
                    epoll_ctl(args->epoll, EPOLL_CTL_DEL, events[i].data.fd, NULL);
                    --pipe_count;
                    close(events[i].data.fd);
                    args->run.chan[EJS_OS_EXEC_STDERR_READ] = -1;
                }
                continue;
            }
            // write
            if ((events[i].events & EPOLLOUT) &&
                args->run.chan[EJS_OS_EXEC_STDIN_WRITE] == events[i].data.fd)
            {
                if (args->buffer_in.len)
                {
                    n = write(events[i].data.fd, args->buffer_in.str, args->buffer_in.len);
                    if (n > 0)
                    {
                        args->buffer_in.len -= n;
                        args->buffer_in.str += n;
                    }
                    else if (n < 0 && errno != EAGAIN && errno != EWOULDBLOCK)
                    {
                        int err = errno;
                        ejs_throw_os_format(ctx, err, "write pipe failed: %s", strerror(err));
                    }
                }

                if (!args->buffer_in.len)
                {
                    epoll_ctl(args->epoll, EPOLL_CTL_DEL, events[i].data.fd, NULL);
                    --pipe_count;
                    close(events[i].data.fd);
                    args->run.chan[EJS_OS_EXEC_STDIN_WRITE] = -1;
                }
            }

            // read
            if (events[i].events & EPOLLIN)
            {
                if (events[i].data.fd == args->run.chan[EJS_OS_EXEC_STDOUT_READ])
                {
                    buffer = &args->buffer_out;
                }
                else if (events[i].data.fd == args->run.chan[EJS_OS_EXEC_STDERR_READ])
                {
                    buffer = &args->buffer_err;
                }
                else
                {
                    continue;
                }
                if (buffer->len >= buffer->cap)
                {
                    if (ppp_c_string_grow(buffer, 128))
                    {
                        ejs_throw_os_errno(ctx);
                    }
                }
                n = read(events[i].data.fd, buffer->str + buffer->len, buffer->cap - buffer->len);
                if (n > 0)
                {
                    buffer->len += n;
                }
                else if (n == 0)
                {
                    epoll_ctl(args->epoll, EPOLL_CTL_DEL, events[i].data.fd, NULL);
                    --pipe_count;
                    close(events[i].data.fd);
                    if (events[i].data.fd == args->run.chan[EJS_OS_EXEC_STDOUT_READ])
                    {
                        args->run.chan[EJS_OS_EXEC_STDOUT_READ] = -1;
                    }
                    else
                    {
                        args->run.chan[EJS_OS_EXEC_STDERR_READ] = -1;
                    }
                }
                else
                {
                    int err = errno;
                    ejs_throw_os_format(ctx, err, "read pipe failed: %s", strerror(err));
                }
            }
        }
    }

    // wait
    fork_parent_wait(ctx, args);
}
/**
 * Parent process code after fork
 */
static void fork_parent_sync_impl(
    duk_context *ctx,
    run_sync_t *args,
    int pipe_count)
{
    // parent
    close(args->run.chan[EJS_OS_EXEC_CHILD_WRITE]);
    args->run.chan[EJS_OS_EXEC_CHILD_WRITE] = -1;
    close(args->run.chan[EJS_OS_EXEC_CHILD_READ]);
    args->run.chan[EJS_OS_EXEC_CHILD_READ] = -1;

    // wait child ready
    uint8_t header[17];
    fork_parent_read_sync(ctx, args->run.chan, header, 1);
    close(args->run.chan[EJS_OS_EXEC_PARENT_WRITE]);
    args->run.chan[EJS_OS_EXEC_PARENT_WRITE] = -1;

    // pipe
    if (pipe_count > 1)
    {
        fork_parent_epoll_wait(ctx, args, header, pipe_count);
    }
    else
    {
        fork_parent_pipe_wait(ctx, args, header);
    }
}
static void pipe_sync(duk_context *ctx, int *chan, int read)
{
    const char *fmt = 0;
    const char *tag = 0;
    switch (read)
    {
    case EJS_OS_EXEC_CHILD_READ:
        fmt = "pipe child failed: %s";
        tag = "fcntl pipe child failed: %s";
        break;
    case EJS_OS_EXEC_PARENT_READ:
        fmt = "pipe parent failed: %s";
        tag = "fcntl pipe parent failed: %s";
        break;
    case EJS_OS_EXEC_STDIN_READ:
        fmt = "pipe stdin failed: %s";
        break;
    case EJS_OS_EXEC_STDOUT_READ:
        fmt = "pipe stdout failed: %s";
        break;
    case EJS_OS_EXEC_STDERR_READ:
        fmt = "pipe stderr failed: %s";
        break;
    default:
        duk_push_error_object(ctx, DUK_ERR_ERROR, "unknow pipe %d", read);
        duk_throw(ctx);
        break;
    }
    int write = read + 1;
    if (pipe(chan + read) == -1)
    {
        int err = errno;
        chan[read] = -1;
        chan[write] = -1;

        ejs_throw_os_format(ctx, err, fmt, strerror(err));
    }
    if (tag)
    {
        if (fcntl(chan[read], F_SETFD, fcntl(chan[read], F_GETFD) | FD_CLOEXEC) == -1)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, tag, strerror(errno));
        }
        if (fcntl(chan[write], F_SETFD, fcntl(chan[write], F_GETFD) | FD_CLOEXEC) == -1)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, tag, strerror(errno));
        }
    }
}

static duk_ret_t run_sync_impl(duk_context *ctx)
{
    run_sync_t *args = duk_require_pointer(ctx, -1);

    duk_get_prop_lstring(ctx, 0, "stdin", 5);
    args->run.stdin = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_number(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "stdout", 6);
    args->run.stdout = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_number(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "stderr", 6);
    args->run.stderr = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_number(ctx, -1);
    duk_pop(ctx);

    pipe_sync(ctx, args->run.chan, EJS_OS_EXEC_CHILD_READ);
    pipe_sync(ctx, args->run.chan, EJS_OS_EXEC_PARENT_READ);

    int pipe_count = 0;
    if (EJS_OS_EXEC_IS_PIPE(args->run.stdout))
    {
        pipe_sync(ctx, args->run.chan, EJS_OS_EXEC_STDOUT_READ);
        ++pipe_count;
    }
    if (EJS_OS_EXEC_IS_PIPE(args->run.stderr))
    {
        pipe_sync(ctx, args->run.chan, EJS_OS_EXEC_STDERR_READ);
        ++pipe_count;
    }
    if (EJS_OS_EXEC_IS_PIPE(args->run.stdin))
    {
        duk_get_prop_lstring(ctx, 0, "write", 5);
        duk_size_t len;
        args->buffer_in.str = EJS_REQUIRE_CONST_LSOURCE(ctx, -1, &len);
        args->buffer_in.len = len;
        duk_pop(ctx);

        pipe_sync(ctx, args->run.chan, EJS_OS_EXEC_STDIN_READ);
        ++pipe_count;
        if (pipe_count > 1 && fcntl(args->run.chan[EJS_OS_EXEC_STDIN_WRITE], F_SETFL, O_NONBLOCK) == -1)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, "fcntl pipe stdin failed: %s", strerror(err));
        }
    }
    pid_t pid = fork();
    if (pid < 0)
    {
        ejs_throw_os_errno(ctx);
    }
    else if (pid == 0)
    {
        args->run.is_child = 1;
        fork_child_sync(ctx, pid, &args->run);
        exit(EXIT_FAILURE);
    }
    else
    {
        args->run.pid = pid;

        if (EJS_IS_VALID_FD(args->run.chan[EJS_OS_EXEC_STDOUT_READ]))
        {
            args->buffer_out.str = malloc(1024 + 1);
            if (!args->buffer_out.str)
            {
                ejs_throw_os_errno(ctx);
            }
            args->buffer_out.cap = 1024;
        }
        if (EJS_IS_VALID_FD(args->run.chan[EJS_OS_EXEC_STDERR_READ]))
        {
            args->buffer_err.str = malloc(1024 + 1);
            if (!args->buffer_err.str)
            {
                ejs_throw_os_errno(ctx);
            }
            args->buffer_err.cap = 1024;
        }

        fork_parent_sync_impl(ctx, args, pipe_count);
    }
    return 1;
}
static duk_ret_t run_sync(duk_context *ctx)
{
    run_sync_t args = {0};
    int n = sizeof(args.run.chan) / sizeof(int);
    for (int i = 0; i < n; i++)
    {
        args.run.chan[i] = -1;
    }
    args.epoll = -1;
    args.buffer_in.len = 0;
    args.buffer_in.str = 0;
    args.buffer_out.cap = args.buffer_out.len = 0;
    args.buffer_out.str = 0;
    args.buffer_err.cap = args.buffer_err.len = 0;
    args.buffer_err.str = 0;
    int err = ejs_pcall_function_n(ctx, run_sync_impl, &args, 2);
    if (args.run.is_child)
    {
        exit(EXIT_FAILURE);
    }
    else if (err && args.run.pid)
    {
        kill(args.run.pid, SIGKILL);
    }
    if (EJS_IS_VALID_FD(args.epoll))
    {
        close(args.epoll);
    }
    for (int i = 0; i < n; i++)
    {
        if (EJS_IS_VALID_FD(args.run.chan[i]))
        {
            close(args.run.chan[i]);
        }
    }
    if (args.buffer_out.cap)
    {
        free(args.buffer_out.str);
    }
    if (args.buffer_err.cap)
    {
        free(args.buffer_err.str);
    }

    if (err)
    {
        duk_throw(ctx);
    }
    return 1;
}

// static duk_ret_t run_finalizer(duk_context *ctx)
// {
//     duk_get_prop_lstring(ctx, 0, "p", 1);
//     run_t *p = duk_require_pointer(ctx, -1);

//     return 0;
// }
static duk_ret_t run_impl(duk_context *ctx)
{
    run_t *args = duk_require_pointer(ctx, -1);

    duk_get_prop_lstring(ctx, 0, "stdin", 5);
    args->stdin = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_number(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "stdout", 6);
    args->stdout = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_number(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "stderr", 6);
    args->stderr = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_number(ctx, -1);
    duk_pop(ctx);

    pipe_sync(ctx, args->chan, EJS_OS_EXEC_CHILD_READ);
    pipe_sync(ctx, args->chan, EJS_OS_EXEC_PARENT_READ);

    int pipe_count = 0;
    if (EJS_OS_EXEC_IS_PIPE(args->stdout))
    {
        pipe_sync(ctx, args->chan, EJS_OS_EXEC_STDOUT_READ);
    }
    if (EJS_OS_EXEC_IS_PIPE(args->stderr))
    {
        pipe_sync(ctx, args->chan, EJS_OS_EXEC_STDERR_READ);
    }
    if (EJS_OS_EXEC_IS_PIPE(args->stdin))
    {
        pipe_sync(ctx, args->chan, EJS_OS_EXEC_STDIN_READ);
        if (fcntl(args->chan[EJS_OS_EXEC_STDIN_WRITE], F_SETFL, O_NONBLOCK) == -1)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, "fcntl pipe stdin failed: %s", strerror(err));
        }
    }

    pid_t pid = fork();
    if (pid < 0)
    {
        ejs_throw_os_errno(ctx);
    }
    else if (pid == 0)
    {
        duk_swap_top(ctx, -2);
        duk_pop(ctx);
        args->is_child = 1;
        fork_child_sync(ctx, pid, args);
        exit(EXIT_FAILURE);
    }
    else
    {
        puts("parents");

        args->pid = pid;
    }
    return 0;
}
static duk_ret_t run(duk_context *ctx)
{
    run_t args = {0};
    int n = sizeof(args.chan) / sizeof(int);
    for (int i = 0; i < n; i++)
    {
        args.chan[i] = -1;
    }
    int err = ejs_pcall_function_n(ctx, run_impl, &args, 3);
    if (args.is_child)
    {
        exit(EXIT_FAILURE);
    }
    else if (err && args.pid)
    {
        kill(args.pid, SIGKILL);
    }
    for (int i = 0; i < n; i++)
    {
        if (EJS_IS_VALID_FD(args.chan[i]))
        {
            close(args.chan[i]);
        }
    }
    if (err)
    {
        duk_throw(ctx);
    }
    return 0;
}

EJS_SHARED_MODULE__DECLARE(os_exec)
{
    /*
     *  Entry stack: [ require exports ]
     */
    duk_eval_lstring(ctx, js_ejs_js_os_exec_min_js, js_ejs_js_os_exec_min_js_len);
    duk_swap_top(ctx, -2);

    duk_push_heap_stash(ctx);
    duk_get_prop_lstring(ctx, -1, EJS_STASH_EJS);
    duk_swap_top(ctx, -2);
    duk_pop(ctx);

    duk_push_object(ctx);
    {
        duk_push_c_lightfunc(ctx, run_sync, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "run_sync", 8);

        duk_push_c_lightfunc(ctx, run, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "run", 3);
    }
    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);
    return 0;
}
#endif