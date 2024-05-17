import { Command } from "../flags";
import * as net from "ejs/net";
export const command = new Command({
    use: 'udp-client',
    short: 'udp echo client example',
    prepare(flags, _) {
        const address = flags.string({
            name: 'addr',
            short: 'a',
            usage: 'dial address',
            default: ":9000",
        });
        const network = flags.string({
            name: 'network',
            usage: 'network',
            values: [
                'udp', 'udp4', 'udp6',
            ],
            default: 'udp',
        });
        const count = flags.number({
            name: 'count',
            short: 'c',
            usage: 'send message count',
            default: 10,
        });
        const timeout = flags.number({
            name: "timeout",
            usage: "connect timeout",
            default: 1000,
        })
        return () => {
            const v = timeout.value
            let abort: undefined | net.AbortController
            let timer: any
            if (Number.isSafeInteger(v) && v > 1) {
                abort = new net.AbortController()
                timer = setTimeout(() => {
                    abort!.abort('dial timeout')
                }, v)
            }

            net.UdpConn.dialHost({
                network: network.value as any,
                address: address.value,
                signal: abort?.signal,
            }, (c, e) => {
                if (timer) {
                    clearTimeout(timer)
                }
                if (!c) {
                    console.log("connect error:", e)
                    return
                }

                console.log(`connect success: ${c.localAddr} -> ${c.remoteAddr}`)
                new State(c, count.value).next()
            })
        }
    },
})


class State {
    constructor(readonly c: net.UdpConn, readonly count: number) {
        this.serve()
    }
    private step_ = 0
    private data_?: Uint8Array
    serve() {
        const c = this.c
        c.onMessage = (data) => {
            const pre = this.data_
            if (!pre) {
                console.log("unexpected message:", data)
                c.close()
                return
            } else if (!ejs.equal(data, pre)) {
                console.log("not matched message:", pre, data)
                c.close()
                return
            }

            console.log("recv:", new TextDecoder().decode(data), data)

            this.data_ = undefined
            this.next()
        }
    }
    next() {
        if (this.step_ >= this.count) {
            this.c.close()
            console.log("completed")
            return
        }
        try {
            this.step_++
            this.data_ = new TextEncoder().encode(`這個第 ${this.step_} 個 message`)

            this.c.write(this.data_)
        } catch (e) {
            console.log('write error', e)
            this.c.close()
        }
    }
}