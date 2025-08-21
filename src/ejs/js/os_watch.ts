declare namespace deps {
    interface WatchSyncOptions {
        name: string
        mask: number
    }
    function watch_sync(name: string, mask: number, cb: (evt: any) => boolean): void
    class Pointer {
        readonly __id = "pointer"
    }
    class Watcher {
        readonly __id = "Watcher"
        p: Pointer
    }
    function watch(name: string, mask: number, cb: (evt: any) => number): Watcher
    function watch_close(w: Watcher): void
}

export interface WatchEvent {
    name: string
    mask: number
}
export function watchSync(name: string, mask: number, cb: (evt: WatchEvent) => boolean | any): void {
    if (typeof cb !== "function") {
        throw new Error("cb must be a function")
    }
    deps.watch_sync(name, mask, (evt) => {
        return cb(evt) ? true : false
    })
}

export class Watcher {
    constructor(readonly close: () => void) { }

}
export function watch(name: string, mask: number, cb: (evt: WatchEvent) => boolean | any): Watcher {
    if (typeof cb !== "function") {
        throw new Error("cb must be a function")
    }
    let w: undefined | deps.Watcher
    const close = () => {
        if (w) {
            const c = w
            w = undefined
            deps.watch_close(c)
        }
    }
    w = deps.watch(name, mask, (evt) => {
        const ok = cb(evt)
        if (w) {
            return ok ? 1 : 0
        }
        return -1;
    })
    try {
        return new Watcher(close)
    } catch (e) {
        const c = w
        w = undefined
        deps.watch_close(c)
        throw e
    }
}