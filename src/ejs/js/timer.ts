interface Core {
    __core(): void
}
interface Timer {
    p: string
    __timer(): void
}
interface Native {
    core(): Core
    timeout(core: Core, cb: () => void, ms: number, onend: (timer: Timer) => void): Timer
    interval(core: Core, cb: () => void, ms: number): Timer
    run(timer: Timer): void
    destroy(timer: Timer): void
}
(function (exports: Record<string, Function>, deps: Native) {
    const timeouts: Record<string, Timer | undefined> = {}
    const intervals: Record<string, Timer | undefined> = {}
    const core = deps.core()
    exports.setTimeout = function (cb: () => void, ms?: number) {
        const timer = deps.timeout(core, cb, ms ?? 0, (timer) => {
            const found = timeouts[timer.p]
            if (found == timer) {
                timeouts[timer.p] = undefined
            }
            deps.destroy(timer)
        })
        try {
            deps.run(timer);
        } catch (e) {
            deps.destroy(timer)
            throw e
        }
        timeouts[timer.p] = timer;
        return timer.p
    }
    exports.setInterval = function (cb: () => void, ms?: number) {
        const timer = deps.interval(core, cb, ms ?? 0)
        try {
            deps.run(timer);
        } catch (e) {
            deps.destroy(timer)
            throw e
        }
        intervals[timer.p] = timer;
        return timer.p
    }
    exports.clearTimeout = function (id: string) {
        const timer = timeouts[id];
        if (timer) {
            timeouts[id] = undefined
            deps.destroy(timer)
        }
    }
    exports.clearInterval = function (id: string) {
        const timer = intervals[id];
        if (timer) {
            intervals[id] = undefined
            deps.destroy(timer)
        }
    }
});