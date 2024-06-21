
import { Command } from "../flags";
import * as net from "ejs/net";
import { go } from "ejs/sync";
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
            const addr = new net.UdpAddr()
            const r = new net.UdpConnReader(c, undefined, true)
            go((co) => {
                try {
                    for (let i = 0; max < 1 || i < max; i++) {
                        const data = r.read(co, addr)!
                        console.log(`recv ${addr}:`, data)
                        c.writeTo(data, addr)
                    }
                } catch (e) {
                    console.log(`error: ${e}`)
                } finally {
                    c.close()
                }
            })
        }
    },
})
