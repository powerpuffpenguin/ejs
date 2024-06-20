namespace globalThis {
    function setImmediate(cb: (...arguments: Array<any>) => void, ...arguments: Array<any>): number
    function clearImmediate(cb: (...arguments: Array<any>) => void, ...arguments: Array<any>): number
}
/**
 * Some tools for synchronization in asynchronous code
 */
declare module "ejs/sync" {
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
         * Wake up the coroutine and call the function resume.  
         * The return value of resume is used as the coroutine return value.  
         * The exception thrown by resume can be caught by the coroutine.
         */
        next(resume: () => T): void
    }

    export class Coroutine {
        constructor(f: (co: YieldContext) => void)
        readonly state: 'none' | 'run' | 'yield' | 'finish'
        /**
         * run coroutine
         */
        run(): void
        /**
         * Callback after the coroutine finish
         */
        onFinish?: () => void
    }
    /**
     * new Coroutine(f).run()
     */
    export function go(f: (co: YieldContext) => void): void

    export function isYieldContext(co: any): co is YieldContext
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
    export function parseArgs<Options, CB>(tag: string, a: any, b: any): Args<Options, CB>
    /**
     * Used to parse function parameters with the following signatures
     * (co: YieldContext, opts?: Options) => any
     * (opts?: Options) => Promise<any>
     * (opts: Options, cb: (...) => void) => Promise<any>
     * (cb: (...) => void) => Promise<any>
     * @param tag The function name to display when parsing fails
     */
    export function parseOptionalArgs<Options, CB>(tag: string, a: any, b: any): Args<Options, CB>

    /**
     * Using a coroutine to call an asynchronous interface with no return value
     * 
     * @param co Coroutine context
     * @param f Asynchronous interface to be called
     * @param opts Interface parameters
     * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
     */
    export function coVoid<Options>(co: YieldContext,
        f: InterfaceVoid<Options>, opts: Options,
        ce?: CallbackMap<any, any>,
    ): void
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
    ): void
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
    ): Promise<void>
    /**
     * Automatically adapt the asynchronous function to call based on Args
     */
    export function callVoid<Options>(
        f: InterfaceVoid<Options>,
        args: Args<Options, CallbackVoid>,
        ce?: CallbackMap<any, any>,
    ): void | Promise<void>

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
    ): Result
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
    ): void
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
    ): Promise<Result>
    /**
     * Automatically adapt the asynchronous function to call based on Args
     */
    export function callReturn<Options, Result>(
        f: InterfaceReturn<Options, any>,
        args: Args<Options, CallbackVoid>,
        cv?: CallbackMap<any, Result>, ce?: CallbackMap<any, any>,
    ): Result | Promise<Result> | void
}