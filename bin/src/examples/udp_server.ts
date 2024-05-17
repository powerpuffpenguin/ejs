
import { Command } from "../flags";
import * as net from "ejs/net";
export const command = new Command({
    use: 'udp-server',
    short: 'udp echo server example',
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
                'udp', 'udp4', 'udp6',
            ],
            default: 'udp',
        });
        const count = flags.number({
            name: 'count',
            short: 'c',
            usage: 'max service count',
            default: -1,
        });
        return () => {
            // create a listener
            const c = net.UdpConn.listen({
                network: network.value as any,
                address: address.value,
            })
            console.log(`listen: ${c.localAddr}`)
            const max = count.value
            let i = 0
            const buf = new Uint8Array(1024 * 32)
            const addr = new net.UdpAddr()
            // recv
            c.onReadable = (r) => {
                const n = r.read(buf, addr)
                const data = buf.subarray(0, n)
                console.log(`recv ${addr}:`, data)
                c.writeTo(data, addr)

                // Shut down the service after processing max requests
                if (max > 0) {
                    i++
                    if (i >= max) {
                        c.close()
                    }
                }
            }
        }
    },
})
