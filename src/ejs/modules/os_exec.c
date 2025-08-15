#include "modules_shared.h"
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

#define EJS_OS_EXEC_CHILD_READ 0
#define EJS_OS_EXEC_PARENT_WRITE 1
#define EJS_OS_EXEC_PARENT_READ 2
#define EJS_OS_EXEC_CHILD_WRITE 3

#define EJS_OS_EXEC_FORK_OK 0
#define EJS_OS_EXEC_FORK_ERR 1
#define EJS_OS_EXEC_FORK_TYPE 2
#define EJS_OS_EXEC_FORK_OS 3

extern char **environ;

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

/**
 * ... string => throw
 */
static void fork_child_throw_os_sync(duk_context *ctx, int *chan, int err)
{
    duk_size_t buf_len = 0;
    const uint8_t *buf = duk_require_lstring(ctx, -1, &buf_len);
    send_message(chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_OS, err, buf, buf_len);
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
            duk_push_sprintf(ctx, "open /dev/null failed: %s", strerror(err));
            fork_child_throw_os_sync(ctx, chan, err);
            return -1;
        }
    }
    if (dup2(fd, std) == -1)
    {
        close(fd);
        int err = errno;
        switch (std)
        {
        case STDOUT_FILENO:
            duk_push_sprintf(ctx, "dup2 STDOUT failed: %s", strerror(err));
            break;
        case STDERR_FILENO:
            duk_push_sprintf(ctx, "dup2 STDERR failed: %s", strerror(err));
        default:
            duk_push_sprintf(ctx, "dup2 STDIN failed: %s", strerror(err));
            break;
        }

        fork_child_throw_os_sync(ctx, chan, err);
        return -1;
    }
    *pfd = fd;
    return 0;
}
static int fork_child_sync_ignore(duk_context *ctx, int *chan, int std_in, int std_out, int std_err)
{
    int fd = -1;
    if (EJS_OS_EXEC_REDIRECT_IGNORE == std_in &&
        fork_child_sync_dup2(ctx, chan, &fd, STDIN_FILENO))
    {
        return -1;
    }
    if (EJS_OS_EXEC_REDIRECT_IGNORE == std_out &&
        fork_child_sync_dup2(ctx, chan, &fd, STDOUT_FILENO))
    {
        return -1;
    }
    if (EJS_OS_EXEC_REDIRECT_IGNORE == std_err &&
        fork_child_sync_dup2(ctx, chan, &fd, STDERR_FILENO))
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
    int *chan = duk_require_pointer(ctx, -1);
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
            duk_push_sprintf(ctx, "%s: %s", strerror(err), workdir);
            fork_child_throw_os_sync(ctx, chan, err);
            return 0;
        }
    }
    duk_pop(ctx);

    duk_get_prop_lstring(ctx, -1, "stdin", 5);
    int std_in = 0;
    if (!duk_is_null_or_undefined(ctx, -1))
    {
        std_in = duk_require_number(ctx, -1);
    }
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, -1, "stdout", 6);
    int std_out = 0;
    if (!duk_is_null_or_undefined(ctx, -1))
    {
        std_out = duk_require_number(ctx, -1);
    }
    duk_pop(ctx);
    duk_get_prop_lstring(ctx, -1, "stderr", 6);
    int std_err = 0;
    if (!duk_is_null_or_undefined(ctx, -1))
    {
        std_err = duk_require_number(ctx, -1);
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
                duk_push_sprintf(ctx, "%s: %s=%s\n", strerror(err), key, value);
                fork_child_throw_os_sync(ctx, chan, err);
                return 0;
            }
        }
    }
    duk_pop(ctx);

    // stdin stdout stderr
    if (fork_child_sync_ignore(ctx, chan, std_in, std_out, std_err))
    {
        return 0;
    }

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
                duk_push_string(ctx, strerror(err));
                fork_child_throw_os_sync(ctx, chan, err);
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
    send_all(chan[EJS_OS_EXEC_CHILD_WRITE], header, sizeof(header));
    // close(chan[EJS_OS_EXEC_CHILD_WRITE]);
    // chan[EJS_OS_EXEC_CHILD_WRITE] = -1;

    read_full(chan[EJS_OS_EXEC_CHILD_READ], header, sizeof(header));
    close(chan[EJS_OS_EXEC_CHILD_READ]);
    chan[EJS_OS_EXEC_CHILD_READ] = -1;

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
    duk_push_sprintf(ctx, "%s: %s", strerror(err), path);
    fork_child_throw_os_sync(ctx, chan, err);
    return 0;
}
/**
 * The child process code after fork
 */
static void fork_child_sync(
    duk_context *ctx,
    pid_t pid, int *chan)
{
    close(chan[EJS_OS_EXEC_PARENT_WRITE]);
    close(chan[EJS_OS_EXEC_PARENT_READ]);

    // child
    duk_push_c_lightfunc(ctx, fork_child_sync_impl, 2, 2, 0);
    duk_swap_top(ctx, -3);
    duk_swap_top(ctx, -2);
    duk_pcall(ctx, 2);

    EJS_RESET_FD(chan[EJS_OS_EXEC_CHILD_READ]);
    if (chan[EJS_OS_EXEC_CHILD_WRITE] != -1)
    {
        if (duk_is_type_error(ctx, -1))
        {
            duk_get_prop_lstring(ctx, -1, "message", 7);
            duk_size_t s_len;
            const uint8_t *s = duk_require_lstring(ctx, -1, &s_len);
            send_message(chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_TYPE, 0, s, s_len);
        }
        else if (duk_is_error(ctx, -1))
        {
            duk_get_prop_lstring(ctx, -1, "message", 7);
            duk_size_t s_len;
            const uint8_t *s = duk_require_lstring(ctx, -1, &s_len);
            send_message(chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_ERR, 0, s, s_len);
        }
        else
        {
            send_message(chan[EJS_OS_EXEC_CHILD_WRITE], EJS_OS_EXEC_FORK_ERR, 0, "unknow error", 12);
        }
        close(chan[EJS_OS_EXEC_CHILD_WRITE]);
    }
}

/**
 * The parent process obtains the child process preparation information from the pipe
 */
static void fork_parent_read_sync(
    duk_context *ctx,
    pid_t pid, int *chan,
    uint8_t *header, duk_bool_t first)
{
    if (first)
    {
        if (read_full(chan[EJS_OS_EXEC_PARENT_READ], header, 17))
        {
            kill(pid, SIGKILL);
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
        kill(pid, SIGKILL);
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
            kill(pid, SIGKILL);
            duk_push_error_object(ctx, DUK_ERR_ERROR, "read pipe fail");
            duk_throw(ctx);
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
            kill(pid, SIGKILL);
            duk_push_error_object(ctx, DUK_ERR_ERROR, "init read pipe fail");
            duk_throw(ctx);
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
                kill(pid, SIGKILL);
                duk_push_error_object(ctx, DUK_ERR_ERROR, "init write pipe fail");
                duk_throw(ctx);
            }
            return;
        }
        break;
    }
    kill(pid, SIGKILL);
    duk_push_error_object(ctx, DUK_ERR_ERROR, "read unknow data from pipe");
    duk_throw(ctx);
}

/**
 * Parent process code after fork
 */
static void fork_parent_sync_impl(
    duk_context *ctx,
    pid_t pid, int *chan)
{
    // parent
    close(chan[EJS_OS_EXEC_CHILD_WRITE]);
    chan[EJS_OS_EXEC_CHILD_WRITE] = -1;
    close(chan[EJS_OS_EXEC_CHILD_READ]);
    chan[EJS_OS_EXEC_CHILD_READ] = -1;

    // wait child ready
    uint8_t header[17];
    fork_parent_read_sync(ctx, pid, chan, header, 1);
    close(chan[EJS_OS_EXEC_PARENT_WRITE]);
    chan[EJS_OS_EXEC_PARENT_WRITE] = -1;
    // wait child start
    fork_parent_read_sync(ctx, pid, chan, header, 0);
    close(chan[EJS_OS_EXEC_PARENT_READ]);
    chan[EJS_OS_EXEC_PARENT_READ] = -1;

    // wait child exit
    int status;
    if (waitpid(pid, &status, 0) == -1)
    {
        ejs_throw_os_errno(ctx);
    }
    if (WIFEXITED(status))
    {
        // get exit code
        int exit_code = WEXITSTATUS(status);
        duk_push_object(ctx);
        duk_push_int(ctx, exit_code);
        duk_put_prop_lstring(ctx, -2, "exit", 4);
    }
    else
    {
        ejs_throw_os_errno(ctx);
    }
}
static duk_ret_t run_sync_impl(duk_context *ctx)
{
    int *chan = duk_require_pointer(ctx, -1);
    if (pipe(chan) == -1)
    {
        chan[0] = -1;
        chan[1] = -1;
        ejs_throw_os_errno(ctx);
    }
    if (fcntl(chan[0], F_SETFD, fcntl(chan[0], F_GETFD) | FD_CLOEXEC) == -1)
    {
        ejs_throw_os_errno(ctx);
    }
    if (fcntl(chan[1], F_SETFD, fcntl(chan[1], F_GETFD) | FD_CLOEXEC) == -1)
    {
        ejs_throw_os_errno(ctx);
    }
    if (pipe(chan + 2) == -1)
    {
        chan[2] = -1;
        chan[3] = -1;
        ejs_throw_os_errno(ctx);
    }
    if (fcntl(chan[2], F_SETFD, fcntl(chan[2], F_GETFD) | FD_CLOEXEC) == -1)
    {
        ejs_throw_os_errno(ctx);
    }
    if (fcntl(chan[3], F_SETFD, fcntl(chan[3], F_GETFD) | FD_CLOEXEC) == -1)
    {
        ejs_throw_os_errno(ctx);
    }

    pid_t pid = fork();
    if (pid < 0)
    {
        ejs_throw_os_errno(ctx);
    }
    else if (pid == 0)
    {
        fork_child_sync(ctx, pid, chan);
        exit(EXIT_FAILURE);
    }
    else
    {
        fork_parent_sync_impl(ctx, pid, chan);
    }
    return 1;
}
static duk_ret_t run_sync(duk_context *ctx)
{
    int chan[4] = {-1, -1, -1, -1};
    int err = ejs_pcall_function_n(ctx, run_sync_impl, &chan, 2);
    for (int i = 0; i < 4; i++)
    {
        if (EJS_IS_VALID_FD(chan[i]))
        {
            close(chan[i]);
        }
    }

    if (err)
    {
        duk_throw(ctx);
    }
    return 1;
}

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