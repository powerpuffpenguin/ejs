var sync = require("ejs/sync")
var net = require("ejs/net")
var RootCertificate = net.RootCertificate
var http = require("ejs/http")
var os = require("ejs/os")

function serve(c) {
    console.log("serve:", c)
    c.onMessage = function (msg) {
        console.log(new TextDecoder().decode(msg))
        try {
            c.write(msg)
        } catch (e) {
            console.log("write err:", e.toString())
            c.close()
        }
    }
    c.onError = function (e) {
        console.log('onError:', e.toString())
        c.close()
    }
}

function main() {
    sync.go(function (co) {
        try {
            var cert = os.readTextFile(co, "/home/king/project/docker/development-images/httptest/test.crt")
            var key = os.readTextFile(co, "/home/king/project/docker/development-images/httptest/test.key")
            var l = net.listen({
                network: 'tcp',
                address: ':9000',
                tls: {
                    certificate: [
                        {
                            cert: cert,
                            key: key,
                        },
                    ],
                },
            })
            console.log("listen on", l.addr)
            var i = 0
            l.onAccept = function (c) {
                serve(c)
                if (++i == 3) {
                    l.close()
                }
            }
            l.onError = function (e) {
                console.log(e)
            }
        } catch (e) {
            console.log('listener error:', e.toString())
        }
    })
}
main()