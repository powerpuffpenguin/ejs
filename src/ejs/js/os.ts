declare namespace __duk {
    class Error {
        constructor(message?: string)
    }
    class OsError extends Error {
        constructor(errno: number, message?: string)
        get errnoString(): string
    }
    namespace js {
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
        function isYieldContext(v: any): v is YieldContext
        function coVoid(co: YieldContext, f: (opts: any, cb: (e?: any) => void) => void, opts: any): void
        function coReturn<T>(co: YieldContext, f: (opts: any, cb: (v: T, e?: any) => void) => void, opts: any): T
        /**
         * <Options, CB> -> [Options, CB | undefined]
         */
        function parseAB<Options, CB>(a: any, b: any): [Options, CB | undefined]
        /**
         * <CB, Options> -> [CB | undefined, Options]
         */
        function parseBA<CB, Options>(a: any, b: any): [CB | undefined, Options]
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
        // modTime
        _m: number

        /**
         * * dir 0x1
         * * regular 0x2
         * * link 0x4
         */
        _mode: number
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
    export interface ChmodOptions extends AsyncOptions {
        name: string
        perm: number
    }
    export function chmod(opts: ChmodOptions): void
    export function chmod(opts: ChmodOptions, cb: (e?: any) => void): void

    export interface FChownOptions extends AsyncOptions {
        fd: any
        uid: number
        gid: number
    }
    export function fchown(opts: FChownOptions): void
    export function fchown(opts: FChownOptions, cb: (e?: any) => void): void
    export interface ChownOptions extends AsyncOptions {
        name: string
        uid: number
        gid: number
    }
    export function chown(opts: ChownOptions): void
    export function chown(opts: ChownOptions, cb: (e?: any) => void): void

    export interface FTruncateOptions extends AsyncOptions {
        fd: any
        size: number
    }
    export function ftruncate(opts: FTruncateOptions): void
    export function ftruncate(opts: FTruncateOptions, cb: (e?: any) => void): void
    export interface TruncateOptions extends AsyncOptions {
        name: string
        size: number
    }
    export function truncate(opts: TruncateOptions): void
    export function truncate(opts: TruncateOptions, cb: (e?: any) => void): void

    export interface FileLenOptions extends AsyncOptions {
        name: string
    }
    export function file_len(opts: FileLenOptions): number
    export function file_len(opts: FileLenOptions, cb: (v?: number, e?: any) => void): void

    export interface ReadFileOptions extends AsyncOptions {
        name: string
        buf: Uint8Array
    }
    export function readFile(opts: ReadFileOptions): number
    export function readFile(opts: ReadFileOptions, cb: (n?: number, e?: any) => void): void
    export interface WriteFileOptions extends AsyncOptions {
        name: string
        data?: Uint8Array
        sync: boolean
        perm: number
    }
    export function writeFile(opts: WriteFileOptions): void
    export function writeFile(opts: WriteFileOptions, cb: (e?: any) => void): void

    export interface FReadDirOptions extends AsyncOptions {
        fd: any
        n?: number
    }
    export function fread_dir_names(opts: FReadDirOptions): Array<string>
    export function fread_dir_names(opts: FReadDirOptions, cb: (v: Array<string>, e?: any) => void): void

    export function fread_dir(opts: FReadDirOptions): Array<FileInfo>
    export function fread_dir(opts: FReadDirOptions, cb: (v: Array<FileInfo>, e?: any) => void): void

    export interface ReadDirOptions extends AsyncOptions {
        name: string
        /**
         * If greater than 0, the maximum length of the returned array is n
         */
        n?: number
    }
    export function read_dir_names(opts: ReadDirOptions): Array<string>
    export function read_dir_names(opts: ReadDirOptions, cb: (v: Array<string>, e?: any) => void): void

    export function read_dir(opts: ReadDirOptions): Array<FileInfo>
    export function read_dir(opts: ReadDirOptions, cb: (v: Array<FileInfo>, e?: any) => void): void

    export interface ReadLinkOptions extends AsyncOptions {
        name: string
    }
    export function read_link(opts: ReadLinkOptions): string
    export function read_link(opts: ReadLinkOptions, cb: (path?: string, e?: any) => void): void

    export interface RenameOptions extends AsyncOptions {
        from: string
        to: string
    }
    export function rename(opts: RenameOptions): void
    export function rename(opts: RenameOptions, cb: (e?: any) => void): void

    export interface RemoveOptions extends AsyncOptions {
        name: string
        all?: boolean
    }
    export function remove(opts: RemoveOptions): void
    export function remove(opts: RemoveOptions, cb: (e?: any) => void): void

    export interface LinkOptions extends AsyncOptions {
        from: string
        to: string
        hard?: boolean
    }
    export function link(opts: LinkOptions): void
    export function link(opts: LinkOptions, cb: (e?: any) => void): void
}
const coVoid = __duk.js.coVoid
const coReturn = __duk.js.coReturn
const parseAB = __duk.js.parseAB
const parseBA = __duk.js.parseBA

export type Error = __duk.OsError
export const Error = __duk.OsError
const osError = __duk.OsError
export interface AsyncOptions {
    post?: boolean
}
export interface OpenFileSyncOptions {
    name: string
    flags?: number
    perm?: number
}
export interface OpenFileOptions extends OpenFileSyncOptions, AsyncOptions { }
export interface FileInfo {
    /**
     * base name of the file
     */
    name(): string
    /**
     * length in bytes for regular files
     */
    size(): number
    /**
     * file mode bits
     */
    mode(): number
    /**
     * modification time
     */
    modTime(): Date
    /**
     * abbreviation for mode().isDir()
     */
    isDir(): boolean
    /**
     * abbreviation for mode().isRegular()
     */
    isRegular(): boolean
    /**
     * abbreviation for mode().isLink()
     */
    isLink(): boolean
}
function _fstat(opts: deps.FileStatOptions, cb: (info?: FileInfo, e?: any) => void) {
    deps.fstat(opts, (info, e) => {
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
        return this.info._mode & 0x1 ? true : false
    }
    isRegular(): boolean {
        return this.info._mode & 0x2 ? true : false
    }
    isLink(): boolean {
        return this.info._mode & 0x4 ? true : false
    }
}

export interface SeekSyncOptions {
    offset: number
    whence: number
}
export interface SeekOptions extends SeekSyncOptions, AsyncOptions { }
export interface ReadOptions extends AsyncOptions {
    dst: Uint8Array
}
export interface ReadAtSyncOptions {
    dst: Uint8Array
    offset: number
}
export interface ReadAtOptions extends ReadAtSyncOptions, AsyncOptions { }
export interface WriteOptions extends AsyncOptions {
    src: Uint8Array | string
}
export interface WriteAtSyncOptions {
    src: Uint8Array | string
    offset: number
}
export interface WriteAtOptions extends WriteAtSyncOptions, AsyncOptions { }
export interface FileChmodAsyncOptions extends AsyncOptions {
    perm: number
}
export interface FileTruncateOptions extends AsyncOptions {
    size: number
}
export interface FileChownSyncOptions {
    fd: any
    uid: number
    gid: number
}
export interface FileChownOptions extends FileChownSyncOptions, AsyncOptions { }

export interface FileReadDirOptions extends AsyncOptions {
    n?: number
}
export function _fread_dir(opts: deps.FReadDirOptions, cb: (items?: Array<FileInfo>, e?: any) => void) {
    deps.fread_dir(opts, (items, e) => {
        if (e === undefined) {
            let ret: Array<FileInfo>
            try {
                ret = items.length ? items.map((v) => new fileInfo(v)) : items as any
            } catch (e) {
                cb(undefined, e)
                return
            }
            cb(ret)
        } else {
            cb(undefined, e)
        }
    })
}
export class File {
    private constructor(private file_: deps.File | undefined) { }
    /**
     * Open files in customized mode
     */
    static openFileSync(opts: OpenFileSyncOptions): File {
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
        const [opts, cb] = parseAB<OpenFileOptions, (f?: File, e?: any) => void>(a, b)
        const o: deps.OpenOptions = {
            name: opts.name,
            flags: opts.flags ?? deps.O_RDONLY,
            perm: opts.perm ?? 0,
            post: opts.post,
        }
        return cb ? File._openFile(o, cb) : coReturn(a, File._openFile, o)
    }
    static _openFile(opts: deps.OpenOptions, cb: (f?: File, e?: any) => void): void {
        deps.open({
            name: opts.name,
            flags: opts.flags ?? deps.O_RDONLY,
            perm: opts.perm ?? 0,
            post: opts.post,
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
        const [name, cb] = parseAB<string, (f?: File, e?: any) => void>(a, b)
        const o: deps.OpenOptions = {
            name: name,
            flags: deps.O_RDONLY,
            perm: 0,
        }
        return cb ? File._openFile(o, cb) : coReturn(a, File._openFile, o)
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
        const [name, cb] = parseAB<string, (f?: File, e?: any) => void>(a, b)
        const o: deps.OpenOptions = {
            name: name,
            flags: deps.O_RDWR | deps.O_CREATE | deps.O_TRUNC,
            perm: 0o666,
        }
        return cb ? File._openFile(o, cb) : coReturn(a, File._openFile, o)
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
        const [cb, opts] = parseBA<(info?: FileInfo, e?: any) => void, AsyncOptions | undefined>(a, b)
        const o: deps.FileStatOptions = {
            file: this._file(),
            post: opts?.post,
        }
        return cb ? _fstat(o, cb) : coReturn(a, _fstat, o)
    }
    /**
     * Sets the offset for the next Read or Write on file to offset
     */
    seekSync(opts: SeekSyncOptions): number {
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
        const [opts, cb] = parseAB<SeekOptions, (n?: number, e?: any) => void>(a, b)
        const o: deps.SeekOptions = {
            fd: this._file().fd,
            offset: opts.offset,
            whence: opts.whence,
            post: opts.post,
        }
        return cb ? deps.seek(o, cb) : coReturn(a, deps.seek, o)
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
        const [opts, cb] = parseAB<ReadOptions, (n?: number, e?: any) => void>(a, b)
        const f = this._file()
        const o: deps.ReadOptions = deps.isBufferData(opts) ? {
            fd: f.fd,
            dst: opts,
        } : {
            fd: f.fd,
            dst: opts.dst,
            post: opts.post,
        }
        let args = this.read_
        if (args) {
            this.read_ = undefined
        } else {
            args = deps.read_args()
        }
        o.args = args
        if (cb) {
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
        } else {
            try {
                return coReturn(a, deps.read, o)
            } finally {
                if (this.file_) {
                    this.read_ = args
                }
            }
        }
    }
    /**
     * Read the data at the specified offset
     * @returns the actual length of bytes read, or 0 if eof is read
     */
    readAtSync(opts: ReadAtSyncOptions): number {
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
        const [opts, cb] = parseAB<ReadAtOptions, (n?: number, e?: any) => void>(a, b)
        const f = this._file()
        const o: deps.ReadAtOptions = {
            fd: f.fd,
            dst: opts.dst,
            offset: opts.offset,
            post: opts.post,
        }
        let args = this.readAt_
        if (args) {
            this.readAt_ = undefined
        } else {
            args = deps.readAt_args()
        }
        o.args = args
        if (cb) {
            try {
                deps.readAt(o, (n, e) => {
                    if (this.file_) {
                        this.readAt_ = args
                    }
                    cb(n, e)
                })
            } catch (e) {
                this.readAt_ = args
                throw e
            }
        } else {
            try {
                return coReturn(a, deps.readAt, o)
            } finally {
                this.readAt_ = args
            }
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
        const [opts, cb] = parseAB<WriteOptions | Uint8Array | string, (n?: number, e?: any) => void>(a, b)
        const f = this._file()
        const o: deps.WriteOptions = deps.isBufferData(opts) || typeof opts === "string" ? {
            fd: f.fd,
            src: opts,
        } : {
            fd: f.fd,
            src: opts.src,
            post: opts.post,
        }
        let args = this.write_
        if (args) {
            this.write_ = undefined
        } else {
            args = deps.write_args()
        }
        o.args = args
        if (cb) {
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
        } else {
            try {
                return coReturn(a, deps.write, o)
            } finally {
                this.write_ = args
            }
        }
    }
    /**
     * Write the data at the specified offset
     * @returns the actual length of bytes write
     */
    writeAtSync(opts: WriteAtSyncOptions): number {
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
        const [opts, cb] = parseAB<WriteAtOptions, (n?: number, e?: any) => void>(a, b)
        const f = this._file()
        const o: deps.WriteAtOptions = {
            fd: f.fd,
            src: opts.src,
            offset: opts.offset,
            post: opts.post,
        }
        let args = this.writeAt_
        if (args) {
            this.writeAt_ = undefined
        } else {
            args = deps.writeAt_args()
        }
        o.args = args
        if (cb) {
            try {
                deps.writeAt(o, (n, e) => {
                    if (this.file_) {
                        this.writeAt_ = args
                    }
                    cb(n, e)
                })
            } catch (e) {
                this.writeAt_ = args
                throw e
            }
        } else {
            try {
                return coReturn(a, deps.writeAt, o)
            } finally {
                this.writeAt_ = args
            }
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
        const [cb, opts] = parseBA<(e?: any) => void, AsyncOptions | undefined>(a, b);
        const o: deps.FSyncOptions = {
            fd: this._file().fd,
            post: opts?.post,
        }
        return cb ? deps.fsync(o, cb) : coVoid(a, deps.fsync, o)
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
        const [opts, cb] = parseAB<FileChmodAsyncOptions, (e?: any) => void>(a, b);
        const o: deps.FChmodOptions = {
            fd: this._file().fd,
            perm: opts.perm,
            post: opts.post,
        }
        return cb ? deps.fchmod(o, cb) : coVoid(a, deps.fchmod, o)
    }
    /**
     * changes the uid and gid of the file
     */
    chownSync(opts: FileChownSyncOptions): void {
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
        const [opts, cb] = parseAB<FileChownOptions, (e?: any) => void>(a, b);
        const o: deps.FChownOptions = {
            fd: this._file().fd,
            uid: opts.uid,
            gid: opts.gid,
            post: opts.post,
        }
        return cb ? deps.fchown(o, cb) : coVoid(a, deps.fchown, o)
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
        const [opts, cb] = parseAB<FileTruncateOptions, (e?: any) => void>(a, b);
        const o: deps.FTruncateOptions = {
            fd: this._file().fd,
            size: opts.size,
            post: opts.post,
        }
        return cb ? deps.ftruncate(o, cb) : coVoid(a, deps.ftruncate, o)
    }

    /**
     * Read the file name in the folder
     * @param n If greater than 0, the maximum length of the returned array is n
     */
    readDirNamesSync(n?: number): Array<string> {
        const f = this._file()
        return deps.fread_dir_names({
            fd: f.fd,
            n: n,
        })
    }
    /**
     * Similar to readDirNamesSync but called asynchronously, notifying the result in cb
     */
    readDirNames(a: any, b: any) {
        const [cb, opts] = parseBA<(dirs?: Array<string>, e?: any) => void, FileReadDirOptions | number | undefined>(a, b)
        const f = this._file()
        const o: deps.FReadDirOptions = typeof opts === "number" ? {
            fd: f.fd,
            n: opts,
        } : {
            fd: f.fd,
            n: opts?.n,
            post: opts?.post,
        }
        return cb ? deps.fread_dir_names(o, cb) : coReturn(a, deps.fread_dir_names, o)
    }

    /**
     * Read the file info in the folder
     * @param n If greater than 0, the maximum length of the returned array is n
     */
    readDirSync(n?: number): Array<FileInfo> {
        const f = this._file()
        const items = deps.fread_dir({
            fd: f.fd,
            n: n,
        })
        return items.length ? items.map((info) => new fileInfo(info)) : items as any
    }
    /**
     * Similar to readDirSync but called asynchronously, notifying the result in cb
     */
    readDir(a: any, b: any) {
        const [cb, opts] = parseBA<(dirs?: Array<FileInfo>, e?: any) => void, FileReadDirOptions | number | undefined>(a, b)
        const f = this._file()
        const o: deps.FReadDirOptions = typeof opts === "number" ? {
            fd: f.fd,
            n: opts,
        } : {
            fd: f.fd,
            n: opts?.n,
            post: opts?.post,
        }
        return cb ? _fread_dir(o, cb) : coReturn(a, _fread_dir, o)
    }

}

export interface Reader {
    read(opts: ReadOptions | Uint8Array, cb: (n?: number, e?: any) => void): void
}
class readerAll {
    cb: (n?: number, e?: any) => void
    constructor(readonly r: Reader, readonly opts: ReadOptions | Uint8Array, cb: (n?: number, e?: any) => boolean | undefined) {
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
export function readAll(reader: Reader, opts: ReadOptions | Uint8Array, cb: (n?: number, e?: any) => boolean | undefined): void {
    if (typeof cb !== "function") {
        throw new TypeError("cb must be a function")
    }
    const r = new readerAll(reader, opts, cb)
    r.next()
}

export function statSync(name: string): FileInfo {
    const info = deps.stat({
        name: name
    })
    return new fileInfo(info)
}
export function stat(a: any, b: any, opts?: AsyncOptions) {
    const [name, cb] = parseAB<string, (info?: FileInfo, e?: any) => void>(a, b)
    const o: deps.StatOptions = {
        name: name,
        post: opts?.post,
    }
    return cb ? _stat(o, cb) : coReturn(a, _stat, o)
}
export function _stat(opts: deps.StatOptions, cb: (info?: FileInfo, e?: any) => void) {
    deps.stat(opts, (info, e) => {
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
export interface ChmodSyncOptions {
    name: string
    perm: number
}
export interface ChmodOptions extends ChmodSyncOptions, AsyncOptions { }
/**
 * changes the mode of the file to mode
 */
export function chmodSync(opts: ChmodSyncOptions): void {
    deps.chmod({
        name: opts.name,
        perm: opts.perm,
    })
}
/**
 * Similar to chmodSync but called asynchronously, notifying the result in cb
 */
export function chmod(a: any, b: any) {
    const [opts, cb] = parseAB<ChmodOptions, (e?: any) => void>(a, b)
    const o: deps.ChmodOptions = {
        name: opts.name,
        perm: opts.perm,
        post: opts.post,
    }
    return cb ? deps.chmod(o, cb) : coVoid(a, deps.chmod, o)
}

export interface ChownSyncOptions {
    name: string
    uid: number
    gid: number
}
export interface ChownOptions extends ChownSyncOptions, AsyncOptions { }
/**
 * changes the uid and gid of the file
 */
export function chownSync(opts: ChownSyncOptions): void {
    deps.chown({
        name: opts.name,
        uid: opts.uid,
        gid: opts.gid,
    })
}
/**
 * Similar to chownSync but called asynchronously, notifying the result in cb
 */
export function chown(a: any, b: any) {
    const [opts, cb] = parseAB<ChownOptions, (e?: any) => void>(a, b)
    const o: deps.ChownOptions = {
        name: opts.name,
        uid: opts.uid,
        gid: opts.gid,
        post: opts.post,
    }
    return cb ? deps.chown(o, cb) : coVoid(a, deps.chown, o)
}
export interface TruncateSyncOptions {
    name: string
    size: number
}
export interface TruncateOptions extends TruncateSyncOptions, AsyncOptions { }
/**
 * changes the size of the file
 */
export function truncateSync(opts: TruncateSyncOptions): void {
    deps.truncate({
        name: opts.name,
        size: opts.size,
    })
}
/**
 * Similar to truncateSync but called asynchronously, notifying the result in cb
 */
export function truncate(a: any, b: any) {
    const [opts, cb] = parseAB<TruncateOptions, (e?: any) => void>(a, b)
    const o: deps.TruncateOptions = {
        name: opts.name,
        size: opts.size,
        post: opts.post,
    }
    return cb ? deps.truncate(o, cb) : coVoid(a, deps.truncate, o)
}
export interface ReadFileOptions extends AsyncOptions {
    name: string
}
/**
 * Read file contents
 */
export function readFileSync(name: string): Uint8Array {
    const len = deps.file_len({
        name: name,
    })
    if (!len) {
        return new Uint8Array()
    }
    const buf = new Uint8Array(len)
    const n = deps.readFile({
        name: name,
        buf: buf,
    })
    return buf.subarray(0, n)
}
/**
 * abbreviation for new TextDecoder().decode(readFileSync(name))
 */
export function readTextFileSync(name: string): string {
    const len = deps.file_len({
        name: name,
    })
    if (!len) {
        return ""
    }
    const buf = new Uint8Array(len)
    const n = deps.readFile({
        name: name,
        buf: buf,
    })
    return new TextDecoder().decode(buf.subarray(0, n))
}
export interface _ReadFileOptions extends AsyncOptions {
    name: string
    s?: boolean
}
function _readFile<T>(opts: _ReadFileOptions, cb: (data?: T, e?: any) => void) {
    const post = opts.post ? true : false
    deps.file_len({
        name: opts.name,
        post: post,
    }, (len, e) => {
        if (e) {
            cb(undefined, e)
        }
        if (!len) {
            let data: any
            try {
                if (opts.s) {
                    data = ""
                } else {
                    data = new Uint8Array()
                }
            } catch (e) {
                cb(undefined, e)
                return
            }
            cb(data)
            return
        }
        try {
            const buf = new Uint8Array(len)
            deps.readFile({
                name: opts.name,
                buf: buf,
                post: post,
            }, (n, e) => {
                if (n === undefined) {
                    cb(undefined, e)
                    return
                }
                let data: any
                try {
                    data = buf.subarray(0, n)
                    if (opts.s) {
                        data = new TextDecoder().decode(data)
                    }
                } catch (e) {
                    cb(undefined, e)
                    return
                }
                cb(data)
            })
        } catch (e) {
            cb(undefined, e)
        }
    })
}
export function readFile(a: any, b: any) {
    const [opts, cb] = parseAB<string | ReadFileOptions, (data?: Uint8Array, e?: any) => void>(a, b)
    const o: _ReadFileOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        post: opts.post,
    }
    return cb ? _readFile(o, cb) : coReturn(a, _readFile, o)
}
export function readTextFile(a: any, b: any) {
    const [opts, cb] = parseAB<string | ReadFileOptions, (s?: string, e?: any) => void>(a, b)
    const o: _ReadFileOptions = typeof opts === "string" ? {
        name: opts,
        s: true,
    } : {
        name: opts.name,
        post: opts.post,
        s: true,
    }
    return cb ? _readFile(o, cb) : coReturn(a, _readFile, o)
}

export interface WriteFileSyncOptions {
    name: string
    data?: Uint8Array
    perm?: number
    sync?: boolean
}
export interface WriteFileOptions extends WriteFileSyncOptions, AsyncOptions { }
/**
 * Create archive and write data
 */
export function writeFileSync(opts: WriteFileSyncOptions): void {
    deps.writeFile({
        name: opts.name,
        data: opts.data,
        perm: opts.perm ?? 0o666,
        sync: opts.sync ? true : false,
    })
}
export function writeFile(a: any, b: any): void {
    const [opts, cb] = parseAB<WriteFileOptions, (e?: any) => void>(a, b)
    const o: deps.WriteFileOptions = {
        name: opts.name,
        data: opts.data,
        perm: opts.perm ?? 0o666,
        sync: opts.sync ? true : false,
        post: opts.post,
    }
    return cb ? deps.writeFile(o, cb) : coVoid(a, deps.writeFile, o)
}
export interface WriteTextFileSyncOptions {
    name: string
    data: string
    perm?: number
    sync?: boolean
}
export interface WriteTextFileOptions extends WriteTextFileSyncOptions, AsyncOptions { }
export function writeTextFileSync(opts: WriteTextFileSyncOptions): void {
    deps.writeFile({
        name: opts.name,
        data: opts.data === "" ? undefined : new TextEncoder().encode(opts.data),
        perm: opts.perm ?? 0o666,
        sync: opts.sync ? true : false,
    })
}
export function writeTextFile(a: any, b: any): void {
    const [opts, cb] = parseAB<WriteTextFileOptions, (e?: any) => void>(a, b)
    const o: deps.WriteFileOptions = {
        name: opts.name,
        data: opts.data === "" ? undefined : new TextEncoder().encode(opts.data),
        perm: opts.perm ?? 0o666,
        sync: opts.sync ? true : false,
        post: opts.post,
    }
    return cb ? deps.writeFile(o, cb) : coVoid(a, deps.writeFile, o)
}

export interface ReadDirSyncOptions {
    name: string
    /**
     * If greater than 0, the maximum length of the returned array is n
     */
    n?: number
}
export interface ReadDirOptions extends ReadDirSyncOptions, AsyncOptions { }
/**
 * Read the file name in the folder
 */
export function readDirNamesSync(opts: ReadDirSyncOptions): Array<string> {
    return deps.read_dir_names({
        name: opts.name,
        n: opts.n,
    })
}
/**
 * Similar to readDirNamesSync but called asynchronously, notifying the result in cb
 */
export function readDirNames(a: any, b: any) {
    const [opts, cb] = parseAB<ReadDirOptions, (dirs?: Array<string>, e?: any) => void>(a, b)
    const o: deps.ReadDirOptions = {
        name: opts.name,
        n: opts.n,
        post: opts.post,
    }
    return cb ? deps.read_dir_names(o, cb) : coReturn(a, deps.read_dir_names, o)
}

/**
 * Read the file info in the folder
 */
export function readDirSync(opts: ReadDirSyncOptions): Array<FileInfo> {
    const items = deps.read_dir({
        name: opts.name,
        n: opts.n,
    })
    return items.length ? items.map((v) => new fileInfo(v)) : items as any
}

function _readDir(opts: deps.ReadDirOptions, cb: (items?: Array<FileInfo>, e?: any) => void) {
    deps.read_dir({
        name: opts.name,
        n: opts.n,
        post: opts.post,
    }, (items, e) => {
        if (e === undefined) {
            let ret: Array<FileInfo>
            try {
                ret = items.length ? items.map((v) => new fileInfo(v)) : items as any
            } catch (e) {
                cb(undefined, e)
                return
            }
            cb(ret)
        } else {
            cb(undefined, e)
        }
    })
}
/**
 * Similar to readDirSync but called asynchronously, notifying the result in cb
 */
export function readDir(a: any, b: any) {
    const [opts, cb] = parseAB<ReadDirOptions, (dirs?: Array<FileInfo>, e?: any) => void>(a, b)
    const o: deps.ReadDirOptions = {
        name: opts.name,
        n: opts.n,
        post: opts.post,
    }
    return cb ? _readDir(o, cb) : coReturn(a, _readDir, o)
}

export interface ReadLinkOptions extends AsyncOptions {
    name: string
}
/**
 * returns the destination of the named symbolic link
 */
export function readLinkSync(name: string): string {
    return deps.read_link({
        name: name,
    })
}

/**
 * Similar to readLinkSync but called asynchronously, notifying the result in cb
 */
export function readLink(a: any, b: any) {
    const [opts, cb] = parseAB<string | ReadLinkOptions, (path?: string, e?: any) => void>(a, b)
    const o: deps.ReadLinkOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        post: opts.post,
    }
    return cb ? deps.read_link(o, cb) : coReturn(a, deps.read_link, o)
}

export interface RenameSyncOptions {
    from: string
    to: string
}
export interface RenameOptions extends RenameSyncOptions, AsyncOptions { }
/**
 *  renames (moves) opts.from to opts.to
 */
export function renameSync(opts: RenameSyncOptions): void {
    return deps.rename({
        from: opts.from,
        to: opts.to,
    })
}
/**
 *  Similar to renameSync but called asynchronously, notifying the result in cb
 */
export function rename(a: any, b: any) {
    const [opts, cb] = parseAB<RenameOptions, (e?: any) => void>(a, b)
    const o: deps.RenameOptions = {
        from: opts.from,
        to: opts.to,
        post: opts.post,
    }
    return cb ? deps.rename(o, cb) : coVoid(a, deps.rename, o)
}

export interface RemoveSyncOptions {
    name: string
    all?: boolean
}
export interface RemoveOptions extends RemoveSyncOptions, AsyncOptions { }
export function removeSync(opts: RemoveSyncOptions | string): void {
    const o: deps.RemoveOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        all: opts.all,
    }
    return deps.remove(o)
}
export function remove(a: any, b: any) {
    const [opts, cb] = parseAB<RemoveOptions | string, (e?: any) => void>(a, b)
    const o: deps.RemoveOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        all: opts.all,
        post: opts.post,
    }
    return cb ? deps.remove(o, cb) : coVoid(a, deps.remove, o)
}
export interface LinkSyncOptions {
    from: string
    to: string
    hard?: boolean
}
export interface LinkOptions extends LinkSyncOptions, AsyncOptions { }
/**
 * creates opts.to as a link to the opts.from file.
 */
export function linkSync(opts: LinkSyncOptions) {
    return deps.link({
        from: opts.from,
        to: opts.to,
        hard: opts.hard,
    })
}
/**
 *  Similar to linkSync but called asynchronously, notifying the result in cb
 */
export function link(a: any, b: any) {
    const [opts, cb] = parseAB<LinkOptions, (e?: any) => void>(a, b)
    const o: deps.LinkOptions = {
        from: opts.from,
        to: opts.to,
        hard: opts.hard,
        post: opts.post,
    }
    return cb ? deps.link(o, cb) : coVoid(a, deps.link, o)
}
