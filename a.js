var sync = require("ejs/sync")
var net = require("ejs/net")
var http = require("ejs/http")
var os = require("ejs/os")

sync.go(function (co) {
    var c
    var rw
    try {
        // net.mbedtls_debug(4)

        c = net.dial(co, {
            // network: "tcp",
            // address: "127.0.0.1:2443",
            // address: "xsd-webpc.cdnewstar.cn:3443",

            network: "unix",
            address: "@abc",
            tls: {
                insecure: true,
                // debug: true,
                maxVersion: net.Tls12,
            },
        })

        rw = new net.TcpConnReaderWriter(c)
        c = undefined

        rw.write(co, "GET / HTTP/1.0\nHost: xsd-webpc.cdnewstar.cn\nUser-Agent: curl/7.58.0\nAccept: */*\n\n")

        var b = new Uint8Array(1024)
        var n
        while (true) {
            n = rw.read(co, b)
            if (!n) {
                break
            }
            console.log(new TextDecoder().decode(b.subarray(0, n)))
        }
    } catch (e) {
        console.log("error:", e.toString())
    } finally {
        if (c) {
            c.close()
        }
        if (rw) {
            rw.close()
        }
    }
})