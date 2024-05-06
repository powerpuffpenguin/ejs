
import { Command } from "../flags";
import * as net from "ejs/net";
export const command = new Command({
    use: 'tcp-server',
    short: 'tcp echo server example',
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
        return () => {
            const l = net.listen({
                network: network.value,
                address: address.value,
            }) as net.TcpListener
            console.log(`tcp listen: ${l.addr}`)
            l.onError = (e) => {
                console.log("accept err:", e)
            }
            let i = 0
            l.onAccept = (c) => {
                console.log(`one in: ${c.remoteAddr}`)
                c.onMessage = (data, c) => {
                    c.write(data)
                }
                // Shut down the service after processing 5 requests
                i++
                if (i == 5) {
                    l.close()
                }
            }
        }
    },
})