declare namespace __duk {
    class Error {
        constructor(message?: string)
    }
    class OsError extends Error { }
    namespace Os {
        const ETIMEDOUT: number
    }
}
declare namespace deps {
    // Exactly one of O_RDONLY, O_WRONLY, or O_RDWR must be specified.
    const O_RDONLY: number    // open the file read-only.
    const O_WRONLY: number    // open the file write-only.
    const O_RDWR: number        // open the file read-write.
    // The remaining values may be or'ed in to control behavior.
    const O_APPEND: number  // append data to the file when writing.
    const O_CREATE: number  // create a new file if none exists.
    const O_EXCL: number    // used with O_CREATE, file must not exist.
    const O_SYNC: number     // open for synchronous I/O.
    const O_TRUNC: number    // truncate regular writable file when opened.
    export class File {
        readonly __id = "File"
    }
    export interface OpenOptions {
        name: string
        flag?: number
        perm?: number
    }
    export function open(opts: OpenOptions): File
    export function open(opts: OpenOptions, cb: (f?: File, e?: any) => void): void
}

export type Error = __duk.OsError
export const Error = __duk.OsError
export type FileFD = deps.File
declare const exports: any
Object.defineProperty(exports, 'O_RDONLY', {
    value: deps.O_RDONLY, writable: false
});
Object.defineProperty(exports, 'O_WRONLY', {
    value: deps.O_WRONLY, writable: false
});
Object.defineProperty(exports, 'O_RDWR', {
    value: deps.O_RDWR, writable: false
});
Object.defineProperty(exports, 'O_APPEND', {
    value: deps.O_APPEND, writable: false
});
Object.defineProperty(exports, 'O_CREATE', {
    value: deps.O_CREATE, writable: false
});
Object.defineProperty(exports, 'O_EXCL', {
    value: deps.O_EXCL, writable: false
});
Object.defineProperty(exports, 'O_TRUNC', {
    value: deps.O_TRUNC, writable: false
});

export interface OpenOptions {
    name: string
    flag?: number
    perm?: number
}
export class File {
    static attach(fd: FileFD): File {
        return new File(fd)
    }
    private constructor(readonly fd: FileFD | undefined) {
    }
}
export function openSync(opts: OpenOptions): File {
    return File.attach(deps.open({
        name: opts.name,
        flag: opts.flag ?? deps.O_RDONLY,
        perm: opts.perm ?? 0,
    }))
}
export function open(opts: OpenOptions, cb: (f?: File, e?: any) => void): void {
    if (typeof cb !== "function") {
        throw new TypeError("cb must be a function")
    }
    deps.open({
        name: opts.name,
        flag: opts.flag ?? deps.O_RDONLY,
        perm: opts.perm ?? 0,
    }, (f, e) => {
        if (f) {
            let file: File
            try {
                file = File.attach(f!)
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
export function createSync(name: string): File {
    return File.attach(deps.open({
        name: name,
        flag: deps.O_RDWR | deps.O_CREATE | deps.O_TRUNC,
        perm: 0o666,
    }))
}
export function create(name: string, cb: (f?: File, e?: any) => void): void {
    if (typeof cb !== "function") {
        throw new TypeError("cb must be a function")
    }
    deps.open({
        name: name,
        flag: deps.O_RDWR | deps.O_CREATE | deps.O_TRUNC,
        perm: 0o666,
    }, (f, e) => {
        if (f) {
            let file: File
            try {
                file = File.attach(f!)
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