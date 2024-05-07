
import { Command } from "../flags";
import * as net from "ejs/net";
export const command = new Command({
    use: 'net-server',
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
            // create a listener
            const l = net.listen({
                network: network.value,
                address: address.value,
            })
            console.log(`tcp listen: ${l.addr}`)
            l.onError = (e) => {
                console.log("accept err:", e)
            }
            let i = 0
            // accept connection
            l.onAccept = (c) => {
                onAccept(c)
                // Shut down the service after processing 5 requests
                i++
                if (i == 5) {
                    l.close()
                }
            }
        }
    },
})


class EchoService {
    private data_?: Uint8Array
    private length_ = 0
    constructor(readonly c: net.TcpConn) {
        c.onWritable = () => {
            const data = this.data_
            const len = this.length_
            if (data && len) {
                // Continue writing unsent data
                try {
                    c.write(data.subarray(0, len))
                } catch (e) {
                    console.log("write error", e)
                    c.close()
                }
            }
            // Resume data reading
            this.serve()
        }
    }
    serve() {
        // onMessage for read
        this.c.onMessage = (data, c) => {
            try {
                if (c.write(data) === undefined) {
                    // write full，pause read
                    c.onMessage = undefined

                    // clone data
                    let buf = this.data_
                    if (!buf || buf.length < data.length) {
                        buf = new Uint8Array(data.length)
                        this.data_ = buf
                    }
                    buf.set(data)
                    this.length_ = data.length
                }
            } catch (e) {
                console.log("write error", e)
                c.close()
            }
        }
    }
}
function onAccept(c: net.Conn) {
    console.log(`one in: ${c.remoteAddr}`)
    c.onError = (e) => {
        console.log("one out", e)
    }
    // read and write net data
    new EchoService(c).serve()
}