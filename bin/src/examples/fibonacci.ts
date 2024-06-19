import { Command } from "../flags";
import { go, YieldContext } from "ejs/sync";
export const command = new Command({
    use: 'fibonacci',
    short: 'fibonacci test',
    prepare(flags, _) {
        const n = flags.number({
            name: 'seed',
            short: 's',
            usage: 'fibonacci seed',
            default: 24,
        });
        const mode = flags.string({
            name: 'mode',
            short: 'm',
            usage: 'mode',
            values: [
                'sync',      // 0.012s
                'co',          // 0.275s
                'im',          // 0.662s
                'coim',     // 0.981s
                'pro',        // 5.058s
                'async',   // 8.313s
            ],
            default: 'sync',
        });
        return () => {
            const at = Date.now()
            switch (mode.value) {
                case 'co':
                    go((co) => {
                        fibonacciPrint("fibonacciCo", n.value, fibonacciCo(co, n.value), at)
                    })
                    break
                case 'coim':
                    go((co) => {
                        fibonacciPrint("fibonacciCoIm", n.value, fibonacciCoIm(co, n.value), at)
                    })
                    break
                case 'async':
                    fibonacciAsync(n.value).then((total) => {
                        fibonacciPrint("fibonacciAsync", n.value, total, at)
                    })
                    break
                case 'pro':
                    fibonacciPromise(n.value).then((total) => {
                        fibonacciPrint("fibonacciPromise", n.value, total, at)
                    })
                    break
                case 'im':
                    fibonacciImmediate(n.value, (total) => {
                        fibonacciPrint("fibonacciImmediate", n.value, total, at)
                    })
                    break
                default:
                    fibonacciPrint("fibonacci", n.value, fibonacci(n.value), at)
                    break
            }
        }
    },
})
function fibonacciPrint(tag: string, n: number, total: number, at: number) {
    const used = (Date.now() - at) / 1000
    console.log(`${tag}(${n}) == ${total}, used ${used}s`)
}
function fibonacciCoIm(co: YieldContext, n: number): number {
    if (n < 2) {
        return co.yield((notify) => {
            setImmediate(() => {
                notify.value(n)
            })
        })
    }
    return fibonacciCoIm(co, n - 1) + fibonacciCoIm(co, n - 2)
}
function fibonacciCo(co: YieldContext, n: number): number {
    if (n < 2) {
        return co.yield((notify) => {
            notify.value(n)
        })
    }
    return fibonacciCo(co, n - 1) + fibonacciCo(co, n - 2)
}
function fibonacci(n: number): number {
    if (n < 2) {
        return n
    }
    return fibonacci(n - 1) + fibonacci(n - 2)
}
async function fibonacciAsync(n: number): Promise<number> {
    if (n < 2) {
        return n
    }
    return await fibonacciAsync(n - 1) + await fibonacciAsync(n - 2)
}
function fibonacciPromise(n: number): Promise<number> {
    if (n < 2) {
        return Promise.resolve(n)
    }
    return new Promise((resolve) => {
        let sum = 0
        let count = 0
        const cb = (v: number) => {
            sum += v
            ++count
            if (count == 2) {
                resolve(sum)
            }
        }
        fibonacciPromise(n - 1).then(cb)
        fibonacciPromise(n - 2).then(cb)
    })
    // return Promise.all(
    //     [
    //         fibonacciPromise(n - 1),
    //         fibonacciPromise(n - 2),
    //     ],
    // ).then((a) => {
    //     return a[0] + a[1]
    // })
}
function fibonacciImmediate(n: number, cb: (v: number) => void) {
    if (n < 2) {
        setImmediate(() => {
            cb(n)
        })
        return
    }

    let total = 0
    let sum = 0
    const xcb = (v: number) => {
        sum += v
        if (++total == 2) {
            cb(sum)
        }
    }
    fibonacciImmediate(n - 1, xcb)
    fibonacciImmediate(n - 2, xcb)
}