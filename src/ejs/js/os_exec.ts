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
    }
    class Command {

    }
    function run(opts: RunOption, cb: (cmd?: Command, err?: any) => void): void
}
import { parseArgs, parseOptionalArgs, callReturn, callVoid } from "ejs/sync";
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
    exit: number
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
export class Command {
    static run_impl(opts: deps.RunOption, cb: (cmd?: Command, err?: any) => void) {
        deps.run(opts, (raw, err) => {
            if (raw) {
                let c: Command
                try {
                    c = new Command(raw)
                } catch (e) {
                    cb(undefined, e)
                    return
                }
                cb(c)
            } else {
                cb(undefined, err)
            }
        })
    }
    private constructor(cmd: deps.Command) {
        this.cmd_ = cmd
    }
    private cmd_: deps.Command
}

export function run(name: string, a: any, b: any) {
    const args = parseOptionalArgs<RunOption, (cmd?: deps.Command, e?: any) => void>('run', a, b)
    const opts = args.opts
    const o: deps.RunOption = opts ? {
        name: name,
        args: opts.args,
        env: opts.env ? envstring(opts.env) : undefined,
        workdir: opts.workdir,

        stdout: opts.stdout,
        stderr: opts.stderr,
        stdin: opts.stdin,
    } : {
        name: name,
    }
    args.opts = o as any
    return callReturn(Command.run_impl, args as any)
}