declare namespace __duk {
    class Error {
        constructor(message?: string)
    }
    class OsError extends Error {
        constructor(errno: number, message?: string)
        get errnoString(): string
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
    export interface CreateOptions extends AsyncOptions {
        name: string
        flags?: number
        perm?: number
    }
    export function create(opts: CreateOptions): File
    export function create(opts: CreateOptions, cb: (f?: File, e?: any) => void): void

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

    export function chdir(name: string): void

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

    export interface ReadFileOptions extends AsyncOptions {
        name: string
        buf?: Uint8Array
    }
    export function read_file(opts: ReadFileOptions): Uint8Array
    export function read_file(opts: ReadFileOptions, cb: (data?: Uint8Array, e?: any) => void): void
    export function read_text_file(opts: ReadFileOptions): string
    export function read_text_file(opts: ReadFileOptions, cb: (s?: string, e?: any) => void): void
    export interface WriteFileOptions extends AsyncOptions {
        name: string
        data?: Uint8Array
        sync?: boolean
        perm?: number
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

    export interface CreateTempOptions extends AsyncOptions {
        pattern: string
        /**
         * @default tempDir()
         */
        dir?: string
        /**
         * @default 0o600
         */
        perm?: number
    }
    export function createTemp(opts: CreateTempOptions): File
    export function createTemp(opts: CreateTempOptions, cb: (f?: File, e?: any) => void): void

    export function rmdir(opts: RemoveOptions): void
    export function rmdir(opts: RemoveOptions, cb: (e?: any) => void): void

    export interface MkdirOptions extends AsyncOptions {
        name: string
        perm?: number
        all?: boolean
    }
    export function mkdir(opts: MkdirOptions): void
    export function mkdir(opts: MkdirOptions, cb: (e?: any) => void): void

    export interface MkdirTempOptions extends AsyncOptions {
        pattern: string
        /**
         * @default tempDir()
         */
        dir?: string
        /**
         * @default 0o700
         */
        perm?: number
    }
    export function mkdirTemp(opts: MkdirTempOptions): string
    export function mkdirTemp(opts: MkdirTempOptions, cb: (dir?: string, e?: any) => void): void
}
import { parseArgs, parseOptionalArgs, callReturn, callVoid } from "ejs/sync";

export type OsError = __duk.OsError
export const OsError = __duk.OsError

export interface LinkErrorOptions {
    op: string
    from: string
    to: string
    err: any
}
export class LinkError extends Error {
    constructor(public opts: LinkErrorOptions) {
        super()
        // restore prototype chain   
        const proto = new.target.prototype
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, proto)
        }
        else {
            (this as any).__proto__ = proto
        }
        this.name = "LinkError"
    }
    get message(): string {
        const opts = this.opts
        const err = opts.err
        return `${opts.op} ${opts.from} ${opts.to}: ${err instanceof Error ? err.message : err}`
    }
    unwrap() {
        return this.opts.err
    }
}
export interface PathErrorOptions {
    op: string
    path: string
    err: any
}
export class PathError extends Error {
    constructor(public opts: PathErrorOptions) {
        super()
        // restore prototype chain   
        const proto = new.target.prototype
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, proto)
        }
        else {
            (this as any).__proto__ = proto
        }
        this.name = "PathError"
    }
    get message(): string {
        const opts = this.opts
        const err = opts.err
        return `${opts.op} ${opts.path}: ${err instanceof Error ? err.message : err}`
    }
    unwrap() {
        return this.opts.err
    }
}

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

class fileInfo implements FileInfo {
    static mapArray(items: Array<deps.FileInfo>): Array<FileInfo> {
        return items.length ? items.map((v) => new fileInfo(v)) : (items as any)
    }
    static map(info: deps.FileInfo): FileInfo {
        return new fileInfo(info)
    }
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

const errClosed = new OsError(deps.EBADF)
export interface CreateTempSyncOptions {
    pattern: string
    /**
     * @default tempDir()
     */
    dir?: string

    /**
     * @default 0o600
     */
    perm?: number
}
export interface CreateTempOptions extends CreateTempSyncOptions, AsyncOptions { }
export interface OpenFileSyncOptions {
    name: string
    /**
     * @default O_RDONLY
     */
    flags?: number
    /**
     * @default 0
     */
    perm?: number
}
export interface OpenFileOptions extends OpenFileSyncOptions, AsyncOptions { }
export interface CreateFileSyncOptions {
    name: string
    /**
     * @default O_RDONLY | O_CREATE | O_TRUNC
     */
    flags?: number
    /**
     * @default 0o666
     */
    perm?: number
}
export interface CreateFileOptions extends CreateFileSyncOptions, AsyncOptions { }
export class File {
    private constructor(private file_: deps.File | undefined) {
        this.name_ = file_!.name
    }
    private name_: string
    private static attachFile(f: deps.File) {
        return new File(f)
    }

    /**
    * creates a new temporary file in the directory dir
    */
    static createTempSync(opts: string | CreateTempSyncOptions): File {
        const o: deps.CreateTempOptions = typeof opts === "string" ? {
            pattern: opts,
        } : {
            pattern: opts.pattern,
            dir: opts.dir,
            perm: opts.perm,
        }
        try {
            const f = deps.createTemp(o)
            return new File(f)
        } catch (e) {
            throw new PathError({
                op: 'createTempSync',
                path: o.pattern,
                err: e,
            })
        }
    }
    /**
     * Similar to createTempSync but called asynchronously, notifying the result in cb
     */
    static createTemp(a: any, b: any) {
        const args = parseArgs<CreateTempOptions | string, (f?: File, e?: any) => void>('createTemp', a, b)
        const opts = args.opts!
        const o: deps.CreateTempOptions = typeof opts === "string" ? {
            pattern: opts,
        } : {
            pattern: opts.pattern,
            dir: opts.dir,
            perm: opts.perm,
            post: opts.post,
        }
        args.opts = o
        const ce = (e: any) => new PathError({
            op: 'createTemp',
            path: o.pattern,
            err: e,
        })
        return callReturn(deps.createTemp, args as any, File.attachFile, ce)
    }
    /**
     * Open files in customized mode
     * @throws PathError
     */
    static openSync(opts: OpenFileSyncOptions | string): File {
        const o: deps.OpenOptions = typeof opts === "string" ? {
            name: opts,
        } : {
            name: opts.name,
            flags: opts.flags,
            perm: opts.perm,
        }
        try {
            return new File(deps.open(o))
        } catch (e) {
            throw new PathError({
                op: 'openSync',
                path: o.name,
                err: e,
            })
        }
    }
    /**
     * Similar to openFileSync but called asynchronously, notifying the result in cb
     */
    static open(a: any, b: any) {
        const args = parseArgs<OpenFileOptions | string, (f?: File, e?: any) => void>('open', a, b)
        const opts = args.opts!
        const o: deps.OpenOptions = typeof opts === "string" ? {
            name: opts,
        } : {
            name: opts.name,
            flags: opts.flags,
            perm: opts.perm,
            post: opts.post,
        }
        args.opts = o
        const ce = (e: any) => new PathError({
            op: 'open',
            path: o.name,
            err: e,
        })
        return callReturn(deps.open, args as any, File.attachFile, ce)
    }
    /**
     * Open files in customized mode
     * @throws PathError
     */
    static createSync(opts: CreateFileSyncOptions | string): File {
        const o: deps.CreateOptions = typeof opts === "string" ? {
            name: opts,
        } : {
            name: opts.name,
            flags: opts.flags,
            perm: opts.perm,
        }
        try {
            return new File(deps.create(o))
        } catch (e) {
            throw new PathError({
                op: 'createSync',
                path: o.name,
                err: e,
            })
        }
    }
    /**
     * Similar to createSync but called asynchronously, notifying the result in cb
     */
    static create(a: any, b: any) {
        const args = parseArgs<CreateFileOptions | string, (f?: File, e?: any) => void>('create', a, b)
        const opts = args.opts!
        const o: deps.OpenOptions = typeof opts === "string" ? {
            name: opts,
        } : {
            name: opts.name,
            flags: opts.flags,
            perm: opts.perm,
            post: opts.post,
        }
        args.opts = o
        const ce = (e: any) => new PathError({
            op: 'create',
            path: o.name,
            err: e,
        })
        return callReturn(deps.create, args as any, File.attachFile, ce)
    }


    isClosed(): boolean {
        return this.file_ ? true : false
    }
    close() {
        const f = this.file_
        if (f) {
            this.file_ = undefined
            if (this.read_) {
                this.read_ = undefined
            }
            if (this.readAt_) {
                this.readAt_ = undefined
            }
            if (this.write_) {
                this.write_ = undefined
            }
            if (this.writeAt_) {
                this.writeAt_ = undefined
            }
            deps.close(f)
        }
    }
    private _file(op: string): deps.File {
        const f = this.file_
        if (!f) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: errClosed,
            })
        }
        return f;
    }
    /**
     * @returns the archive name passed when opening
     */
    name(): string {
        return this.name_;
    }
    statSync(): FileInfo {
        const op = 'statSync'
        const f = this._file(op)
        try {
            return new fileInfo(deps.fstat({
                file: f,
            }))
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    stat(a: any, b: any) {
        const op = 'stat'
        const f = this._file(op)
        const args = parseOptionalArgs<AsyncOptions, (info?: FileInfo, e?: any) => void>(op, a, b)
        const opts = args.opts
        const o: deps.FileStatOptions = {
            file: f,
            post: opts?.post,
        }
        args.opts = o
        const ce = (e: any) => new PathError({
            op: op,
            path: this.name_,
            err: e,
        })
        return callReturn(deps.fstat, args as any, fileInfo.map, ce)
    }
    /**
     * Sets the offset for the next Read or Write on file to offset
     * @throws PathError
     */
    seekSync(opts: SeekSyncOptions): number {
        const op = 'seekSync'
        const f = this._file(op)
        try {
            return deps.seek({
                fd: f.fd,
                offset: opts.offset,
                whence: opts.whence,
            })
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    /**
     * Similar to seekSync but called asynchronously, notifying the result in cb
     */
    seek(a: any, b: any) {
        const op = 'seek'
        const f = this._file(op)
        const args = parseArgs<SeekOptions, (n?: number, e?: any) => void>(op, a, b)
        const opts = args.opts!
        const o: deps.SeekOptions = {
            fd: f.fd,
            offset: opts.offset,
            whence: opts.whence,
            post: opts.post,
        }
        args.opts = o as any
        const ce = (e: any) => new PathError({
            op: op,
            path: this.name_,
            err: e,
        })
        return callReturn(deps.seek, args as any, undefined, ce)
    }
    /**
     * Read data to dst
     * @throws PathError
     * @returns the actual length of bytes read, or 0 if eof is read
     */
    readSync(dst: Uint8Array): number {
        const op = 'readSync'
        const f = this._file(op)
        try {
            return deps.read({
                fd: f.fd,
                dst: dst,
            })
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    private read_?: deps.ReadArgs
    /**
     * Similar to readSync but called asynchronously, notifying the result in cb
     */
    read(a: any, b: any) {
        const op = 'read'
        const f = this._file(op)
        const args = parseArgs<ReadOptions, (n?: number, e?: any) => void>(op, a, b)
        const opts = args.opts!
        let buf = this.read_
        if (buf) {
            this.read_ = undefined
        } else {
            try {
                buf = deps.read_args()
            } catch (e) {
                throw new PathError({
                    op: op,
                    path: this.name_,
                    err: e,
                })
            }
        }
        const o: deps.ReadOptions = deps.isBufferData(opts) ? {
            fd: f.fd,
            dst: opts,
            args: buf,
        } : {
            fd: f.fd,
            dst: opts.dst,
            args: buf,
            post: opts.post,
        }
        args.opts = o
        const cv = (v: any) => {
            if (this.file_) {
                this.read_ = buf
            }
            return v
        }
        const ce = (e: any) => {
            if (this.file_) {
                this.read_ = buf
            }
            return new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
        return callReturn(deps.read, args as any, cv, ce)
    }
    /**
     * Read the data at the specified offset
     * @throws PathError
     * @returns the actual length of bytes read, or 0 if eof is read
     */
    readAtSync(opts: ReadAtSyncOptions): number {
        const op = 'readAtSync'
        const f = this._file(op)
        try {
            return deps.readAt({
                fd: f.fd,
                dst: opts.dst,
                offset: opts.offset,
            })
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    private readAt_?: deps.ReadAtArgs
    /**
     * Similar to readAtSync but called asynchronously, notifying the result in cb
     */
    readAt(a: any, b: any) {
        const op = 'readAt'
        const f = this._file(op)
        const args = parseArgs<ReadAtOptions, (n?: number, e?: any) => void>(op, a, b)
        const opts = args.opts!
        let buf = this.readAt_
        if (buf) {
            this.readAt_ = undefined
        } else {
            try {
                buf = deps.readAt_args()
            } catch (e) {
                throw new PathError({
                    op: op,
                    path: this.name_,
                    err: e,
                })
            }
        }
        const o: deps.ReadAtOptions = {
            fd: f.fd,
            dst: opts.dst,
            offset: opts.offset,
            args: buf,
            post: opts.post,
        }
        args.opts = o
        const cv = (v: any) => {
            if (this.file_) {
                this.readAt_ = buf
            }
            return v
        }
        const ce = (e: any) => {
            if (this.file_) {
                this.readAt_ = buf
            }
            return new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
        return callReturn(deps.readAt, args as any, cv, ce)
    }
    /**
     * Write data
     * @throws PathError
     * @returns the actual length of bytes write
     */
    writeSync(data: Uint8Array | string): number {
        const op = 'writeSync'
        const f = this._file(op)
        try {
            return deps.write({
                fd: f.fd,
                src: data,
            })
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    private write_?: deps.WriteArgs
    /**
     * Similar to writeSync but called asynchronously, notifying the result in cb
     */
    write(a: any, b: any) {
        const op = 'write'
        const f = this._file(op)
        const args = parseArgs<WriteOptions | Uint8Array | string, (n?: number, e?: any) => void>(op, a, b)
        const opts = args.opts!
        let buf = this.write_
        if (buf) {
            this.write_ = undefined
        } else {
            try {
                buf = deps.write_args()
            } catch (e) {
                throw new PathError({
                    op: op,
                    path: this.name_,
                    err: e,
                })
            }
        }
        const o: deps.WriteOptions = deps.isBufferData(opts) || typeof opts === "string" ? {
            fd: f.fd,
            src: opts,
            args: buf,
        } : {
            fd: f.fd,
            src: opts.src,
            args: buf,
            post: opts.post,
        }
        args.opts = o
        const cv = (v: any) => {
            if (this.file_) {
                this.write_ = buf
            }
            return v
        }
        const ce = (e: any) => {
            if (this.file_) {
                this.write_ = buf
            }
            return new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
        return callReturn(deps.write, args as any, cv, ce)
    }
    /**
     * Write the data at the specified offset
     * @throws PathError
     * @returns the actual length of bytes write
     */
    writeAtSync(opts: WriteAtSyncOptions): number {
        const op = 'writeAtSync'
        const f = this._file(op)
        try {
            return deps.writeAt({
                fd: f.fd,
                src: opts.src,
                offset: opts.offset,
            })
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    private writeAt_?: deps.WriteAtArgs
    /**
     * Similar to writeAtSync but called asynchronously, notifying the result in cb
     */
    writeAt(a: any, b: any) {
        const op = 'writeAt'
        const f = this._file(op)
        const args = parseArgs<WriteAtOptions, (n?: number, e?: any) => void>(op, a, b)
        const opts = args.opts!
        let buf = this.writeAt_
        if (buf) {
            this.writeAt_ = undefined
        } else {
            try {
                buf = deps.writeAt_args()
            } catch (e) {
                throw new PathError({
                    op: op,
                    path: this.name_,
                    err: e,
                })
            }
        }
        const o: deps.WriteAtOptions = {
            fd: f.fd,
            src: opts.src,
            offset: opts.offset,
            args: buf,
            post: opts.post,
        }
        args.opts = o
        const cv = (v: any) => {
            if (this.file_) {
                this.writeAt_ = buf
            }
            return v
        }
        const ce = (e: any) => {
            if (this.file_) {
                this.writeAt_ = buf
            }
            return new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
        return callReturn(deps.writeAt, args as any, cv, ce)
    }

    /**
     * Commits the current contents of the file to stable storage.
     * Typically, this means flushing the file system's in-memory copyof recently written data to disk.
     * @throws PathError
     */
    syncSync(): void {
        const op = 'syncSync'
        const f = this._file(op)
        try {
            deps.fsync({
                fd: f.fd,
            })
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    /**
     * Similar to syncSync but called asynchronously, notifying the result in cb
     */
    sync(a: any, b: any) {
        const op = 'sync'
        const f = this._file(op)
        const args = parseOptionalArgs<AsyncOptions, (e?: any) => void>(op, a, b);
        const opts = args.opts
        const o: deps.FSyncOptions = {
            fd: f.fd,
            post: opts?.post,
        }
        args.opts = o
        const ce = (e: any) => new PathError({
            op: op,
            path: this.name_,
            err: e,
        })
        return callVoid(deps.fsync, args as any, ce)
    }
    /**
     * changes the current working directory to the file, which must be a directory.
     * @throws PathError
     */
    chdir(): void {
        const op = 'chdir'
        const f = this._file(op)
        try {
            return deps.fchdir(f.fd)
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    /**
     * changes the mode of the file to mode
     * @throws PathError
     */
    chmodSync(perm: number): void {
        const op = 'chmodSync'
        const f = this._file(op)
        const o: deps.FChmodOptions = {
            fd: f.fd,
            perm: perm,
        }
        try {
            return deps.fchmod(o)
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    /**
     * Similar to chmodSync but called asynchronously, notifying the result in cb
     */
    chmod(a: any, b: any) {
        const op = 'chmod'
        const f = this._file(op)
        const args = parseArgs<FileChmodAsyncOptions, (e?: any) => void>(op, a, b);
        const opts = args.opts!
        const o: deps.FChmodOptions = {
            fd: f.fd,
            perm: opts.perm,
            post: opts.post,
        }
        args.opts = o
        const ce = (e: any) => new PathError({
            op: op,
            path: this.name_,
            err: e,
        })
        return callVoid(deps.fchmod, args as any, ce)
    }
    /**
     * changes the uid and gid of the file
     * @throws PathError
     */
    chownSync(opts: FileChownSyncOptions): void {
        const op = 'chownSync'
        const f = this._file(op)
        const o: deps.FChownOptions = {
            fd: f.fd,
            uid: opts.uid,
            gid: opts.gid,
        }
        try {
            return deps.fchown(o)
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    /**
     * Similar to chownSync but called asynchronously, notifying the result in cb
     */
    chown(a: any, b: any) {
        const op = 'chown'
        const f = this._file(op)
        const args = parseArgs<FileChownOptions, (e?: any) => void>(op, a, b);
        const opts = args.opts!
        const o: deps.FChownOptions = {
            fd: f.fd,
            uid: opts.uid,
            gid: opts.gid,
            post: opts.post,
        }
        args.opts = o
        const ce = (e: any) => new PathError({
            op: op,
            path: this.name_,
            err: e,
        })
        return callVoid(deps.fchown, args as any, ce)
    }
    /**
     * changes the size of the file. It does not change the I/O offset.
     * @throws PathError
     */
    truncateSync(size: number): void {
        const op = 'truncateSync'
        const f = this._file(op)
        const o: deps.FTruncateOptions = {
            fd: f.fd,
            size: size,
        }
        try {
            return deps.ftruncate(o)
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    /**
     * Similar to truncateSync but called asynchronously, notifying the result in cb
     */
    truncate(a: any, b: any) {
        const op = 'truncate'
        const f = this._file(op)
        const args = parseArgs<FileTruncateOptions | number, (e?: any) => void>(op, a, b);
        const opts = args.opts!
        const o: deps.FTruncateOptions = typeof opts === "number" ? {
            fd: f.fd,
            size: opts,
        } : {
            fd: f.fd,
            size: opts.size,
            post: opts.post,
        }
        args.opts = o
        const ce = (e: any) => new PathError({
            op: op,
            path: this.name_,
            err: e,
        })
        return callVoid(deps.ftruncate, args as any, ce)
    }

    /**
     * Read the file name in the folder
     * @throws PathError
     * @param n If greater than 0, the maximum length of the returned array is n
     */
    readDirNamesSync(n?: number): Array<string> {
        const op = 'readDirNamesSync'
        const f = this._file(op)
        try {
            return deps.fread_dir_names({
                fd: f.fd,
                n: n,
            })
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    /**
     * Similar to readDirNamesSync but called asynchronously, notifying the result in cb
     */
    readDirNames(a: any, b: any) {
        const op = 'readDirNames'
        const f = this._file(op)
        const args = parseOptionalArgs<number | FileReadDirOptions, (dirs?: Array<string>, e?: any) => void>(op, a, b)
        const opts = args.opts
        const o: deps.FReadDirOptions = typeof opts === "number" ? {
            fd: f.fd,
            n: opts,
        } : (
            opts === undefined || opts === null ? {
                fd: f.fd,
            } : {
                fd: f.fd,
                n: opts.n,
                post: opts.post,
            }
        )
        args.opts = o
        const ce = (e: any) => new PathError({
            op: op,
            path: this.name_,
            err: e,
        })
        return callReturn(deps.fread_dir_names, args as any, undefined, ce)
    }

    /**
     * Read the file info in the folder
     * @throws PathError
     * @param n If greater than 0, the maximum length of the returned array is n
     */
    readDirSync(n?: number): Array<FileInfo> {
        const op = 'readDirSync'
        const f = this._file(op)
        try {
            const items = deps.fread_dir({
                fd: f.fd,
                n: n,
            })
            return items.length ? items.map((info) => new fileInfo(info)) : items as any
        } catch (e) {
            throw new PathError({
                op: op,
                path: this.name_,
                err: e,
            })
        }
    }
    /**
     * Similar to readDirSync but called asynchronously, notifying the result in cb
     */
    readDir(a: any, b: any) {
        const op = 'readDir'
        const f = this._file(op)
        const args = parseOptionalArgs<number | FileReadDirOptions, (dirs?: Array<FileInfo>, e?: any) => void>(op, a, b)
        const opts = args.opts
        const o: deps.FReadDirOptions = typeof opts === "number" ? {
            fd: f.fd,
            n: opts,
        } : (
            opts === undefined || opts === null ? {
                fd: f.fd,
            } : {
                fd: f.fd,
                n: opts.n,
                post: opts.post,
            }
        )
        args.opts = o
        const ce = (e: any) => new PathError({
            op: op,
            path: this.name_,
            err: e,
        })
        return callReturn(deps.fread_dir, args as any, fileInfo.mapArray, ce)
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
export interface StatOptions extends AsyncOptions {
    name: string
}
export function statSync(name: string): FileInfo {
    try {
        const info = deps.stat({
            name: name
        })
        return new fileInfo(info)
    } catch (e) {
        throw new PathError({
            op: 'statSync',
            path: name,
            err: e,
        })
    }
}
export function stat(a: any, b: any) {
    const args = parseArgs<string | StatOptions, (info?: FileInfo, e?: any) => void>('stat', a, b)
    const opts = args.opts!
    const o: deps.StatOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'stat',
        path: o.name,
        err: e,
    })
    return callReturn(deps.stat, args as any, fileInfo.map, ce)
}

/**
 * changes the current working directory to the named directory
 * @throws PathError
 */
export function chdir(path: string): void {
    try {
        return deps.chdir(path)
    } catch (e) {
        throw new PathError({
            op: 'chdir',
            path: path,
            err: e,
        })
    }
}
export interface ChmodSyncOptions {
    name: string
    perm: number
}
export interface ChmodOptions extends ChmodSyncOptions, AsyncOptions { }
/**
 * changes the mode of the file to mode
 * @throws PathError
 */
export function chmodSync(opts: ChmodSyncOptions): void {
    const o: deps.ChmodOptions = {
        name: opts.name,
        perm: opts.perm,
    }
    try {
        return deps.chmod(o)
    } catch (e) {
        throw new PathError({
            op: 'chmodSync',
            path: o.name,
            err: e,
        })
    }
}
/**
 * Similar to chmodSync but called asynchronously, notifying the result in cb
 */
export function chmod(a: any, b: any) {
    const args = parseArgs<ChmodOptions, (e?: any) => void>('chmod', a, b)
    const opts = args.opts!
    const o: deps.ChmodOptions = {
        name: opts.name,
        perm: opts.perm,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'chmod',
        path: o.name,
        err: e,
    })
    return callVoid(deps.chmod, args as any, ce)
}

export interface ChownSyncOptions {
    name: string
    uid: number
    gid: number
}
export interface ChownOptions extends ChownSyncOptions, AsyncOptions { }
/**
 * changes the uid and gid of the file
 * @throws PathError
 */
export function chownSync(opts: ChownSyncOptions): void {
    const o: deps.ChownOptions = {
        name: opts.name,
        uid: opts.uid,
        gid: opts.gid,
    }
    try {
        return deps.chown(o)
    } catch (e) {
        throw new PathError({
            op: 'chownSync',
            path: o.name,
            err: e,
        })
    }
}
/**
 * Similar to chownSync but called asynchronously, notifying the result in cb
 */
export function chown(a: any, b: any) {
    const args = parseArgs<ChownOptions, (e?: any) => void>('chown', a, b)
    const opts = args.opts!
    const o: deps.ChownOptions = {
        name: opts.name,
        uid: opts.uid,
        gid: opts.gid,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'chown',
        path: o.name,
        err: e,
    })
    return callVoid(deps.chown, args as any, ce)
}
export interface TruncateSyncOptions {
    name: string
    size: number
}
export interface TruncateOptions extends TruncateSyncOptions, AsyncOptions { }
/**
 * changes the size of the file
 * @throws PathError
 */
export function truncateSync(opts: TruncateSyncOptions): void {
    const o: deps.TruncateOptions = {
        name: opts.name,
        size: opts.size,
    }
    try {
        return deps.truncate(o)
    } catch (e) {
        throw new PathError({
            op: 'truncateSync',
            path: o.name,
            err: e,
        })
    }
}
/**
 * Similar to truncateSync but called asynchronously, notifying the result in cb
 */
export function truncate(a: any, b: any) {
    const args = parseArgs<TruncateOptions, (e?: any) => void>('truncate', a, b)
    const opts = args.opts!
    const o: deps.TruncateOptions = {
        name: opts.name,
        size: opts.size,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'truncate',
        path: o.name,
        err: e,
    })
    return callVoid(deps.truncate, args as any, ce)
}
export interface ReadFileOptions extends AsyncOptions {
    name: string
}
/**
 * Read file contents
 * @throws PathError
 */
export function readFileSync(name: string): Uint8Array {
    try {
        return deps.read_file({ name: name })
    } catch (e) {
        throw new PathError({
            op: 'readFileSync',
            path: name,
            err: e,
        })
    }
}
/**
 * abbreviation for new TextDecoder().decode(readFileSync(name))
 * @throws PathError
 */
export function readTextFileSync(name: string): string {
    try {
        return deps.read_text_file({ name: name })
    } catch (e) {
        throw new PathError({
            op: 'readTextFileSync',
            path: name,
            err: e,
        })
    }
}
export function readFile(a: any, b: any) {
    const args = parseArgs<string | ReadFileOptions, (data?: Uint8Array, e?: any) => void>('readFile', a, b)
    const opts = args.opts!
    const o: deps.ReadFileOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'readFile',
        path: o.name,
        err: e,
    })
    return callReturn(deps.read_file, args as any, undefined, ce)
}
export function readTextFile(a: any, b: any) {
    const args = parseArgs<string | ReadFileOptions, (s?: string, e?: any) => void>('readTextFile', a, b)
    const opts = args.opts!
    const o: deps.ReadFileOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'readTextFile',
        path: o.name,
        err: e,
    })
    return callReturn(deps.read_text_file, args as any, undefined, ce)
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
    const o: deps.WriteFileOptions = {
        name: opts.name,
        data: opts.data,
        perm: opts.perm,
        sync: opts.sync,
    }
    try {
        return deps.writeFile(o)
    } catch (e) {
        throw new PathError({
            op: "writeFileSync",
            path: o.name,
            err: e,
        })
    }
}
export function writeFile(a: any, b: any) {
    const args = parseArgs<WriteFileOptions, (e?: any) => void>('writeFile', a, b)
    const opts = args.opts!
    const o: deps.WriteFileOptions = {
        name: opts.name,
        data: opts.data,
        perm: opts.perm,
        sync: opts.sync,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: "writeFile",
        path: o.name,
        err: e,
    })
    return callVoid(deps.writeFile, args as any, ce)
}
export interface WriteTextFileSyncOptions {
    name: string
    data: string
    perm?: number
    sync?: boolean
}
export interface WriteTextFileOptions extends WriteTextFileSyncOptions, AsyncOptions { }
export function writeTextFileSync(opts: WriteTextFileSyncOptions): void {
    const o: deps.WriteFileOptions = {
        name: opts.name,
        data: opts.data === "" ? undefined : new TextEncoder().encode(opts.data),
        perm: opts.perm,
        sync: opts.sync,
    }
    try {
        return deps.writeFile(o)
    } catch (e) {
        throw new PathError({
            op: "writeTextFileSync",
            path: o.name,
            err: e,
        })
    }
}
export function writeTextFile(a: any, b: any) {
    const args = parseArgs<WriteTextFileOptions, (e?: any) => void>('writeTextFile', a, b)
    const opts = args.opts!
    const o: deps.WriteFileOptions = {
        name: opts.name,
        data: opts.data === "" ? undefined : new TextEncoder().encode(opts.data),
        perm: opts.perm,
        sync: opts.sync,
        post: opts.post,
    }
    args.opts = o as any
    const ce = (e: any) => new PathError({
        op: "writeTextFile",
        path: o.name,
        err: e,
    })
    return callVoid(deps.writeFile, args as any, ce)
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
 * @throws PathError
 */
export function readDirNamesSync(opts: ReadDirSyncOptions | string): Array<string> {
    const o: deps.ReadDirOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        n: opts.n,
    }
    try {
        return deps.read_dir_names(o)
    } catch (e) {
        throw new PathError({
            op: 'readDirNamesSync',
            path: o.name,
            err: e,
        })
    }
}
/**
 * Similar to readDirNamesSync but called asynchronously, notifying the result in cb
 */
export function readDirNames(a: any, b: any) {
    const args = parseArgs<ReadDirOptions | string, (dirs?: Array<string>, e?: any) => void>('readDirNames', a, b)
    const opts = args.opts!
    const o: deps.ReadDirOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        n: opts.n,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'readDirNames',
        path: o.name,
        err: e,
    })
    return callReturn(deps.read_dir_names, args as any, undefined, ce)
}

/**
 * Read the file info in the folder
 * @throws PathError
 */
export function readDirSync(opts: ReadDirSyncOptions | string): Array<FileInfo> {
    const o: deps.ReadDirOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        n: opts.n,
    }
    try {
        const items = deps.read_dir(o)
        return items.length ? items.map((v) => new fileInfo(v)) : items as any
    } catch (e) {
        throw new PathError({
            op: 'readDirSync',
            path: o.name,
            err: e,
        })
    }
}

/**
 * Similar to readDirSync but called asynchronously, notifying the result in cb
 */
export function readDir(a: any, b: any) {
    const args = parseArgs<ReadDirOptions | string, (dirs?: Array<FileInfo>, e?: any) => void>('readDir', a, b)
    const opts = args.opts!
    const o: deps.ReadDirOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        n: opts.n,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'readDir',
        path: o.name,
        err: e,
    })
    return callReturn(deps.read_dir, args as any, fileInfo.mapArray, ce)
}

export interface ReadLinkOptions extends AsyncOptions {
    name: string
}
/**
 * returns the destination of the named symbolic link
 * @throws PathError
 */
export function readLinkSync(name: string): string {
    try {
        return deps.read_link({
            name: name,
        })
    } catch (e) {
        throw new PathError({
            op: 'readLinkSync',
            path: name,
            err: e,
        })
    }
}

/**
 * Similar to readLinkSync but called asynchronously, notifying the result in cb
 */
export function readLink(a: any, b: any) {
    const args = parseArgs<string | ReadLinkOptions, (path?: string, e?: any) => void>('readLink', a, b)
    const opts = args.opts!
    const o: deps.ReadLinkOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'readLink',
        path: o.name,
        err: e,
    })
    return callReturn(deps.read_link, args as any, ce)
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
    const o: deps.RenameOptions = {
        from: opts.from,
        to: opts.to,
    }
    try {
        return deps.rename(o)
    } catch (e) {
        throw new LinkError({
            op: 'renameSync',
            from: o.from,
            to: o.to,
            err: e,
        })
    }
}
/**
 *  Similar to renameSync but called asynchronously, notifying the result in cb
 */
export function rename(a: any, b: any) {
    const args = parseArgs<RenameOptions, (e?: any) => void>('rename', a, b)
    const opts = args.opts!
    const o: deps.RenameOptions = {
        from: opts.from,
        to: opts.to,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new LinkError({
        op: 'rename',
        from: o.from,
        to: o.to,
        err: e,
    })
    return callVoid(deps.rename, args as any, ce)
}

export interface RemoveSyncOptions {
    name: string
    all?: boolean
}
export interface RemoveOptions extends RemoveSyncOptions, AsyncOptions { }

/**
 * removes the named file or directory
 * @throws PathError
 */
export function removeSync(opts: RemoveSyncOptions | string): void {
    const o: deps.RemoveOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        all: opts.all,
    }
    try {
        return deps.remove(o)
    } catch (e) {
        throw new PathError({
            op: o.all ? 'removeAllSync' : 'removeSync',
            path: o.name,
            err: e,
        })
    }
}
export function remove(a: any, b: any) {
    const args = parseArgs<RemoveOptions | string, (e?: any) => void>('remove', a, b)
    const opts = args.opts!
    const o: deps.RemoveOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        all: opts.all,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: o.all ? 'removeAll' : 'remove',
        path: o.name,
        err: e,
    })
    return callVoid(deps.remove, args as any, ce)
}
export interface LinkSyncOptions {
    from: string
    to: string
    hard?: boolean
}
export interface LinkOptions extends LinkSyncOptions, AsyncOptions { }

/**
 * creates opts.to as a link to the opts.from file.
 * @throws LinkError
 */
export function linkSync(opts: LinkSyncOptions) {
    const o: deps.LinkOptions = {
        from: opts.from,
        to: opts.to,
        hard: opts.hard,
    }
    try {
        return deps.link(o)
    } catch (e) {
        throw new LinkError({
            op: o.hard ? 'linkSync' : 'symlinkSync',
            from: o.from,
            to: o.to,
            err: e,
        })
    }
}

/**
 *  Similar to linkSync but called asynchronously, notifying the result in cb
 */
export function link(a: any, b: any) {
    const args = parseArgs<LinkOptions, (e?: any) => void>('link', a, b)
    const opts = args.opts!
    const o: deps.LinkOptions = {
        from: opts.from,
        to: opts.to,
        hard: opts.hard,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new LinkError({
        op: o.hard ? 'link' : 'symlink',
        from: o.from,
        to: o.to,
        err: e,
    })
    return callVoid(deps.link, args as any, ce)
}

/**
 * removes the named empty directory
 * @throws PathError
 */
export function rmdirSync(opts: string | RemoveSyncOptions): void {
    const o: deps.RemoveOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        all: opts.all,
    }
    try {
        return deps.rmdir(o)
    } catch (e) {
        throw new PathError({
            op: o.all ? 'rmdirAllSync' : 'rmdirSync',
            path: o.name,
            err: e,
        })
    }
}
/**
 *  Similar to rmdirSync but called asynchronously, notifying the result in cb
 */
export function rmdir(a: any, b: any) {
    const args = parseArgs<string | RemoveOptions, (e?: any) => void>('rmdir', a, b)
    const opts = args.opts!
    const o: deps.RemoveOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        all: opts.all,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: o.all ? 'rmdirAll' : 'rmdir',
        path: o.name,
        err: e,
    })
    return callVoid(deps.rmdir, args as any, ce)
}
export interface MkdirSyncOptions {
    name: string
    /**
     * @default 0o775
     */
    perm?: number
    /**
     * @default false
     */
    all?: boolean
}
export interface MkdirOptions extends MkdirSyncOptions, AsyncOptions { }
/**
 * creates a directory named opts.name
 * @throws PathError
 */
export function mkdirSync(opts: MkdirSyncOptions | string): void {
    const o: deps.MkdirOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        perm: opts.perm,
        all: opts.all,
    }
    try {
        return deps.mkdir(o)
    } catch (e) {
        throw new PathError({
            op: o.all ? 'mkdirAllSync' : 'mkdirSync',
            path: o.name,
            err: e,
        })
    }
}
/**
 *  Similar to mkdirSync but called asynchronously, notifying the result in cb
 */
export function mkdir(a: any, b: any) {
    const args = parseArgs<MkdirOptions | string, (e?: any) => void>('mkdir', a, b)
    const opts = args.opts!
    const o: deps.MkdirOptions = typeof opts === "string" ? {
        name: opts,
    } : {
        name: opts.name,
        perm: opts.perm,
        post: opts.post,
        all: opts.all,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: o.all ? 'mkdirAll' : 'mkdir',
        path: o.name,
        err: e,
    })
    return callVoid(deps.mkdir, args as any, ce)
}

export interface MkdirTempSyncOptions {
    pattern: string
    /**
     * @default tempDir()
     */
    dir?: string

    /**
     * @default 0o700
     */
    perm?: number
}
export interface MkdirTempOptions extends MkdirTempSyncOptions, AsyncOptions { }

/**
 * creates a new temporary directory
 * @throws PathError
 */
export function mkdirTempSync(opts: string | MkdirTempSyncOptions): string {
    const o: deps.MkdirTempOptions = typeof opts === "string" ? {
        pattern: opts,
    } : {
        pattern: opts.pattern,
        dir: opts.dir,
        perm: opts.perm,
    }
    try {
        return deps.mkdirTemp(o)
    } catch (e) {
        throw new PathError({
            op: "mkdirTempSync",
            path: o.pattern,
            err: e,
        })
    }
}
export function mkdirTemp(a: any, b: any) {
    const args = parseArgs<string | MkdirTempOptions, (dir?: string, e?: any) => void>('mkdirTemp', a, b)
    const opts = args.opts!
    const o: deps.MkdirTempOptions = typeof opts === "string" ? {
        pattern: opts,
    } : {
        pattern: opts.pattern,
        dir: opts.dir,
        perm: opts.perm,
        post: opts.post,
    }
    args.opts = o
    const ce = (e: any) => new PathError({
        op: 'mkdirTemp',
        path: o.pattern,
        err: e,
    })
    return callReturn(deps.mkdirTemp, args as any, undefined, ce)
}