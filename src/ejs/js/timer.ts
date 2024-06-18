declare namespace deps {
    class Immediatepointer {
        readonly __id = "Immediatepointer"
    }
    class Immediate {
        readonly __id = "Immediate"
        p: Immediatepointer
    }
    function create(cb: () => void): deps.Immediate
    function signal(s: deps.Immediatepointer): void

    class Timeout {
        readonly __id = "Timeout"
    }
    interface TimeoutOption {
        cb: () => void
        ms: number
        interval?: boolean
    }
    function timeout(opts: TimeoutOption): Timeout
    function clear(timeout: Timeout): void
}
type Callback = (...args: Array<any>) => void

class Immediate {
    cb: Callback | undefined
    constructor(cb?: Callback, notbind?: boolean) {
        if (cb) {
            if (notbind) {
                this.cb = cb
            } else {
                this.cb = cb.bind(this)
            }
        }
    }
    _args?: Array<any>
    _next?: Immediate
    _prev?: Immediate
    _list?: ListImmediate
    _state = 0
    next(): Immediate | undefined {
        if (this._list) {
            const p = this._next
            if (p != this._list.root) {
                return p
            }
        }
    }
}
class ListImmediate {
    root: Immediate
    len = 0
    constructor() {
        const root = new Immediate()
        root._next = root
        root._prev = root
        this.root = root
    }
    pushBack(ele: Immediate) {
        this._insert(ele, this.root._prev!)
    }
    _insert(e: Immediate, at: Immediate): void {
        e._prev = at
        e._next = at._next
        e._prev._next = e
        e._next!._prev = e
        e._list = this
        this.len++
    }
    front(): Immediate | undefined {
        if (this.len) {
            return this.root._next
        }
    }
    remove(e: Immediate) {
        if (e._list == this) {
            e._prev!._next = e._next
            e._next!._prev = e._prev
            e._next = undefined // avoid memory leaks
            e._prev = undefined // avoid memory leaks
            e._list = undefined
            this.len--
        }
    }
}
class SchedulerImmediate {
    currents_ = new ListImmediate()
    nexts_ = new ListImmediate()
    exec_ = false
    immediate_?: deps.Immediate
    private _cb() {
        const list = this.currents_
        let ele = list.front()
        let next: Immediate | undefined
        let cb: undefined | Callback
        let called = false
        let args: Array<any> | undefined
        while (true) {
            while (ele) {
                cb = ele.cb
                args = ele._args
                next = ele.next()
                list.remove(ele)

                if (cb) {
                    called = true
                    if (args && args.length) {
                        cb(...args)
                    } else {
                        cb()
                    }
                }
                ele = next
            }

            ele = this.nexts_.front()
            if (ele) {
                this.currents_ = this.nexts_
                this.nexts_ = list

                if (called) {
                    deps.signal(this.immediate_!.p)
                    break
                }
            } else {
                this.exec_ = false
                break
            }
        }
    }
    push(ele: Immediate): void {
        if (this.exec_) {
            this.nexts_.pushBack(ele)
        } else {
            let m = this.immediate_
            if (!m) {
                m = deps.create(() => this._cb())
                this.immediate_ = m
            }
            deps.signal(m.p)
            this.exec_ = true
            this.currents_.pushBack(ele)
        }
    }
}
const schedulerImmediate = new SchedulerImmediate()
class Timeout {
    private immediate_?: Immediate
    private timeout_?: deps.Timeout
    constructor(cb: Callback, ms: any, args: Array<any>, interval?: boolean) {
        let wait = 0
        if (ms !== null && ms !== undefined) {
            const t = typeof ms
            if (t === "string") {
                ms = parseInt(ms)
                if (Number.isFinite(ms) && ms > 0) {
                    wait = ms
                }
            } else if (t === "number") {
                if (Number.isFinite(ms) && ms > 0) {
                    wait = ms
                }
            }
        }
        cb = cb.bind(this)
        if (wait) {
            if (interval) {
                this.timeout_ = deps.timeout({
                    ms: wait,
                    interval: true,
                    cb: () => {
                        if (args.length) {
                            cb(...args)
                        } else {
                            cb()
                        }
                    },
                })
            } else {
                this.timeout_ = deps.timeout({
                    ms: wait,
                    cb: () => {
                        const t = this.timeout_
                        if (t) {
                            this.timeout_ = undefined
                            deps.clear(t)
                        }

                        if (args.length) {
                            cb(...args)
                        } else {
                            cb()
                        }
                    },
                })
            }
        } else {
            if (interval) {
                const m = new Immediate(() => {
                    if (args.length) {
                        cb(...args)
                    } else {
                        cb()
                    }
                    const m = this.immediate_
                    if (m) {
                        const l = schedulerImmediate.nexts_
                        l.pushBack(m)
                    }
                }, true)
                schedulerImmediate.push(m)
                this.immediate_ = m
            } else {
                const m = new Immediate(cb, true)
                if (args.length) {
                    m._args = args
                }
                schedulerImmediate.push(m)
                this.immediate_ = m
            }
        }
    }
    clear() {
        const m = this.immediate_
        if (m) {
            this.immediate_ = undefined
            if (m._list) {
                m._list.remove(m)
            }
        }
        const t = this.timeout_
        if (t) {
            this.timeout_ = undefined
            deps.clear(t)
        }
    }
}
export function setImmediate(cb: Callback, ...args: Array<any>): Immediate {
    if (typeof cb !== "function") {
        throw new Error("setImmediate cb must be a function")
    }
    const ele = new Immediate(cb)
    if (args.length) {
        ele._args = args
    }
    schedulerImmediate.push(ele)
    return ele
}
export function clearImmediate(immediate: Immediate | Timeout) {
    if (immediate instanceof Immediate) {
        if (immediate._list) {
            immediate._list.remove(immediate)
        }
    } else if (immediate instanceof Timeout) {
        immediate.clear()
    }
}
export function setTimeout(cb: Callback, ms: number | undefined, ...args: Array<any>) {
    if (typeof cb !== "function") {
        throw new Error("setTimeout cb must be a function")
    }
    return new Timeout(cb, ms, args)
}
export function clearTimeout(timer: Timeout | Immediate) {
    if (timer instanceof Timeout) {
        timer.clear()
    } else if (timer instanceof Immediate) {
        if (timer._list) {
            timer._list.remove(timer)
        }
    }
}
export function setInterval(cb: Callback, ms: number | undefined, ...args: Array<any>) {
    if (typeof cb !== "function") {
        throw new Error("setInterval cb must be a function")
    }
    return new Timeout(cb, ms, args, true)
}
export function clearInterval(timer: Timeout | Immediate) {
    if (timer instanceof Timeout) {
        timer.clear()
    } else if (timer instanceof Immediate) {
        if (timer._list) {
            timer._list.remove(timer)
        }
    }
}
