
import { stat } from "fs";
import { Command } from "../flags";
import * as net from "ejs/net";
export const command = new Command({
    use: 'net-client',
    short: 'net echo client example',
    prepare(flags, _) {
        const address = flags.string({
            name: 'addr',
            short: 'a',
            usage: 'listen address',
            default: ":9000",
        });
        const network = flags.string({
            name: 'network',
            usage: 'network',
            values: [
                'tcp', 'tcp4', 'tcp6',
            ],
            default: 'tcp',
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
            net.dial({
                network: network.value,
                address: address.value,
                timeout: timeout.value,
            }, (c, e) => {
                if (!c) {
                    console.log("connect error:", e)
                    return
                }

                console.log(`connect success: ${c.localAddr} -> ${c.remoteAddr}`)
                c.onError = (e) => {
                    console.log("err:", e)
                }
                new State(c, count.value).next()
            })
        }
    },
})


class State {
    constructor(readonly c: net.Conn, readonly count: number) {
        this.serve()
        c.onWritable = () => {
            const data = this.data_
            if (data) {
                // Continue writing unsent data
                try {
                    c.write(data)
                } catch (e) {
                    console.log("write error", e)
                    c.close()
                }
            }
            // Resume data reading
            this.serve()
        }
    }
    private step_ = 0
    private data_?: Uint8Array
    serve() {
        this.c.onMessage = (data, c) => {
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

            console.log("recv", data)

            this.data_ = undefined
            this.next()
        }
    }
    next() {
        if (this.step_ >= this.count) {
            this.c.close()
            return
        }
        try {
            this.step_++
            this.data_ = new TextEncoder().encode(`這個第 ${this.step_} 個 message`)

            if (this.c.write(this.data_) === undefined) {
                // write full，pause read
                this.c.onMessage = undefined
            }
        } catch (e) {
            console.log('write error', e)
            this.c.close()
        }
    }
}