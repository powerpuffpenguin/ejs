
import { Command } from "../flags";
import * as net from "ejs/net";
import * as os from "ejs/os";
import *as http from "ejs/net/http";
export const command = new Command({
    use: 'http-server',
    short: 'http server example',
    prepare(flags, _) {
        const address = flags.string({
            name: 'addr',
            short: 'a',
            usage: 'listen address',
            default: ":9000",
        })
        const network = flags.string({
            name: 'network',
            usage: 'network',
            values: [
                'tcp', 'tcp4', 'tcp6', 'unix',
            ],
            default: 'tcp',
        })
        const sync = flags.bool({
            name: 'sync',
            usage: 'sync listener',
            default: false,
        })
        const backlog = flags.number({
            name: 'backlog',
            usage: 'accept backlog',
            default: 5,
        })
        const certFile = flags.string({
            name: 'certFile',
            usage: 'x509 cert file path',
        })
        const keyFile = flags.string({
            name: 'keyFile',
            usage: 'x509 key file path',
        })
        return () => {
            // create a listener
            let tls: net.ServerTlsConfig | undefined
            if (certFile.value != '' && keyFile.value != '') {
                tls = {
                    certificate: [
                        {
                            cert: os.readTextFileSync(certFile.value),
                            key: os.readTextFileSync(keyFile.value),
                        }
                    ]
                }
            }
            const l = net.listen({
                network: network.value,
                address: address.value,
                sync: sync.value,
                backlog: backlog.value,
                tls: tls
            })
            if (sync.value) {
                if (tls) {
                    console.log(`https sync listen: ${l.addr}`)
                } else {
                    console.log(`http sync listen: ${l.addr}`)
                }
            } else {
                if (tls) {
                    console.log(`https listen: ${l.addr}`)
                } else {
                    console.log(`http listen: ${l.addr}`)
                }
            }
            new http.Server(l, createServeMux())
        }
    },
})
function createServeMux() {
    const mux = new http.ServeMux()

    mux.handle('/', (w, r) => {
        w.text(http.StatusOK, "cerberus is an idea")
    })
    mux.handle('/json', (w, r) => {
        w.json(http.StatusOK, {
            name: "king",
            level: 123,
        })
    })
    mux.handle('/jsonp', (w, r) => {
        w.jsonp(http.StatusOK, "cb", {
            name: "king",
            level: 123,
        })
    })
    mux.handle('/xml', (w, r) => {
        w.body(http.StatusOK,
            http.ContentTypeXML,
            "<root><name>cerberus</name><lv>1</lv></root>",
        )
    })
    mux.handle('/yaml', (w, r) => {
        w.body(http.StatusOK,
            http.ContentTypeYAML, `networks:
  ingress_intranet:
    external: true
services:
  code:
    build:
      context: .
      dockerfile: android.Dockerfile
`
            ,
        )
    })
    mux.handle('/html', (w, r) => {
        w.body(http.StatusOK,
            http.ContentTypeHTML,
`<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Document</title>
</head>
<body>
    ok
</body>
</html>`,
        )
    })
    return mux
}