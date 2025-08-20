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

        /**
         * If true, the parent process exits after the child process is started.
         */
        exec?: boolean
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

        stdout?: Pointer
        stderr?: Pointer
        stdin?: Pointer

        start_cb?: (err?: any) => void
        exit_cb?: (result: { exit?: number, signal?: number }) => void

        stdout_cb?: (b?: evbuffer, e?: any) => void
        stderr_cb?: (b: evbuffer, e?: any) => void
        stdin_cb?: (e?: any) => void
    }
    function cmd(opts: RunOption): Command
    function start(cmd: Command): Pointer
    function destroy(cmd: Command): void

    function reader_cb(r: Pointer, ok: boolean): true | undefined
    function reader_active(cmd: Pointer, r: Pointer): void
    function reader_close(cmd: Pointer, r: Pointer): void

    class evbuffer {
        readonly __id = "evbuffer"
    }
    function evbuffer_len(b: evbuffer): number
    function evbuffer_read(b: evbuffer, dst: Uint8Array): number
    function evbuffer_copy(b: evbuffer, dst: Uint8Array, skip?: number): number
    function evbuffer_drain(b: evbuffer, n: number): number

    function writer_w(w: Pointer, data: string | Uint8Array, maxWriteBytes?: number): number | undefined
    function writer_close(cmd: Pointer, w: Pointer): void


    function exit(): never
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

    /**
     * If true, the parent process exits after the child process is started.
     */
    exec?: boolean
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
            exec: opts.exec ? true : false,
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

    /**
     * If true, the parent process exits after the child process is started.
     */
    exec?: boolean
}
/**
 * Readable network device for reading ready data
 */
export interface Readable {
    /**
     * Returns the currently ready data length
     */
    readonly length: number
    /**
     * Read as much data as possible into dst, returning the actual bytes read
     * @returns the actual read data length
     */
    read(dst: Uint8Array): number
    /**
     * Copies as much data as possible to dst, returning the actual copied bytes. 
     * This function does not cause the Readable.length property to change
     * @returns the actual copied data length
     */
    copy(dst: Uint8Array, skip?: number): number
    /**
     * Discard data of specified length
     * @returns the actual discarded data length
     */
    drain(n: number): number
}
class evbufferReadable implements Readable {
    constructor(readonly b: deps.evbuffer) { }
    get length(): number {
        if (this.closed_) {
            throw new Error(`Readable has expired, it is only valid in callback function onReadable`)
        }
        return deps.evbuffer_len(this.b)
    }
    read(dst: Uint8Array): number {
        if (this.closed_) {
            throw new Error(`Readable has expired, it is only valid in callback function onReadable`)
        }
        return deps.evbuffer_read(this.b, dst)
    }
    copy(dst: Uint8Array, skip?: number): number {
        if (this.closed_) {
            throw new Error(`Readable has expired, it is only valid in callback function onReadable`)
        }
        return deps.evbuffer_copy(this.b, dst, skip)
    }
    drain(n: number) {
        if (this.closed_) {
            throw new Error(`Readable has expired, it is only valid in callback function onReadable`)
        }
        return deps.evbuffer_drain(this.b, n)
    }
    private closed_ = false
    _close() {
        this.closed_ = true
    }
}
export type OnMessageCallback<Self> = (this: Self, data: Uint8Array) => void
export type OnReadableCallback<Self> = (this: Self, r: Readable) => void
export type OnCloseCallback<Self> = (this: Self, err?: any) => void
export class Reader {
    private _get() {
        if (this.state[0] == 200) {
            return
        }
        return this.r
    }
    constructor(private readonly cmd: deps.Pointer,
        private r: deps.Pointer | undefined,
        private readonly state: Uint8Array,
    ) { }
    buffer?: Uint8Array
    private _buffer(): Uint8Array {
        let b = this.buffer
        if (b && b.length > 0) {
            return b
        }
        b = new Uint8Array(1024 * 32)
        this.buffer = b
        return b
    }
    _read(r: deps.evbuffer) {
        const actived = this.actived_
        if (actived) {
            this.actived_ = undefined
            clearImmediate(actived)
        }

        const onReadable = this.onReadableBind_
        if (onReadable) {
            const rb = new evbufferReadable(r)
            onReadable(rb)
            rb._close()
            if (!this._get()) {
                return
            }
        }

        const onMessage = this.onMessageBind_
        if (onMessage) {
            const b = this._buffer()
            const n = deps.evbuffer_read(r, b)
            switch (n) {
                case 0:
                    break
                case b.length:
                    onMessage(b)
                    break
                default:
                    onMessage(b.length == n ? b : b.subarray(0, n))
                    break
            }
        } else if (!onReadable) {
            const r = this._get()
            if (r) {
                deps.reader_cb(r, false)
            }
        }
    }
    _close(e: any): void {
        const r = this.r
        if (r) {
            if (this.state[0] != 200) {
                deps.reader_close(this.cmd, r)
            }
            this.r = undefined
        }
        const actived = this.actived_
        if (actived) {
            this.actived_ = undefined
            clearImmediate(actived)
        }
        if (r) {
            const f = this.onCloseBind_
            if (f) {
                f(e)
            }
        }
    }

    private onReadable_?: OnReadableCallback<Reader>
    private onReadableBind_?: (r: Readable) => void
    /**
     * Callback when a message is received. If set to undefined, it will stop receiving data. 
     */
    get onReadable(): OnReadableCallback<Reader> | undefined {
        return this.onReadable_
    }
    set onReadable(f: OnReadableCallback<Reader> | undefined) {
        if (f === undefined || f === null) {
            if (!this.onReadable_) {
                return
            }
            const r = this._get()
            if (r && !this.onMessage_) {
                deps.reader_cb(r, false)
            }
            this.onReadable_ = undefined
            this.onReadableBind_ = undefined
        } else {
            if (f === this.onReadable_) {
                return
            }
            if (typeof f !== "function") {
                throw new Error("onReadable must be a function")
            }
            const r = this._get()
            const bind = r ? f.bind(this) : undefined
            if (r && !this.onMessage_) {
                if (deps.reader_cb(r, true)) {
                    this._active()
                }
            }
            this.onReadableBind_ = bind
            this.onReadable_ = f
        }
    }

    private onMessage_?: OnMessageCallback<Reader>
    private onMessageBind_?: (data: Uint8Array) => void
    get onMessage(): OnMessageCallback<Reader> | undefined {
        return this.onMessage_
    }
    set onMessage(f: OnMessageCallback<Reader> | undefined) {
        if (f === undefined || f === null) {
            if (!this.onMessage_) {
                return
            }
            const r = this._get()
            if (r && !this.onReadable_) {
                deps.reader_cb(r, false)
            }
            this.onMessage_ = undefined
            this.onMessageBind_ = undefined
        } else {
            if (f === this.onMessage_) {
                return
            }
            if (typeof f !== "function") {
                throw new Error("onMessage must be a function")
            }
            const r = this._get()
            const bind = r ? f.bind(this) : undefined
            if (r && !this.onReadable_) {
                if (deps.reader_cb(r, true)) {
                    this._active()
                }
            }
            this.onMessageBind_ = bind
            this.onMessage_ = f
        }
    }
    private actived_?: number
    private _active() {
        if (this.actived_) {
            return
        }
        this.actived_ = setImmediate(() => {
            const r = this._get()
            if (!r) {
                return
            }
            const actived = this.actived_
            if (!actived) {
                return
            }
            this.actived_ = undefined
            deps.reader_active(this.cmd, r)
        })
    }
    private onClose_?: OnCloseCallback<Reader>
    private onCloseBind_?: (err?: any) => void
    get onClose(): OnCloseCallback<Reader> | undefined {
        return this.onClose_
    }
    set onClose(f: OnCloseCallback<Reader> | undefined) {
        if (f === undefined || f === null) {
            this.onClose_ = undefined
            this.onCloseBind_ = undefined
        } else {
            if (f === this.onClose_) {
                return
            }
            if (typeof f !== "function") {
                throw new Error("onClose must be a function")
            }
            const r = this._get()
            const bind = r ? f.bind(this) : undefined
            this.onCloseBind_ = bind
            this.onClose_ = f
        }
    }
}
export class Writer {
    private _get() {
        if (this.state[0] == 200) {
            return
        }
        return this.w
    }
    constructor(
        private cmd: deps.Pointer,
        private w: deps.Pointer | undefined,
        private readonly state: Uint8Array,
    ) { }
    close(e?: any) {
        const w = this.w
        if (w) {
            if (this.state[0] != 200) {
                deps.writer_close(this.cmd, w)
            }
            this.w = undefined

            const f = this.onCloseBind_
            if (f) {
                f(e)
            }
        }
    }
    write(data: string | Uint8Array): number | undefined {
        const w = this._get()
        if (w) {
            return deps.writer_w(w, data, this.maxWriteBytes)
        }
    }
    _write() {
        const f = this.onWritableBInd_
        if (f) {
            f()
        }
    }
    maxWriteBytes = 1024 * 1024
    private onWritable_?: (this: Writer) => void
    private onWritableBInd_?: () => void
    get onWritable() {
        return this.onWritable_
    }
    set onWritable(f: any) {
        if (f === undefined || f === null) {
            this.onWritable_ = undefined
            this.onWritableBInd_ = undefined
        } else {
            if (f === this.onWritable_) {
                return
            }
            if (typeof f !== "function") {
                throw new Error("onWritable must be a function")
            }
            const w = this._get()
            this.onWritableBInd_ = w ? f.bind(this) : undefined
            this.onWritable_ = f
        }
    }

    private onClose_?: OnCloseCallback<Writer>
    private onCloseBind_?: (err?: any) => void
    get onClose(): OnCloseCallback<Writer> | undefined {
        return this.onClose_
    }
    set onClose(f: OnCloseCallback<Writer> | undefined) {
        if (f === undefined || f === null) {
            this.onClose_ = undefined
            this.onCloseBind_ = undefined
        } else {
            if (f === this.onClose_) {
                return
            }
            if (typeof f !== "function") {
                throw new Error("onClose must be a function")
            }
            const w = this._get()
            const bind = w ? f.bind(this) : undefined
            this.onCloseBind_ = bind
            this.onClose_ = f
        }
    }
}
export class Command {
    constructor(name: string, opts?: RunOption) {
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
        try {
            if (cmd.stdin) {
                this.stdin = new Writer(cmd.p, cmd.stdin, state)
                cmd.stdin_cb = (e) => {
                    const writer = this.stdin
                    if (writer) {
                        if (e === undefined) {
                            writer._write()
                        } else {
                            this.stdin = undefined
                            writer.close(e)

                        }
                    }

                }
            }
            if (cmd.stdout) {
                this.stdout = new Reader(cmd.p, cmd.stdout, state)
                cmd.stdout_cb = (r, e) => {
                    const reader = this.stdout
                    if (reader) {
                        if (r === undefined) {
                            this.stdout = undefined
                            reader._close(e)
                        } else {
                            reader._read(r)
                        }
                    }
                }
            }
            if (cmd.stderr) {
                this.stderr = new Reader(cmd.p, cmd.stderr, state)
                cmd.stderr_cb = (r, e) => {
                    const reader = this.stderr
                    if (reader) {
                        if (r === undefined) {
                            this.stderr = undefined
                            reader._close(e)
                        } else {
                            reader._read(r)
                        }
                    }
                }
            }
        } catch (e) {
            this.close()
            throw e
        }
        this.state = state
        this.cmd_ = cmd
    }
    private cmd_?: deps.Command | undefined
    private readonly state: Uint8Array
    stdout?: Reader
    stderr?: Reader
    stdin?: Writer
    close() {
        const cmd = this.cmd_
        if (cmd) {
            const writer = this.stdin
            if (writer) {
                this.stdin = undefined
                writer.close()
            }

            let reader = this.stdout
            let e: Error | undefined
            if (reader) {
                this.stdout = undefined
                e = new Error("Command already close")
                reader._close(e)
            }
            reader = this.stderr
            if (reader) {
                this.stderr = undefined
                if (!e) {
                    e = new Error("Command already close")
                }
                reader._close(e)
            }
            this.cmd_ = undefined
            this.state[0] = 200
            deps.destroy(cmd)
        }
    }
    run(a: any) {
        if (this.state[0]) {
            throw new Error("Command can only be executed once run")
        }
        if (!this.cmd_) {
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
        const cmd = this.cmd_!

        cmd.start_cb = (err?: any) => {
            cmd.start_cb = undefined
            if (err) {
                this.close()
                cb(undefined, err)
                return
            }
            if (!this.cmd_) {
                cb(undefined, new Error("command closed"))
                return
            }
            try {
                state[0] = 4

                cmd.exit_cb = (result) => {
                    cmd.exit_cb = undefined
                    this.close()
                    cb(result)
                }
            } catch (e) {
                this.close()
                cb(undefined, e)
            }
        }
        try {
            deps.start(cmd)
        } catch (e) {
            if (state[0]) {
                this.close()
            }
            throw e
        }
    }
}

