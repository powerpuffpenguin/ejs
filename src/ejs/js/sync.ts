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