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
export function coVoid(co: YieldContext, f: (opts: any, cb: (e?: any) => void) => void, opts: any): void {
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
export function coReturn<T>(co: YieldContext, f: (opts: any, cb: (v: T, e?: any) => void) => void, opts: any): T {
    return co.yield<T>((notify) => {
        f(opts, (v, e) => {
            if (e === undefined) {
                notify.value(v)
            } else {
                notify.error(e)
            }
        })
    })
}
/**
 * <Options, CB> -> [Options, CB | undefined]
 */
export function parseAB<Options, CB>(a: any, b: any): [Options, CB | undefined] {
    if (isYieldContext(a)) {
        return [b, undefined]
    } else {
        if (typeof b !== "function") {
            throw new TypeError("cb must be a function")
        }
        return [a, b]
    }
}
/**
 * <CB, Options> -> [CB | undefined, Options]
 */
export function parseBA<CB, Options>(a: any, b: any): [CB | undefined, Options] {
    if (isYieldContext(a)) {
        return [undefined, b]
    } else {
        if (typeof a !== "function") {
            throw new TypeError("cb must be a function")
        }
        return [a, b]
    }
}

