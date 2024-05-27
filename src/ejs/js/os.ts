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

    export class File {
        readonly __id = "File"
        name: string
    }
    export interface OpenOptions {
        name: string
        flag?: number
        perm?: number
        post?: boolean
    }
    export function open(opts: OpenOptions): File
    export function open(opts: OpenOptions, cb: (f?: File, e?: any) => void): void

    export interface FileStatOptions {
        file: deps.File
        post?: boolean
    }
    export function fstat(opts: FileStatOptions): FileInfo
    export function fstat(opts: FileStatOptions, cb: (info?: FileInfo, e?: any) => void): FileInfo

    export interface StatOptions {
        name: string
        post?: boolean
    }
    export function stat(opts: StatOptions): FileInfo
    export function stat(opts: StatOptions, cb: (info?: FileInfo, e?: any) => void): FileInfo
}

export type Error = __duk.OsError
export const Error = __duk.OsError
const osError = __duk.OsError
export interface AsyncOptions {
    post?: boolean
}
export interface OpenFileOptions {
    name: string
    flag?: number
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
export function stat(name: string, cb: (info?: FileInfo, e?: any) => void, opts?: AsyncOptions) {
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
export class File {
    private constructor(readonly file_: deps.File | undefined) { }
    /**
     * Open files in customized mode
     */
    static openFileSync(opts: OpenFileOptions): File {
        return new File(deps.open({
            name: opts.name,
            flag: opts.flag ?? deps.O_RDONLY,
            perm: opts.perm ?? 0,
        }))
    }
    /**
     * Similar to openFileSync but called asynchronously, notifying the result in cb
     */
    static openFile(opts: OpenFileAsyncOptions, cb: (f?: File, e?: any) => void): void {
        if (typeof cb !== "function") {
            throw new TypeError("cb must be a function")
        }
        deps.open({
            name: opts.name,
            flag: opts.flag ?? deps.O_RDONLY,
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
            flag: deps.O_RDONLY,
            perm: 0,
        }))
    }
    /**
     * Similar to openSync but called asynchronously, notifying the result in cb
     */
    static open(name: string, cb: (f?: File, e?: any) => void): void {
        File.openFile({
            name: name,
            flag: deps.O_RDONLY,
            perm: 0,
        }, cb)
    }
    /**
     * Create a new profile
     */
    static createSync(name: string): File {
        return new File(deps.open({
            name: name,
            flag: deps.O_RDWR | deps.O_CREATE | deps.O_TRUNC,
            perm: 0o666,
        }))
    }
    /**
     * Similar to createSync but called asynchronously, notifying the result in cb
     */
    static create(name: string, cb: (f?: File, e?: any) => void): void {
        File.openFile({
            name: name,
            flag: deps.O_RDWR | deps.O_CREATE | deps.O_TRUNC,
            perm: 0o666,
        }, cb)
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
    stat(cb: (info?: FileInfo, e?: any) => void, opts?: AsyncOptions) {
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
     * 
     * @param data 
     */
    // writeSync(data: string | Uint8Array): number
}
