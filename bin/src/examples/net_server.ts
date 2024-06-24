
import { Command } from "../flags";
import * as net from "ejs/net";
import { YieldContext, go } from "ejs/sync";
export const command = new Command({
    use: 'net-server',
    short: 'net echo server example',
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
                'tcp', 'tcp4', 'tcp6', 'unix',
            ],
            default: 'tcp',
        });
        const count = flags.number({
            name: 'count',
            short: 'c',
            usage: 'max service count',
            default: -1,
        });
        const sync = flags.bool({
            name: 'sync',
            usage: 'sync listener',
            default: false,
        })
        const backlog = flags.number({
            name: 'backlog',
            usage: 'accept backlog',
            default: 5,
        });
        return () => {
            // create a listener
            const l = net.listen({
                network: network.value,
                address: address.value,
                sync: sync.value,
                backlog: backlog.value,
            })
            if (sync.value) {
                console.log(`sync listen: ${l.addr}`)
            } else {
                console.log(`listen: ${l.addr}`)
            }
            l.onError = (e) => {
                console.log("accept err:", e)
            }
            const max = count.value
            let i = 0
            // accept connection
            l.onAccept = (c) => {
                go((co) => {
                    onAccept(co, c)
                })
                // Shut down the service after processing max requests
                if (max > 0) {
                    i++
                    if (i >= max) {
                        l.close()
                    }
                }
            }
        }
    },
})

function onAccept(co: YieldContext, c: net.Conn) {
    console.log(`one in: ${c.remoteAddr}`)
    const rw = new net.TcpConnReaderWriter(c)
    const buf = new Uint8Array(1024 * 32)
    try {
        while (true) {
            let n = rw.read(co, buf)
            if (!n) {
                break
            }
            let data = buf.subarray(0, n)
            console.log(`recv ${c.remoteAddr}:`, data)
            while (data.length) {
                n = rw.write(co, data)
                data = data.subarray(n)
            }
        }
    } catch (e) {
        console.log("error", e)
        rw.close()
    }
}