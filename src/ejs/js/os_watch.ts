declare namespace deps {
    interface WatchSyncOptions {
        name: string
        mask: number
    }
    interface WatchEvent {
        name: string
        mask: number
    }
    function watch_sync(opts: WatchSyncOptions, cb: (evt: any) => boolean): void
}

export interface WatchEvent {
    name: string
    mask: number
}
export function watchSync(name: string, mask: number, cb: (evt: WatchEvent) => boolean | any): void {
    if (typeof cb !== "function") {
        throw new Error("cb must be a function")
    }
    const opts: deps.WatchSyncOptions = {
        name: name,
        mask: mask,
    }
    deps.watch_sync(opts, (evt) => {
        return cb(evt) ? true : false
    })
}
