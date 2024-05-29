declare namespace __duk {
    class Error {
        constructor(message?: string)
    }
    class OsError extends Error {
        constructor(errno: number, message?: string)
        get errnoString(): string
    }
    namespace Os {
        const ETIMEDOUT: number
    }
}
declare namespace deps {
    // Exactly one of O_RDONLY, O_WRONLY, or O_RDWR must be specified.
    const O_RDONLY: number    // open the file read-only.
    // const O_WRONLY: number    // open the file write-only.
    const O_RDWR: number        // open the file read-write.
    // The remaining values may be or'ed in to control behavior.
    // const O_APPEND: number  // append data to the file when writing.
    const O_CREATE: number  // create a new file if none exists.
    // const O_EXCL: number    // used with O_CREATE, file must not exist.
    // const O_SYNC: number     // open for synchronous I/O.
    const O_TRUNC: number    // truncate regular writable file when opened.


    const EBADF: number


    export class FileInfo {
        name?: string
        _p: string
        size: number        // length in bytes for regular files; system-dependent for others
        mode: number     // file mode bits
        modTime?: Date // modification time
        _m: number
        dir: boolean
        regular: boolean
    }
    export function fileinfo_name(info: deps.FileInfo): string
    interface AsyncOptions {
        post?: boolean
    }

    export function isBufferData(v: any): v is Uint8Array

    export class File {
        readonly __id = "File"
        name: string
        fd: any
    }
    export interface OpenOptions extends AsyncOptions {
        name: string
        flags?: number
        perm?: number
    }
    export function open(opts: OpenOptions): File
    export function open(opts: OpenOptions, cb: (f?: File, e?: any) => void): void

    export function close(file: File): void

    export interface FileStatOptions extends AsyncOptions {
        file: deps.File
    }
    export function fstat(opts: FileStatOptions): FileInfo
    export function fstat(opts: FileStatOptions, cb: (info?: FileInfo, e?: any) => void): FileInfo

    export interface StatOptions extends AsyncOptions {
        name: string
    }
    export function stat(opts: StatOptions): FileInfo
    export function stat(opts: StatOptions, cb: (info?: FileInfo, e?: any) => void): void

    export interface SeekOptions extends AsyncOptions {
        fd: any
        offset: number
        whence?: number
    }
    export function seek(opts: SeekOptions): number
    export function seek(opts: SeekOptions, cb: (offset?: number, e?: any) => void): void
    export class ReadArgs {
        readonly __id = "ReadArgs"
    }
    export interface ReadOptions extends AsyncOptions {
        fd: any
        dst: Uint8Array
        args?: ReadArgs
    }
    export function read_args(): ReadArgs
    export function read(opts: ReadOptions): number
    export function read(opts: ReadOptions, cb: (n?: number, e?: any) => void): void

    export class ReadAtArgs {
        readonly __id = "ReadAtArgs"
    }
    export interface ReadAtOptions extends AsyncOptions {
        fd: any
        dst: Uint8Array
        args?: ReadAtArgs
        offset: number
    }
    export function readAt_args(): ReadAtArgs
    export function readAt(opts: ReadAtOptions): number
    export function readAt(opts: ReadAtOptions, cb: (n?: number, e?: any) => void): void

    export class WriteArgs {
        readonly __id = "WriteArgs"
    }
    export interface WriteOptions extends AsyncOptions {
        fd: any
        src: Uint8Array | string
        args?: WriteArgs
    }
    export function write_args(): WriteArgs
    export function write(opts: WriteOptions): number
    export function write(opts: WriteOptions, cb: (n?: number, e?: any) => void): void

    export class WriteAtArgs {
        readonly __id = "WriteAtArgs"
    }
    export interface WriteAtOptions extends AsyncOptions {
        fd: any
        src: Uint8Array | string
        args?: WriteAtArgs
        offset: number
    }
    export function writeAt_args(): WriteAtArgs
    export function writeAt(opts: WriteAtOptions): number
    export function writeAt(opts: WriteAtOptions, cb: (n?: number, e?: any) => void): void
    export interface FSyncOptions extends AsyncOptions {
        fd: any
    }
    export function fsync(opts: FSyncOptions): void
    export function fsync(opts: FSyncOptions, cb: (e?: any) => void): void
    export function fchdir(fd: any): void

    export interface FChmodOptions extends AsyncOptions {
        fd: any
        perm: number
    }
    export function fchmod(opts: FChmodOptions): void
    export function fchmod(opts: FChmodOptions, cb: (e?: any) => void): void

    export interface FChownOptions extends AsyncOptions {
        fd: any
        uid: number
        gid: number
    }
    export function fchown(opts: FChownOptions): void
    export function fchown(opts: FChownOptions, cb: (e?: any) => void): void

    export interface FTruncateOptions extends AsyncOptions {
        fd: any
        size: number
    }
    export function ftruncate(opts: FTruncateOptions): void
    export function ftruncate(opts: FTruncateOptions, cb: (e?: any) => void): void
}

/**
 * Context used for the coroutine to give up the CPU
 */
export interface YieldContext {
    /**
     * After calling function f, release the cpu so that other coroutines can run
     * @remarks
     * Usually f should be an asynchronous function, you can use coroutines to wait for the asynchronous function to complete
     */
    yield<T>(f: (notify: ResumeContext<T>) => void): T
}
/**
 * The context used to wake up the coroutine
 * @remarks
 * You can only call the member function once to wake up the waiting coroutine. Multiple calls will throw an exception.
 */
export interface ResumeContext<T> {
    /**
     * Wake up the coroutine and return the value v for it
     */
    value(v: T): void
    /**
     * Wake up the coroutine and throw an exception.  
     * The exception can be caught by try catch in the coroutine
     */
    error(e?: any): void
    /**
     * After calling the function resume, wake up the coroutine. 
     * The return value of resume is used as the return value of the coroutine.  
     * Exceptions thrown by resume can be caught by the coroutine
     */
    next(resume: () => T): void
}
function isYieldContext(v: any): v is YieldContext {
    return typeof v === "object" && typeof v.yield === "function"
}

export type Error = __duk.OsError
export const Error = __duk.OsError
const osError = __duk.OsError
export interface AsyncOptions {
    post?: boolean
}
export interface OpenFileOptions {
    name: string
    flags?: number
    perm?: number
}
export interface OpenFileAsyncOptions extends OpenFileOptions, AsyncOptions { }
export interface FileInfo {
    name(): string       // base name of the file
    size(): number        // length in bytes for regular files; system-dependent for others
    mode(): number     // file mode bits
    modTime(): Date // modification time
    isDir(): boolean        // abbreviation for Mode().IsDir()
}
export class fileInfo implements FileInfo {
    constructor(private readonly info: deps.FileInfo) { }
    name(): string {
        const info = this.info
        let name = info.name
        if (name === undefined) {
            name = deps.fileinfo_name(info)
            info.name = name
        }
        return name
    }
    size(): number {
        return this.info.size
    }
    mode(): number {
        return this.info.mode
    }
    modTime(): Date {
        const info = this.info
        let v = info.modTime
        if (v === undefined) {
            v = new Date(info._m * 1000)
            info.modTime = v
        }
        return v
    }
    isDir(): boolean {
        return this.info.dir
    }
    isRegular(): boolean {
        return this.info.regular
    }
}
export function statSync(name: string): FileInfo {
    const info = deps.stat({
        name: name
    })
    return new fileInfo(info)
}
export function stat(a: any, b: any, c: any, d: any) {
    if (isYieldContext(a)) {
        return a.yield((notify) => {
            _stat(b, (info, e) => {
                if (info) {
                    notify.value(info)
                } else {
                    notify.error(e)
                }
            }, c)
        })
    } else {
        _stat(a, b, c)
    }
}
export function _stat(name: string, cb: (info?: FileInfo, e?: any) => void, opts?: AsyncOptions) {
    if (typeof cb !== "function") {
        throw new TypeError("cb must be a function")
    }
    deps.stat({
        name: name,
        post: opts?.post ? true : false,
    }, (info, e) => {
        if (!info) {
            cb(undefined, e)
            return
        }
        let ret: FileInfo
        try {
            ret = new fileInfo(info)
        } catch (e) {
            cb(undefined, e)
            return
        }
        cb(ret)
    })
}

export interface SeekOptions {
    offset: number
    whence: number
}
export interface SeekAsyncOptions extends SeekOptions, AsyncOptions { }
export interface ReadAsyncOptions extends AsyncOptions {
    dst: Uint8Array
}
export interface ReadAtOptions {
    dst: Uint8Array
    offset: number
}
export interface ReadAtAsyncOptions extends ReadAtOptions, AsyncOptions { }
export interface WriteAsyncOptions extends AsyncOptions {
    src: Uint8Array | string
}
export interface WriteAtOptions {
    src: Uint8Array | string
    offset: number
}
export interface WriteAtAsyncOptions extends WriteAtOptions, AsyncOptions { }
export interface ChmodAsyncOptions extends AsyncOptions {
    perm: number
}
export interface TruncateAsyncOptions extends AsyncOptions {
    size: number
}
export interface ChownOptions {
    fd: any
    uid: number
    gid: number
}
export interface ChownAsyncOptions extends ChownOptions, AsyncOptions { }
export class File {
    private constructor(private file_: deps.File | undefined) { }
    /**
     * Open files in customized mode
     */
    static openFileSync(opts: OpenFileOptions): File {
        return new File(deps.open({
            name: opts.name,
            flags: opts.flags ?? deps.O_RDONLY,
            perm: opts.perm ?? 0,
        }))
    }
    /**
     * Similar to openFileSync but called asynchronously, notifying the result in cb
     */
    static openFile(a: any, b: any) {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                File._openFile(b, (f, e) => {
                    if (f) {
                        notify.value(f)
                    } else {
                        notify.error(e)
                    }
                })
            })
        } else {
            File._openFile(a, b)
        }
    }
    static _openFile(opts: OpenFileAsyncOptions, cb: (f?: File, e?: any) => void): void {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        deps.open({
            name: opts.name,
            flags: opts.flags ?? deps.O_RDONLY,
            perm: opts.perm ?? 0,
            post: opts.post ? true : false,
        }, (f, e) => {
            if (f) {
                let file: File
                try {
                    file = new File(f!)
                } catch (e) {
                    cb(undefined, e)
                    return
                }
                cb(file, e)
            } else {
                cb(undefined, e)
            }
        })
    }
    /**
     * Open the file as read-only (O_RDONLY)
     */
    static openSync(name: string): File {
        return new File(deps.open({
            name: name,
            flags: deps.O_RDONLY,
            perm: 0,
        }))
    }
    /**
     * Similar to openSync but called asynchronously, notifying the result in cb
     */
    static open(a: any, b: any) {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                File._openFile({
                    name: b,
                    flags: deps.O_RDONLY,
                    perm: 0,
                }, (f, e) => {
                    if (f) {
                        notify.value(f)
                    } else {
                        notify.error(e)
                    }
                })
            })
        } else {
            File._openFile({
                name: a,
                flags: deps.O_RDONLY,
                perm: 0,
            }, b)
        }
    }
    /**
     * Create a new profile
     */
    static createSync(name: string): File {
        return new File(deps.open({
            name: name,
            flags: deps.O_RDWR | deps.O_CREATE | deps.O_TRUNC,
            perm: 0o666,
        }))
    }
    /**
     * Similar to createSync but called asynchronously, notifying the result in cb
     */
    static create(a: any, b: any) {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                File._openFile({
                    name: b,
                    flags: deps.O_RDWR | deps.O_CREATE | deps.O_TRUNC,
                    perm: 0o666,
                }, (f, e) => {
                    if (f) {
                        notify.value(f)
                    } else {
                        notify.error(e)
                    }
                })
            })
        } else {
            File._openFile({
                name: a,
                flags: deps.O_RDWR | deps.O_CREATE | deps.O_TRUNC,
                perm: 0o666,
            }, b)
        }
    }

    isClosed(): boolean {
        return this.file_ ? true : false
    }
    close() {
        const f = this.file_
        if (f) {
            this.file_ = undefined
            this.read_ = undefined
            this.readAt_ = undefined
            this.write_ = undefined
            this.writeAt_ = undefined
            deps.close(f)
        }
    }

    private _file(): deps.File {
        const f = this.file_
        if (!f) {
            throw new osError(deps.EBADF, "file already closed")
        }
        return f;
    }
    /**
     * @returns the archive name passed when opening
     */
    name(): string {
        return this._file().name;
    }
    statSync(): FileInfo {
        const f = this._file()
        const info = deps.fstat({
            file: f
        })
        return new fileInfo(info)
    }
    stat(a: any, b: any) {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._stat((info, e) => {
                    if (info) {
                        notify.value(info)
                    } else {
                        notify.error(e)
                    }
                }, b)
            })
        } else {
            this._stat(a, b)
        }
    }
    private _stat(cb: (info?: FileInfo, e?: any) => void, opts?: AsyncOptions) {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        const f = this._file()
        deps.fstat({
            file: f,
            post: opts?.post ? true : false,
        }, (info, e) => {
            if (!info) {
                cb(undefined, e)
                return
            }
            let ret: FileInfo
            try {
                ret = new fileInfo(info)
            } catch (e) {
                cb(undefined, e)
                return
            }
            cb(ret)
        })
    }
    /**
     * Sets the offset for the next Read or Write on file to offset
     */
    seekSync(opts: SeekOptions): number {
        const f = this._file()
        return deps.seek({
            fd: f.fd,
            offset: opts.offset,
            whence: opts.whence,
        })
    }
    /**
     * Similar to seekSync but called asynchronously, notifying the result in cb
     */
    seek(a: any, b: any) {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._seek(b, (v, e) => {
                    if (v === undefined) {
                        notify.error(e)
                    } else {
                        notify.value(v)
                    }
                })
            })
        } else {
            this._seek(a, b)
        }
    }
    private _seek(opts: SeekAsyncOptions, cb: (offset?: number, e?: any) => void): void {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        const f = this._file()
        deps.seek({
            fd: f.fd,
            offset: opts.offset,
            whence: opts.whence,
            post: opts.post ? true : false,
        }, cb)
    }
    /**
     * Read data to dst
     * @returns the actual length of bytes read, or 0 if eof is read
     */
    readSync(dst: Uint8Array): number {
        const f = this._file()
        return deps.read({
            fd: f.fd,
            dst: dst,
        })
    }
    private read_?: deps.ReadArgs
    /**
     * Similar to readSync but called asynchronously, notifying the result in cb
     */
    read(a: any, b: any) {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._read(b, (v, e) => {
                    if (v === undefined) {
                        notify.error(e)
                    } else {
                        notify.value(v)
                    }
                })
            })
        } else {
            this._read(a, b)
        }
    }
    private _read(opts: ReadAsyncOptions | Uint8Array, cb: (n?: number, e?: any) => void): void {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        const f = this._file()
        const o: deps.ReadOptions = deps.isBufferData(opts) ? {
            fd: f.fd,
            dst: opts,
            post: false,
        } : {
            fd: f.fd,
            dst: opts.dst,
            post: opts.post ? true : false,
        }

        let args = this.read_
        if (args) {
            this.read_ = undefined
        } else {
            args = deps.read_args()
        }
        o.args = args
        try {
            deps.read(o, (n, e) => {
                if (this.file_) {
                    this.read_ = args
                }
                cb(n, e)
            })
        } catch (e) {
            this.read_ = args
            throw e
        }
    }
    /**
     * Read the data at the specified offset
     * @returns the actual length of bytes read, or 0 if eof is read
     */
    readAtSync(opts: ReadAtOptions): number {
        const f = this._file()
        return deps.readAt({
            fd: f.fd,
            dst: opts.dst,
            offset: opts.offset,
        })
    }
    private readAt_?: deps.ReadAtArgs
    /**
     * Similar to readAtSync but called asynchronously, notifying the result in cb
     */
    readAt(a: any, b: any) {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._readAt(b, (v, e) => {
                    if (v === undefined) {
                        notify.error(e)
                    } else {
                        notify.value(v)
                    }
                })
            })
        } else {
            this._readAt(a, b)
        }
    }
    private _readAt(opts: ReadAtAsyncOptions, cb: (n?: number, e?: any) => void): void {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }

        const f = this._file()
        let args = this.readAt_
        if (args) {
            this.readAt_ = undefined
        } else {
            args = deps.readAt_args()
        }
        try {
            deps.readAt({
                fd: f.fd,
                dst: opts.dst,
                offset: opts.offset,
                args: args,
                post: opts.post ? true : false,
            }, (n, e) => {
                if (this.file_) {
                    this.readAt_ = args
                }
                cb(n, e)
            })
        } catch (e) {
            this.readAt_ = args
            throw e
        }
    }
    /**
     * Write data
     * @returns the actual length of bytes write
     */
    writeSync(data: Uint8Array | string): number {
        const f = this._file()
        return deps.write({
            fd: f.fd,
            src: data,
        })
    }
    private write_?: deps.WriteArgs
    /**
     * Similar to writeSync but called asynchronously, notifying the result in cb
     */
    write(a: any, b: any) {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._write(b, (v, e) => {
                    if (v === undefined) {
                        notify.error(e)
                    } else {
                        notify.value(v)
                    }
                })
            })
        } else {
            this._write(a, b)
        }
    }
    private _write(opts: WriteAsyncOptions | Uint8Array | string, cb: (n?: number, e?: any) => void): void {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        const f = this._file()
        const o: deps.WriteOptions = deps.isBufferData(opts) || typeof opts === "string" ? {
            fd: f.fd,
            src: opts,
            post: false,
        } : {
            fd: f.fd,
            src: opts.src,
            post: opts.post ? true : false,
        }

        let args = this.write_
        if (args) {
            this.write_ = undefined
        } else {
            args = deps.write_args()
        }
        o.args = args
        try {
            deps.write(o, (n, e) => {
                if (this.file_) {
                    this.write_ = args
                }
                cb(n, e)
            })
        } catch (e) {
            this.write_ = args
            throw e
        }
    }
    /**
     * Write the data at the specified offset
     * @returns the actual length of bytes write
     */
    writeAtSync(opts: WriteAtOptions): number {
        const f = this._file()
        return deps.writeAt({
            fd: f.fd,
            src: opts.src,
            offset: opts.offset,
        })
    }
    private writeAt_?: deps.WriteAtArgs
    /**
     * Similar to writeAtSync but called asynchronously, notifying the result in cb
     */
    writeAt(a: any, b: any) {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._writeAt(b, (v, e) => {
                    if (v === undefined) {
                        notify.error(e)
                    } else {
                        notify.value(v)
                    }
                })
            })
        } else {
            this._writeAt(a, b)
        }
    }
    private _writeAt(opts: WriteAtAsyncOptions, cb: (n?: number, e?: any) => void): void {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        const f = this._file()

        let args = this.writeAt_
        if (args) {
            this.writeAt_ = undefined
        } else {
            args = deps.writeAt_args()
        }
        try {
            deps.writeAt({
                fd: f.fd,
                src: opts.src,
                offset: opts.offset,
                args: args,
                post: opts.post ? true : false,
            }, (n, e) => {
                if (this.file_) {
                    this.writeAt_ = args
                }
                cb(n, e)
            })
        } catch (e) {
            this.writeAt_ = args
            throw e
        }
    }
    /**
     * Commits the current contents of the file to stable storage.
     * Typically, this means flushing the file system's in-memory copyof recently written data to disk.
     */
    syncSync(): void {
        const f = this._file()
        deps.fsync({
            fd: f.fd,
        })
    }
    /**
     * Similar to syncSync but called asynchronously, notifying the result in cb
     */
    sync(a: any, b: any): void {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._sync((e) => {
                    if (e === undefined) {
                        notify.value()
                    } else {
                        notify.error(e)
                    }
                }, b)
            })
        } else {
            this._sync(a, b)
        }
    }
    private _sync(cb: (e?: any) => void, opts?: AsyncOptions) {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        const f = this._file()
        deps.fsync({
            fd: f.fd,
            post: opts?.post ? true : false,
        }, cb)
    }
    /**
     * changes the current working directory to the file, which must be a directory.
     */
    chdir(): void {
        const f = this._file()
        deps.fchdir(f.fd)
    }
    /**
     * changes the mode of the file to mode
     */
    chmodSync(perm: number): void {
        const f = this._file()
        deps.fchmod({
            fd: f.fd,
            perm: perm,
        })
    }
    /**
     * Similar to chmodSync but called asynchronously, notifying the result in cb
     */
    chmod(a: any, b: any): void {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._chmod(b, (e) => {
                    if (e === undefined) {
                        notify.value()
                    } else {
                        notify.error(e)
                    }
                })
            })
        } else {
            this._chmod(a, b)
        }
    }
    private _chmod(opts: ChmodAsyncOptions, cb: (e?: any) => void) {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        const f = this._file()
        deps.fchmod({
            fd: f.fd,
            perm: opts.perm,
            post: opts.post ? true : false,
        }, cb)
    }
    /**
     * changes the uid and gid of the file
     */
    chownSync(opts: ChownOptions): void {
        const f = this._file()
        deps.fchown({
            fd: f.fd,
            uid: opts.uid,
            gid: opts.gid,
        })
    }
    /**
     * Similar to chownSync but called asynchronously, notifying the result in cb
     */
    chown(a: any, b: any): void {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._chown(b, (e) => {
                    if (e === undefined) {
                        notify.value()
                    } else {
                        notify.error(e)
                    }
                })
            })
        } else {
            this._chown(a, b)
        }
    }
    private _chown(opts: ChownAsyncOptions, cb: (e?: any) => void) {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        const f = this._file()
        deps.fchown({
            fd: f.fd,
            uid: opts.uid,
            gid: opts.gid,
            post: opts.post ? true : false,
        }, cb)
    }
    /**
     * changes the size of the file. It does not change the I/O offset.
     */
    truncateSync(size: number): void {
        const f = this._file()
        deps.ftruncate({
            fd: f.fd,
            size: size,
        })
    }
    /**
     * Similar to truncateSync but called asynchronously, notifying the result in cb
     */
    truncate(a: any, b: any): void {
        if (isYieldContext(a)) {
            return a.yield((notify) => {
                this._truncate(b, (e) => {
                    if (e === undefined) {
                        notify.value()
                    } else {
                        notify.error(e)
                    }
                })
            })
        } else {
            this._truncate(a, b)
        }
    }
    private _truncate(opts: TruncateAsyncOptions, cb: (a: any) => void) {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        const f = this._file()
        deps.ftruncate({
            fd: f.fd,
            size: opts.size,
            post: opts.post ? true : false
        }, cb)
    }
}
export interface Reader {
    read(opts: ReadAsyncOptions | Uint8Array, cb: (n?: number, e?: any) => void): void
}
class readerAll {
    cb: (n?: number, e?: any) => void
    constructor(readonly r: Reader, readonly opts: ReadAsyncOptions | Uint8Array, cb: (n?: number, e?: any) => boolean | undefined) {
        this.cb = (n, e) => {
            const quit = cb(n, e)
            if (quit || n === undefined || n === 0) {
                return
            }
            this.next()
        }
    }
    next() {
        this.r.read(this.opts, this.cb)
    }
}
/**
 * Continue reading the data in the reader until all is read or cb returns true
 * @returns should we stop reading?
 */
export function readAll(reader: Reader, opts: ReadAsyncOptions | Uint8Array, cb: (n?: number, e?: any) => boolean | undefined): void {
    if (typeof cb !== "function") {
        throw new TypeError("cb must be a function")
    }
    const r = new readerAll(reader, opts, cb)
    r.next()
}
