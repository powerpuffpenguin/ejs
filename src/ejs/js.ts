/**
 * Generic functions for use by internal js modules
 */

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
export function isYieldContext(v: any): v is YieldContext {
    return typeof v === "object" && typeof v.yield === "function"
}
export type CallbackVoid = (e?: any) => void
export type CallbackReturn<T> = (value?: T, e?: any) => void
export type InterfaceVoid<Options> = (opts: Options, cb: CallbackVoid) => void
export type InterfaceReturn<Options, Result> = (opts: Options, cb: CallbackReturn<Result>) => void
export type CallbackMap<Input, Output> = (v: Input) => Output
export function coVoid<Options>(co: YieldContext,
    f: InterfaceVoid<Options>, opts: Options,
    ce?: CallbackMap<any, any>,
): void {
    if (ce) {
        try {
            return co.yield<void>((notify) => {
                f(opts, (e) => {
                    if (e === undefined) {
                        notify.value()
                    } else {
                        notify.error(e)
                    }
                })
            })
        } catch (e) {
            throw ce(e)
        }
    } else {
        return co.yield<void>((notify) => {
            f(opts, (e) => {
                if (e === undefined) {
                    notify.value()
                } else {
                    notify.error(e)
                }
            })
        })
    }
}
export function cbVoid<Options>(cb: CallbackVoid,
    f: InterfaceVoid<Options>, opts: Options,
    ce?: CallbackMap<any, any>,
): void {
    if (ce) {
        try {
            f(opts, (e) => {
                try {
                    e = ce(e)
                } catch (err) {
                    e = err
                }
                cb(e)
            })
        } catch (e) {
            try {
                e = ce(e)
            } catch (err) {
                e = err
            }
            cb(e)
        }
    } else {
        try {
            f(opts, cb)
        } catch (e) {
            cb(e)
        }
    }
}
export function coReturn<Options, Result>(co: YieldContext,
    f: InterfaceReturn<Options, any>, opts: Options,
    cv?: CallbackMap<any, any>, ce?: CallbackMap<any, any>,
): Result {
    if (ce) {
        try {
            const v = co.yield((notify) => {
                f(opts, (v, e) => {
                    if (e === undefined) {
                        notify.value(v!)
                    } else {
                        notify.error(e)
                    }
                })
            })
            return cv ? cv(v) : v
        } catch (e) {
            throw ce(e)
        }
    } else {
        const v = co.yield<Result>((notify) => {
            f(opts, (v, e) => {
                if (e === undefined) {
                    notify.value(v!)
                } else {
                    notify.error(e)
                }
            })
        })
        return cv ? cv(v) : v
    }
}
export function cbReturn<Options, Result>(cb: CallbackReturn<Result>,
    f: InterfaceReturn<Options, any>, opts: Options,
    cv?: CallbackMap<any, any>, ce?: CallbackMap<any, any>,
): void {
    if (ce) {
        try {
            f(opts, (v, e) => {
                if (e === undefined) {
                    if (cv) {
                        try {
                            v = cv(v)
                        } catch (e) {
                            try {
                                e = ce(e)
                            } catch (err) {
                                e = err
                            }
                            cb(undefined, e)
                            return
                        }
                    }
                    cb(v)
                } else {
                    try {
                        e = ce(e)
                    } catch (err) {
                        e = err
                    }
                    cb(undefined, e)
                }
            })
        } catch (e) {
            cb(undefined, e)
        }
    } else if (cv) {
        try {
            f(opts, (v, e) => {
                if (e === undefined) {
                    try {
                        v = cv(v)
                    } catch (e) {
                        cb(undefined, e)
                    }
                    cb(v)
                } else {
                    cb(undefined, e)
                }
            })
        } catch (e) {
            cb(undefined, e)
        }
    } else {
        try {
            f(opts, cb)
        } catch (e) {
            cb(undefined, e)
        }
    }
}
/**
 * <Options, CB> -> [Options, CB | undefined]
 */
export function parseAB<Options, CB>(a: any, b: any): [Options, CB | undefined] {
    if (isYieldContext(a)) {
        return [b, undefined]
    } else if (typeof b === "function") {
        return [a, b]
    }
    throw new TypeError("cb must be a function")
}
/**
 * <Options, CB> | < CB> -> [Options, CB | undefined]
 */
export function parseBorAB<Options, CB>(a: any, b: any): [Options | undefined, CB | undefined] {
    if (isYieldContext(a)) {
        return [b, undefined]
    } else if (typeof a === "function") {
        return [undefined, a]
    } else if (typeof b === "function") {
        return [a, b]
    }
    throw new TypeError("cb must be a function")
}

