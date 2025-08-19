declare namespace deps {
    interface RunSyncOption {
        name: string
        /**
         * Startup parameters
         */
        args?: Array<string>
        /**
         * Environment variables
         */
        env?: Array<Array<string>>
        /**
         * Work Path
         */
        workdir?: string

        stdout?: Redirect
        stderr?: Redirect
        stdin?: Redirect
        /**
         * When stdin is a pipe, the contents to be written to the child process
         */
        write?: string | Uint8Array
    }
    function run_sync(opts: RunSyncOption): any
    interface RunOption {
        name: string
        /**
         * Startup parameters
         */
        args?: Array<string>
        /**
         * Environment variables
         */
        env?: Array<Array<string>>
        /**
         * Work Path
         */
        workdir?: string

        stdout?: Redirect
        stderr?: Redirect
        stdin?: Redirect

        state: Uint8Array
    }
    class Pointer {
        readonly __id = "pointer"
    }
    class Command {
        readonly __id = "Command"
        p: Pointer

        start_cb?: (err?: any) => void
        exit_cb?: (result: { exit?: number, signal?: number }) => void
    }
    function cmd(opts: RunOption): Command
    function start(cmd: Command): Pointer
    function destroy(cmd: Command): void
}
export enum Redirect {
    /**
     * Inherited from the parent process
     */
    inherit = 0,
    /**
     * Ignore input and output
     */
    ignore = 1,
    /**
     * Read and write progress in the parent process
     */
    pipe = 2,

    /**
     * The effect for stdin is the same as pipe, and for stdout/stderr, it uses strings instead of Uint8Array output.
     */
    text = 3,
}
export interface RunSyncOption {
    /**
     * Startup parameters
     */
    args?: Array<string>
    /**
     * Environment variables
     */
    env?: Record<string, any>
    /**
     * Work Path
     */
    workdir?: string

    stdout?: Redirect
    stderr?: Redirect
    stdin?: Redirect
    /**
     * Automatically write to stdin after startup
     */
    write?: string | Uint8Array
}
export interface RunSyncResult {
    /**
     * Exit Code
     */
    exit?: number
    /**
     * terminated by signal
     */
    signal?: number
    /**
     * When started with stdout as 'pipe', return stdout to this
     */
    stdout?: Uint8Array
    /**
     * When started with stderr as 'pipe', return stdout to this
     */
    stderr?: Uint8Array
}
function envstring(keys: Record<string, string>): Array<Array<string>> | undefined {
    const arrs = new Array<Array<string>>()
    for (const key in keys) {
        if (Object.prototype.hasOwnProperty.call(keys, key)) {
            const val = keys[key]
            const t = typeof val
            if (t === "string") {
                arrs.push([key, val])
            } else {
                throw new Error(`env value muse be string: typeof env[${key}] === ${t}`);
            }
        }
    }
    return arrs.length ? arrs : undefined
}

/**
 * Run a child process and wait it exit
 * @throws OsError
 * @param name Program to start
 * @param opts Additional options
 */
export function runSync(name: string, opts?: RunSyncOption): RunSyncResult {
    if (opts) {
        return deps.run_sync({
            name: name,
            args: opts.args,
            env: opts.env ? envstring(opts.env) : undefined,
            workdir: opts.workdir,

            stdout: opts.stdout,
            stderr: opts.stderr,
            stdin: opts.stdin,

            write: opts.write,
        })
    }
    return deps.run_sync({
        name: name,
    })
}
export interface RunOption {
    /**
     * Startup parameters
     */
    args?: Array<string>
    /**
     * Environment variables
     */
    env?: Record<string, any>
    /**
     * Work Path
     */
    workdir?: string

    stdout?: Redirect
    stderr?: Redirect
    stdin?: Redirect
}

export class Reader {

}
export class Writer {

}
export class Command {
    constructor(private cmd: deps.Command | undefined, private readonly state: Uint8Array) { }
    stdout?: Reader
    stderr?: Reader
    stdin?: Writer
    close() {
        if (this.cmd) {
            this.cmd = undefined
        }
    }
    run(a: any) {
        if (this.state[0]) {
            throw new Error("Command can only be executed once run")
        }
        if (!this.cmd) {
            throw new Error("command closed")
        }
        if (a === null || a === undefined) {
            return new Promise<RunSyncResult>((resolve, reject) => {
                this._run((exit, e) => {
                    if (e === undefined) {
                        resolve(exit!)
                    } else {
                        reject(e)
                    }
                })
            })
        }
        const t = typeof a
        if (t === "function") {
            this._run(a)
        } else if (t === "object" && typeof a.yield === "function") {
            return a.yield((notify: any) => {
                this._run((v, e) => {
                    if (e === undefined) {
                        notify.value(v)
                    } else {
                        notify.error(e)
                    }
                })
            })
        } else {
            throw new TypeError(`parse function arguments fail: run`)
        }
    }
    private _run(cb: (result?: RunSyncResult, err?: any) => void) {
        const state = this.state
        const cmd = this.cmd!

        cmd.start_cb = (err?: any) => {
            cmd.start_cb = undefined
            if (err) {
                deps.destroy(cmd)
                cb(undefined, err)
                return
            }
            if (!this.cmd) {
                cb(undefined, new Error("command closed"))
                return
            }
            try {
                // init reader writer

                state[0] = 4
                cmd.exit_cb = (result) => {
                    cmd.exit_cb = undefined
                    deps.destroy(cmd)
                    cb(result)
                }
            } catch (e) {
                deps.destroy(cmd)
                cb(undefined, e)
            }
        }
        try {
            deps.start(cmd)
        } catch (e) {
            if (state[0]) {
                deps.destroy(cmd)
            }
            throw e
        }
    }
}

export function run(name: string, opts?: RunOption): Command {
    const state = new Uint8Array(1)
    const o: deps.RunOption = opts ? {
        name: name,
        state: state,
        args: opts.args,
        env: opts.env ? envstring(opts.env) : undefined,
        workdir: opts.workdir,

        stdout: opts.stdout,
        stderr: opts.stderr,
        stdin: opts.stdin,
    } : {
        name: name,
        state: state,
    }
    const cmd = deps.cmd(o)
    return new Command(cmd, state)
}