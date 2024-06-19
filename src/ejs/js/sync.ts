declare namespace Duktape {
    export class Thread {
        constructor(yielder: (v?: any) => void);
        static resume<T>(t: Thread, v?: any): T
        static yield<T>(v?: any): T
    }
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
interface yieldValue<T> {
    v?: any
    e?: any
    err?: boolean
}
class resumeContext<T> implements ResumeContext<T> {
    constructor(private next_: (v: yieldValue<T>) => void) {
    }
    private resume_ = false
    value(v: T): void {
        if (this.resume_) {
            throw new Error("Coroutine already resume");
        }
        this.resume_ = true
        this.next_({
            v: v,
        })
    }
    error(e?: any): void {
        if (this.resume_) {
            throw new Error("Coroutine already resume");
        }
        this.resume_ = true
        this.next_({
            e: e,
            err: true
        })
    }
    next(resume: () => T): void {
        if (this.resume_) {
            throw new Error("Coroutine already resume");
        }
        this.resume_ = true
        let v: T
        try {
            v = resume()
        } catch (e) {
            this.next_({
                e: e,
                err: true,
            })
            return
        }
        this.next_({
            v: v,
        })
    }
}

export class Coroutine implements YieldContext {
    private t_: Duktape.Thread
    private y_?: (v: any) => any
    constructor(f: (co: YieldContext) => void) {
        this.t_ = new Duktape.Thread(() => {
            this.y_ = Duktape.Thread.yield
            f(this)
        })
    }
    onFinish?: () => void
    private state_: 'none' | 'run' | 'yield' | 'finish' = 'none'
    get state(): string {
        return this.state_
    }
    yield<T>(f: (notify: ResumeContext<T>) => void): T {
        if (this.state_ != 'run') {
            throw new Error(`yield on ${this.state_}`)
        } else if (typeof f != 'function') {
            throw new TypeError('yield expects a function')
        }
        this.state_ = 'yield'
        const v: yieldValue<T> = this.y_!(f)
        if (v.err) {
            throw v.e;
        }
        return v.v
    }
    run() {
        if (this.state_ != 'none') {
            throw new Error(`start on ${this.state_}`)
        }
        this.state_ = 'run'
        this._next()
    }
    private _next(v?: any) {
        while (true) {
            const f = Duktape.Thread.resume<(undefined | ((notify: ResumeContext<any>) => void))>(this.t_, v)
            if (!f) {
                this.state_ = 'finish'
                const cb = this.onFinish
                if (cb) {
                    cb()
                }
                return
            }
            try {
                let sync = true
                v = undefined
                f(new resumeContext((ret: any) => {
                    if (sync) {
                        if (this.state_ != 'yield') {
                            v = {
                                err: true,
                                e: new Error(`resume on ${this.state_}`),
                            }
                            return
                        }
                        this.state_ = 'run'
                        v = ret
                    } else {
                        if (this.state_ != 'yield') {
                            this._next({
                                err: true,
                                e: new Error(`resume on ${this.state_}`),
                            })
                            return
                        }
                        this.state_ = 'run'
                        this._next(ret)
                    }
                }))
                sync = false
                if (!v) {
                    break
                }
            } catch (e) {
                this.state_ = 'run'
                v = {
                    err: true,
                    e: e,
                }
            }
        }
    }
}

export function go(f: (co: YieldContext) => void): void {
    new Coroutine(f).run()
}

export function isYieldContext(co: any): co is YieldContext {
    return typeof co === "object" && typeof co.yield === "function"
}
export type CallbackVoid = (e?: any) => void
export type CallbackReturn<T> = (value?: T, e?: any) => void
export type InterfaceVoid<Options> = (opts: Options, cb: CallbackVoid) => void
export type InterfaceReturn<Options, Result> = (opts: Options, cb: CallbackReturn<Result>) => void
export type CallbackMap<Input, Output> = (v: Input) => Output

export interface Args<Options, CB> {
    co?: YieldContext
    cb?: CB
    opts?: Options
}
/**
 * Used to parse function parameters with the following signatures
 * (co: YieldContext, opts: Options) => any
 * (opts: Options) => Promise<any>
 * (opts: Options, cb: (...) => void) => Promise<any>
 * @param tag The function name to display when parsing fails
 */
export function parseArgs<Options, CB>(tag: string, a: any, b: any): Args<Options, CB> {
    if (isYieldContext(a)) {
        return {
            co: a,
            opts: b,
        }
    } else if (b === null || b === undefined) {
        return {
            opts: a,
        }
    } else if (typeof b === "function") {
        return {
            opts: a,
            cb: b,
        }
    }
    throw new TypeError(`parse function arguments fail: ${tag}`)
}
/**
 * Used to parse function parameters with the following signatures
 * (co: YieldContext, opts?: Options) => any
 * (opts?: Options) => Promise<any>
 * (opts: Options, cb: (...) => void) => Promise<any>
 * (cb: (...) => void) => Promise<any>
 * @param tag The function name to display when parsing fails
 */
export function parseOptionalArgs<Options, CB>(tag: string, a: any, b: any): Args<Options, CB> {
    if (isYieldContext(a)) {
        return {
            co: a,
            opts: b,
        }
    } else if (b === null || b === undefined) {
        if (a === null || a == undefined) {
            return {}
        } else if (typeof a === "function") {
            return {
                cb: a,
            }
        }
    } else if (typeof a === "function") {
        return {
            cb: a,
        }
    } else if (typeof b === "function") {
        return {
            opts: a,
            cb: b,
        }
    }
    throw new TypeError(`parse function arguments fail: ${tag}`)
}

/**
 * Using a coroutine to call an asynchronous interface with no return value
 * @param co Coroutine context
 * @param f Asynchronous interface to be called
 * @param opts Interface parameters
 * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
 */
export function coVoid<Options>(co: YieldContext,
    f: InterfaceVoid<Options>, opts: Options,
    ce?: CallbackMap<any, any>,
): void {
    return co.yield<void>((notify) => {
        f(opts, (e) => {
            if (e === undefined) {
                notify.value()
            } else {
                if (ce) {
                    e = ce(e)
                }
                notify.error(e)
            }
        })
    })
}
/**
 * Calling asynchronous interface
 * 
 * @param cb Callback notification
 * @param f Asynchronous interface to be called
 * @param opts Interface parameters
 * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
 */
export function cbVoid<Options>(cb: CallbackVoid,
    f: InterfaceVoid<Options>, opts: Options,
    ce?: CallbackMap<any, any>,
): void {
    if (ce) {
        f(opts, (e) => {
            if (e === undefined) {
                cb()
            } else {
                cb(ce(e))
            }
        })
    } else {
        f(opts, cb)
    }
}
/**
 * Convert asynchronous functions to Promise calling mode.  
 * Abbreviation for: new Promise((resolve,reject)=> cbVoid(...))
 * 
 * @param f Asynchronous interface to be called
 * @param opts Interface parameters
 * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
 */
export function asyncVoid<Options>(f: InterfaceVoid<Options>, opts: Options,
    ce?: CallbackMap<any, any>,
): Promise<void> {
    return new Promise((resolve, reject) => {
        f(opts, (e) => {
            if (e === undefined) {
                resolve()
            } else {
                if (ce) {
                    e = ce(e)
                }
                reject(e)
            }
        })
    })
}
/**
 * Automatically adapt the asynchronous function to call based on Args
 */
export function callVoid<Options>(
    f: InterfaceVoid<Options>,
    args: Args<Options, CallbackVoid>,
    ce?: CallbackMap<any, any>,
): void | Promise<void> {
    if (args.co) {
        return coVoid(args.co, f, args.opts!, ce)
    } else if (args.cb) {
        cbVoid(args.cb, f, args.opts!, ce)
    } else {
        return asyncVoid(f, args.opts!, ce)
    }
}

/**
 * Use coroutines to call asynchronous interfaces with return values
 * @param co Coroutine context
 * @param f Asynchronous interface to be called
 * @param opts Interface parameters
 * @param cv When the asynchronous function succeeds, this function is called to wrap the return value
 * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
 */
export function coReturn<Options, Result>(co: YieldContext,
    f: InterfaceReturn<Options, any>, opts: Options,
    cv?: CallbackMap<any, Result>, ce?: CallbackMap<any, any>,
): Result {
    return co.yield((notify) => {
        f(opts, (v, e) => {
            if (e === undefined) {
                if (cv) {
                    try {
                        v = cv(v)
                    } catch (e) {
                        notify.error(e)
                        return
                    }
                }
                notify.value(v)
            } else {
                if (ce) {
                    e = ce(e)
                }
                notify.error(e)
            }
        })
    })
}
/**
 * Calling asynchronous interface
 * 
 * @param cb Callback notification
 * @param f Asynchronous interface to be called
 * @param opts Interface parameters
 * @param cv When the asynchronous function succeeds, this function is called to wrap the return value
 * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
 */
export function cbReturn<Options, Result>(cb: CallbackReturn<any>,
    f: InterfaceReturn<Options, any>, opts: Options,
    cv?: CallbackMap<any, Result>, ce?: CallbackMap<any, any>,
): void {
    if (cv || ce) {
        f(opts, (v, e) => {
            if (e === undefined) {
                if (cv) {
                    try {
                        v = cv(v)
                    } catch (e) {
                        cb(undefined, e)
                        return
                    }
                }
                cb(v)
            } else {
                if (ce) {
                    e = ce(e)
                }
                cb(undefined, e)
            }
        })
    } else {
        f(opts, cb)
    }
}

/**
     * Convert asynchronous functions to Promise calling mode.  
     * Abbreviation for: new Promise((resolve,reject)=> coReturn(...))
 * 
 * @param f Asynchronous interface to be called
 * @param opts Interface parameters
 * @param cv When the asynchronous function succeeds, this function is called to wrap the return value
 * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
 */
export function asyncReturn<Options, Result>(f: InterfaceReturn<Options, any>, opts: Options,
    cv?: CallbackMap<any, Result>, ce?: CallbackMap<any, any>,
): Promise<Result> {
    return new Promise((resolve, reject) => {
        f(opts, (v, e) => {
            if (e === undefined) {
                if (cv) {
                    try {
                        v = cv(v)
                    } catch (e) {
                        reject(e)
                        return
                    }
                }
                resolve(v)
            } else {
                if (ce) {
                    e = ce(e)
                }
                reject(e)
            }
        })
    })
}

/**
 * Automatically adapt the asynchronous function to call based on Args
 */
export function callReturn<Options, Result>(
    f: InterfaceReturn<Options, any>,
    args: Args<Options, CallbackVoid>,
    cv?: CallbackMap<any, Result>, ce?: CallbackMap<any, any>,
): Result | Promise<Result> | void {
    if (args.co) {
        return coReturn(args.co, f, args.opts!, cv, ce)
    } else if (args.cb) {
        cbReturn(args.cb, f, args.opts!, cv, ce)
    } else {
        return asyncReturn(f, args.opts!, cv, ce)
    }
}