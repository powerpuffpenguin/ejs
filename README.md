# ejs

This is a JavaScript runtime environment designed for embedded systems. The
purpose is to use TypeScript for embedded development.

Currently only Linux is supported. But it uses c99 as the development standard,
so it should be easy to port to other platforms. Windows may be supported in the
future, but other embedded platforms may not be supported (my ability is
limited), because I am not an embedded programmer. This project is purely for me
to use typescript to write some programs for a specific Linux embedded platform.

Of course, if there are other embedded programmers willing to help, we can work
together to find a way to support a specific target platform.

```
import * as os from "ejs/os";
import * as sync from "ejs/sync";

// Start a coroutine
sync.go((co) => {
    // Create a temporary file
    const f = os.File.createTemp(co, "ejs_temp_*")
    const name = f.name()
    console.log(`create success: ${name}`)
    try {
        // write then close
        f.write(co, 'this is a coroutine example')
        f.close()

        // read text file
        const text = os.readTextFile(co, name)
        console.log(text)
    } catch (e) {
        console.log(`err: ${e}`)
    }
    // remove
    os.remove(co, name)
})
```

# es5 es6 ...

JavaScript uses the es5 environment provided by [duktape](https://duktape.org/),
and there is no plan to support es6 (it all depends on the
[duktape](https://duktape.org/) project plan), but you can use typescript to use
the latest es features. You just need to compile ts into js and run it. This is
also the development method I recommend. All subsequent documents and sample
codes are also based on typescript.

# Current situation

The overall code structure has been determined, and some standard libraries have
been implemented, but the project is still in its initial stage, and many APIs
may change. Please do not use them. You can check the current js support
functions in bin/main.d.ts. There are some sample codes under bin/src/examples.

# async code

Asynchronous code is based on the event system provided by
[libevent](https://libevent.org/). For system functions without asynchronous
API, they work hand in hand with [libevent](https://libevent.org/) through the
built-in thread pool(such as most functions in the "ejs/os" module).

Asynchronous functions in js basically provide three signatures for you to
choose the asynchronous model you want to use.

Take **os.stat** as an example

```
export function stat(name: string, cb: (info?: FileInfo, e?: PathError) => void): void
export function stat(co: YieldContext, name: string): FileInfo
export function stat(name: string): Promise<FileInfo>
```

## Callback

```
export function stat(name: string, cb: (info?: FileInfo, e?: PathError) => void): void
```

The callback function is the most primitive asynchronous model. It has the
smallest cost and the fastest speed, but it is difficult to code and is
generally not recommended. If you must use this mode, make sure you know what
you are doing.

## Promise

```
export function stat(name: string): Promise<FileInfo>
```

Promise is basically the modern asynchronous standard for es, and in es6... or
typescript you can also use await to make asynchronous code as easy to write as
synchronous code. However, it is not recommended to use it in ejs, because
Promise has a relatively large overhead in ejs, and even in highly optimized
environments such as nodejs deno, Promise also has a lot of overhead.

## Coroutine

```
export function stat(co: YieldContext, name: string): FileInfo
```

Promise is not a coroutine, nor was it originally designed for coroutines, so it
usually consumes more resources and is slower than coroutines.

[duktape](https://duktape.org/) provides coroutine support, and I wrapped it in
the "ejs/sync" module to make it easier to use. It is only a little slower than
the callback mode, and you should usually write code in this mode.

## Choose the appropriate asynchronous mode

1. If you want the asynchronous code to be compatible with other js
   environments, choose Promise mode. Otherwise, you should choose Coroutine
   mode.
2. Only consider using the callback mode when performance is really
   unsatisfactory. And at this time, you should probably consider moving the
   main time-consuming logic into C code.

Here are the times taken to calculate fibonacci(24) on my computer for different
modes. You can evaluate the times taken by different modes.

| function               | return | time used | note                                                                                                                                                                                       |
| ---------------------- | ------ | --------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| fibonacci(24)          | 46368  | 0.03s     | This is the synchronous code, which is basically the execution speed of js                                                                                                                 |
| fibonacciCo(24)        | 46368  | 0.279s    | Use coroutines as function returns, but there is no asynchrony. The extra time spent is entirely on the overhead of coroutines.                                                            |
| fibonacciImmediate(24) | 46368  | 0.654s    | Using the callback to return fibonacci, we simulated the asynchronous function through setImmediate, which is basically the fastest callback time in the theory of asynchronous functions. |
| fibonacciCoIm(24)      | 46368  | 0.982s    | Call fibonacciImmediate using coroutines. This is what happens when a real asynchronous function is called using coroutines.                                                               |
| fibonacciPromise(24)   | 46368  | 5.022s    | The execution speed of using Promise is significantly reduced                                                                                                                              |
| fibonacciAsync(24)     | 46368  | 8.426s    | What happens when using await+Promise                                                                                                                                                      |

The problem with Promise is that then and catch must be called in the next event
cycle, so when multiple then are used in succession, multiple setImmediate
overheads will be generated, even if there is no asynchrony (for example,
although Promise.resolve is synchronous code, it will also call setImmediate to
return the result in the next event cycle because of the Promise definition).
This is not a problem with coroutines, which should be the reason for the
significant performance difference between the two.
