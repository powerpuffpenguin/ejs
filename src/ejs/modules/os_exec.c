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
static duk_ret_t lookpath_sync(duk_context *ctx)
{
    duk_bool_t clean = duk_require_boolean(ctx, 0);
    const uint8_t *name = duk_require_string(ctx, 1);
    if (ejs_filepath_is_abs(ctx, -1))
    {
        return 1;
    }
    struct stat info;
    if (!stat(name, &info) &&
        S_ISREG(info.st_mode) &&
        (info.st_mode & (S_IXUSR | S_IXGRP | S_IXOTH)))
    {
        if (clean)
        {
            ejs_filepath_abs(ctx, -1);
        }
        return 1;
    }

    uint8_t *s = getenv("PATH");
    uint8_t path[MAXPATHLEN] = {0};
    duk_size_t len;
    duk_size_t i;
    duk_size_t name_len;
    duk_require_lstring(ctx, -1, &name_len);
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
            if (len < MAXPATHLEN)
            {
                memcpy(path, s, i);
                path[i] = PPP_FILEPATH_SEPARATOR;
                memcpy(path + i + 1, name, name_len);
                path[len] = 0;

                if (!stat(path, &info) &&
                    S_ISREG(info.st_mode) &&
                    (info.st_mode & (S_IXUSR | S_IXGRP | S_IXOTH)))
                {
                    duk_push_lstring(ctx, path, len);
                    if (!ejs_filepath_is_abs(ctx, -1))
                    {
                        ejs_filepath_abs(ctx, -1);
                    }
                    return 1;
                }
            }
        }
        if (!s[i])
        {
            break;
        }
        s += i + 1;
    }
    ejs_throw_os_format(ctx, ENOENT, "%s: %s", strerror(ENOENT), name);
    return 1;
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
static int send_message_two(int fd, uint8_t t, int err,
                            const void *one, duk_size_t one_len,
                            const void *two, duk_size_t two_len)
{
    char b[1 + 8 + 8];
    b[0] = t;
    uint64_t len = one_len;
    len += two_len;

    ejs_get_binary()->little.put_uint64(b + 1, (uint64_t)err);
    ejs_get_binary()->little.put_uint64(b + 1 + 8, (uint64_t)len);
    if (send_all(fd, b, 1 + 8 + 8))
    {
        return -1;
    }
    if (send_all(fd, one, one_len))
    {
        return -1;
    }
    return send_all(fd, two, two_len);
}
static int send_message_three(int fd, uint8_t t, int err,
                              const void *one, duk_size_t one_len,
                              const void *two, duk_size_t two_len,
                              const void *three, duk_size_t three_len)
{
    char b[1 + 8 + 8];
    b[0] = t;
    uint64_t len = one_len;
    len += two_len + three_len;

    ejs_get_binary()->little.put_uint64(b + 1, (uint64_t)err);
    ejs_get_binary()->little.put_uint64(b + 1 + 8, (uint64_t)len);
    if (send_all(fd, b, 1 + 8 + 8))
    {
        return -1;
    }
    if (send_all(fd, one, one_len))
    {
        return -1;
    }
    if (send_all(fd, two, two_len))
    {
        return -1;
    }
    return send_all(fd, three, three_len);
}
static int send_message_five(int fd, uint8_t t, int err,
                             const void *one, duk_size_t one_len,
                             const void *two, duk_size_t two_len,
                             const void *three, duk_size_t three_len,
                             const void *four, duk_size_t four_len,
                             const void *five, duk_size_t five_len)
{
    char b[1 + 8 + 8];
    b[0] = t;
    uint64_t len = one_len;
    len += two_len + three_len + four_len + five_len;

    ejs_get_binary()->little.put_uint64(b + 1, (uint64_t)err);
    ejs_get_binary()->little.put_uint64(b + 1 + 8, (uint64_t)len);
    if (send_all(fd, b, 1 + 8 + 8))
    {
        return -1;
    }
    if (send_all(fd, one, one_len))
    {
        return -1;
    }
    if (send_all(fd, two, two_len))
    {
        return -1;
    }
    if (send_all(fd, three, three_len))
    {
        return -1;
    }
    if (send_all(fd, four, four_len))
    {
        return -1;
    }
    return send_all(fd, five, five_len);
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
    int epoll;

    pid_t pid;

    ppp_c_fast_string_t buffer_in;
    ppp_c_string_t buffer_out;
    ppp_c_string_t buffer_err;

    uint8_t stdin;
    uint8_t stdout;
    uint8_t stderr;
    uint8_t is_child : 1;
} run_sync_t;

static void fork_child_throw_os_two_sync(
    int *chan,
    int err,
    const char *one,
    const char *two)
{
    send_message_two(
        chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_OS,
        err,
        one, strlen(one),
        two, strlen(two));
    close(chan[EJS_OS_EXEC_CHILD_WRITE]);
    chan[EJS_OS_EXEC_CHILD_WRITE] = -1;
    close(chan[EJS_OS_EXEC_CHILD_READ]);
    chan[EJS_OS_EXEC_CHILD_READ] = -1;
}
static void fork_child_throw_os_three_sync(
    int *chan,
    int err,
    const char *one,
    const char *two,
    const char *three)
{
    send_message_three(
        chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_OS,
        err,
        one, strlen(one),
        two, strlen(two),
        three, strlen(three));
    close(chan[EJS_OS_EXEC_CHILD_WRITE]);
    chan[EJS_OS_EXEC_CHILD_WRITE] = -1;
    close(chan[EJS_OS_EXEC_CHILD_READ]);
    chan[EJS_OS_EXEC_CHILD_READ] = -1;
}
static void fork_child_throw_os_five_sync(
    int *chan,
    int err,
    const char *one,
    const char *two,
    const char *three,
    const char *four,
    const char *five)
{
    send_message_five(
        chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_OS,
        err,
        one, strlen(one),
        two, strlen(two),
        three, strlen(three),
        four, strlen(four),
        five, strlen(five));
    close(chan[EJS_OS_EXEC_CHILD_WRITE]);
    chan[EJS_OS_EXEC_CHILD_WRITE] = -1;
    close(chan[EJS_OS_EXEC_CHILD_READ]);
    chan[EJS_OS_EXEC_CHILD_READ] = -1;
}
static void fork_child_throw_os_sync(int *chan, int err, const char *str)
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
            fork_child_throw_os_two_sync(chan, err, "open /dev/null failed: ", strerror(err));
            return -1;
        }
    }
    if (dup2(fd, std) == -1)
    {
        int err = errno;
        close(fd);
        switch (std)
        {
        case STDOUT_FILENO:
            fork_child_throw_os_two_sync(chan, err, "dup2 STDOUT failed: ", strerror(err));
            break;
        case STDERR_FILENO:
            fork_child_throw_os_two_sync(chan, err, "dup2 STDERR failed: ", strerror(err));
            break;
        default:
            fork_child_throw_os_two_sync(chan, err, "dup2 STDIN failed: ", strerror(err));
            break;
        }
        return -1;
    }
    *pfd = fd;
    return 0;
}
static int fork_child_sync_ignore(duk_context *ctx, run_sync_t *args)
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
    run_sync_t *args = duk_require_pointer(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "path", 4);
    const char *path = duk_require_string(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "name", 4);
    char *name = (char *)duk_require_string(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "workdir", 7);
    if (!duk_is_null_or_undefined(ctx, -1))
    {
        const char *workdir = duk_require_string(ctx, -1);
        if (chdir(workdir) == -1)
        {
            int err = errno;
            fork_child_throw_os_three_sync(args->chan, err, strerror(err), ": ", workdir);
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
                fork_child_throw_os_five_sync(args->chan, err, strerror(err), ": ", key, "=", value);
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
            fork_child_throw_os_two_sync(args->chan, err, "dup2 stdin fail: ", strerror(err));
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
            fork_child_throw_os_two_sync(args->chan, err, "dup2 stdout fail: ", strerror(err));
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
            fork_child_throw_os_two_sync(args->chan, err, "dup2 stderr fail: ", strerror(err));
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
                fork_child_throw_os_sync(args->chan, err, strerror(err));
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
        execve(path, argv, environ);
    }
    else
    {
        char *const argv[] = {name, 0};
        execve(path, argv, environ);
    }

    int err = errno;
    fork_child_throw_os_three_sync(args->chan, err, strerror(err), ": ", path);
    return 0;
}
/**
 * The child process code after fork
 */
static void fork_child_sync(
    duk_context *ctx,
    pid_t pid, run_sync_t *args)
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
            ejs_throw_os_format(ctx, err, "init read pipe fail: %s", strerror(err));
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
            ejs_throw_os_format(ctx, err, "init read pipe fail: %s", strerror(err));
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
                ejs_throw_os_format(ctx, err, "init write pipe fail: %s", strerror(err));
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

        n = read(fd, s->str, s->cap);
        if (n == 0)
        {
            return;
        }
        else if (n < 0)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, "read pipe fail: %s", strerror(err));
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
    if (waitpid(args->pid, &status, 0) == -1)
    {
        int err = errno;
        ejs_throw_os_format(ctx, err, "waitpid fail: %s", strerror(err));
    }
    args->pid = 0;
    if (WIFEXITED(status))
    {
        // get exit code
        int exit_code = WEXITSTATUS(status);
        duk_push_object(ctx);
        duk_push_int(ctx, exit_code);
        duk_put_prop_lstring(ctx, -2, "exit", 4);
        fork_parent_put_prop_lstring(ctx, args->stdout, &args->buffer_out, "stdout", 6);
        fork_parent_put_prop_lstring(ctx, args->stderr, &args->buffer_err, "stderr", 6);
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
    fork_parent_read_sync(ctx, args->chan, header, 0);
    close(args->chan[EJS_OS_EXEC_PARENT_READ]);
    args->chan[EJS_OS_EXEC_PARENT_READ] = -1;

    // pipe
    if (args->buffer_in.len)
    {
        close(args->chan[EJS_OS_EXEC_STDIN_READ]);
        args->chan[EJS_OS_EXEC_STDIN_READ] = -1;
        ssize_t n;
        while (args->buffer_in.len)
        {
            n = write(args->chan[EJS_OS_EXEC_STDIN_WRITE], args->buffer_in.str, args->buffer_in.len);
            if (n < 0)
            {
                kill(args->pid, SIGKILL);
                args->pid = 0;
                break;
            }
            args->buffer_in.str += n;
            args->buffer_in.len -= n;
        }
        close(args->chan[EJS_OS_EXEC_STDIN_WRITE]);
        args->chan[EJS_OS_EXEC_STDIN_READ] = -1;
    }
    else if (EJS_IS_VALID_FD(args->chan[EJS_OS_EXEC_STDOUT_READ]))
    {
        close(args->chan[EJS_OS_EXEC_STDOUT_WRITE]);
        args->chan[EJS_OS_EXEC_STDOUT_WRITE] = -1;
        fork_parent_read_sync_impl(ctx, args->chan[EJS_OS_EXEC_STDOUT_READ], &args->buffer_out);
    }
    else if (EJS_IS_VALID_FD(args->chan[EJS_OS_EXEC_STDERR_READ]))
    {
        close(args->chan[EJS_OS_EXEC_STDERR_WRITE]);
        args->chan[EJS_OS_EXEC_STDERR_WRITE] = -1;
        fork_parent_read_sync_impl(ctx, args->chan[EJS_OS_EXEC_STDERR_READ], &args->buffer_err);
    }
    // wait
    fork_parent_wait(ctx, args);
}

static void fork_parent_epoll_wait(
    duk_context *ctx,
    run_sync_t *args,
    uint8_t *header)
{
    // init epoll
    struct epoll_event ev, events[3];
    puts("epoll");
    ev.events = EPOLLIN;
    // wait child start
    fork_parent_read_sync(ctx, args->chan, header, 0);
    close(args->chan[EJS_OS_EXEC_PARENT_READ]);
    args->chan[EJS_OS_EXEC_PARENT_READ] = -1;

    // pipe

    // wait
    fork_parent_wait(ctx, args);
}
/**
 * Parent process code after fork
 */
static void fork_parent_sync_impl(
    duk_context *ctx,
    run_sync_t *args)
{
    // parent
    close(args->chan[EJS_OS_EXEC_CHILD_WRITE]);
    args->chan[EJS_OS_EXEC_CHILD_WRITE] = -1;
    close(args->chan[EJS_OS_EXEC_CHILD_READ]);
    args->chan[EJS_OS_EXEC_CHILD_READ] = -1;

    // wait child ready
    uint8_t header[17];
    fork_parent_read_sync(ctx, args->chan, header, 1);
    close(args->chan[EJS_OS_EXEC_PARENT_WRITE]);
    args->chan[EJS_OS_EXEC_PARENT_WRITE] = -1;

    // pipe
    if (EJS_IS_VALID_FD(args->epoll))
    {
        fork_parent_epoll_wait(ctx, args, header);
    }
    else
    {
        fork_parent_pipe_wait(ctx, args, header);
    }
}
static void pipe_sync(duk_context *ctx, run_sync_t *args, int read)
{
    const char *fmt = 0;
    const char *tag = 0;
    switch (read)
    {
    case EJS_OS_EXEC_CHILD_READ:
        fmt = "pipe child fail: %s";
        tag = "fcntl pipe child fail: %s";
        break;
    case EJS_OS_EXEC_PARENT_READ:
        fmt = "pipe parent fail: %s";
        tag = "fcntl pipe parent fail: %s";
        break;
    case EJS_OS_EXEC_STDIN_READ:
        fmt = "pipe stdin fail: %s";
        break;
    case EJS_OS_EXEC_STDOUT_READ:
        fmt = "pipe stdout fail: %s";
        break;
    case EJS_OS_EXEC_STDERR_READ:
        fmt = "pipe stderr fail: %s";
        break;
    default:
        duk_push_error_object(ctx, DUK_ERR_ERROR, "unknow pipe %d", read);
        duk_throw(ctx);
        break;
    }
    int write = read + 1;
    if (pipe(args->chan + read) == -1)
    {
        int err = errno;
        args->chan[read] = -1;
        args->chan[write] = -1;

        ejs_throw_os_format(ctx, err, fmt, strerror(err));
    }
    if (tag)
    {
        if (fcntl(args->chan[read], F_SETFD, fcntl(args->chan[read], F_GETFD) | FD_CLOEXEC) == -1)
        {
            int err = errno;
            ejs_throw_os_format(ctx, err, tag, strerror(errno));
        }
        if (fcntl(args->chan[write], F_SETFD, fcntl(args->chan[write], F_GETFD) | FD_CLOEXEC) == -1)
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
    args->stdin = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_number(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "stdout", 6);
    args->stdout = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_number(ctx, -1);
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, 0, "stderr", 6);
    args->stderr = duk_is_null_or_undefined(ctx, -1) ? 0 : duk_require_number(ctx, -1);
    duk_pop(ctx);

    pipe_sync(ctx, args, EJS_OS_EXEC_CHILD_READ);
    pipe_sync(ctx, args, EJS_OS_EXEC_PARENT_READ);

    int pipe_count = 0;
    if (EJS_OS_EXEC_IS_PIPE(args->stdout))
    {
        pipe_sync(ctx, args, EJS_OS_EXEC_STDOUT_READ);
        args->buffer_out.str = malloc(1024 + 1);
        if (!args->buffer_out.str)
        {
            ejs_throw_os_errno(ctx);
        }
        args->buffer_out.cap = 1024;
        ++pipe_count;
    }
    if (EJS_OS_EXEC_IS_PIPE(args->stderr))
    {
        pipe_sync(ctx, args, EJS_OS_EXEC_STDERR_READ);
        args->buffer_err.str = malloc(1024 + 1);
        if (!args->buffer_err.str)
        {
            ejs_throw_os_errno(ctx);
        }
        args->buffer_err.cap = 1024;
        ++pipe_count;
    }
    if (EJS_OS_EXEC_IS_PIPE(args->stdin))
    {
        duk_get_prop_lstring(ctx, 0, "write", 5);
        duk_size_t len;
        args->buffer_in.str = EJS_REQUIRE_CONST_LSOURCE(ctx, -1, &len);
        args->buffer_in.len = len;
        duk_pop(ctx);

        pipe_sync(ctx, args, EJS_OS_EXEC_STDIN_READ);
        ++pipe_count;
        if (pipe_count > 1 && fcntl(args->chan[EJS_OS_EXEC_STDIN_WRITE], F_SETFL, O_NONBLOCK) == -1)
        {
            ejs_throw_os_errno(ctx);
        }
    }
    pid_t pid = fork();
    if (pid < 0)
    {
        ejs_throw_os_errno(ctx);
    }
    else if (pid == 0)
    {
        args->is_child = 1;
        fork_child_sync(ctx, pid, args);
        exit(EXIT_FAILURE);
    }
    else
    {
        args->pid = pid;

        if (pipe_count > 1)
        {
#ifdef EPOLL_CLOEXEC
            args->epoll = epoll_create1(0);
#else
            args->epoll = epoll_create(pipe_count);
#endif
            if (EJS_IS_INVALID_FD(args->epoll))
            {
                int err = errno;
                ejs_throw_os_format(ctx, err, "create epoll fail: %s", strerror(err));
            }
        }
        fork_parent_sync_impl(ctx, args);
    }
    return 1;
}
static duk_ret_t run_sync(duk_context *ctx)
{
    run_sync_t args = {0};
    int n = sizeof(args.chan) / sizeof(int);
    for (int i = 0; i < n; i++)
    {
        args.chan[i] = -1;
    }
    args.epoll = -1;
    args.buffer_in.len = 0;
    args.buffer_in.str = 0;
    args.buffer_out.cap = args.buffer_out.len = 0;
    args.buffer_out.str = 0;
    args.buffer_err.cap = args.buffer_err.len = 0;
    args.buffer_err.str = 0;
    int err = ejs_pcall_function_n(ctx, run_sync_impl, &args, 2);
    if (args.is_child)
    {
        exit(EXIT_FAILURE);
    }
    else if (err && args.pid)
    {
        kill(args.pid, SIGKILL);
    }
    if (EJS_IS_VALID_FD(args.epoll))
    {
        close(args.epoll);
    }
    for (int i = 0; i < n; i++)
    {
        if (EJS_IS_VALID_FD(args.chan[i]))
        {
            close(args.chan[i]);
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
        duk_push_c_lightfunc(ctx, lookpath_sync, 2, 2, 0);
        duk_put_prop_lstring(ctx, -2, "lookpath_sync", 13);

        duk_push_c_lightfunc(ctx, run_sync, 1, 1, 0);
        duk_put_prop_lstring(ctx, -2, "run_sync", 8);
    }

    /*
     *  Entry stack: [ require init_f exports ejs deps ]
     */
    duk_call(ctx, 3);
    return 0;
}
#endif