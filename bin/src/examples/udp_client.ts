import { Command } from "../flags";
import * as net from "ejs/net";
import { go } from "ejs/sync";
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

            go((co) => {
                let c: net.UdpConn

                try {
                    c = net.UdpConn.dialHost(co, {
                        network: network.value as any,
                        address: address.value,
                        signal: abort?.signal,
                    })
                } catch (e) {
                    console.log("connect error:", e)
                    return
                } finally {
                    clearTimeout(timer)
                }

                console.log(`connect success: ${c.localAddr} -> ${c.remoteAddr}`)
                const r = new net.UdpConnReader(c)
                try {
                    for (let i = 0; count.value < 1 || i < count.value; i++) {
                        const msg = new TextEncoder().encode(`這個第 ${i + 1} 個 message`)
                        r.write(msg)

                        const data = r.read(co)
                        if (!data) {
                            console.log("read eof")
                            break
                        }
                        console.log("recv:", new TextDecoder().decode(data), data)
                    }
                    r.close()
                    console.log("completed")
                } catch (e) {
                    r.close()
                    console.log(`udp error: ${e}`)
                }
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