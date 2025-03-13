var sync = require("ejs/sync")
var net = require("ejs/net")
var RootCertificate = net.RootCertificate
var http = require("ejs/net/http")
var url = require("ejs/net/url")
var os = require("ejs/os")
var utf8 = require("ejs/unicode/utf8")
var strconv = require("ejs/strconv")
var hex = require("ejs/encoding/hex")
var path = require("ejs/path")

function sleep(co, ms) {
    co.yield(function (notify) {
        setTimeout(function () {
            notify.value()
        }, ms)
    })
}
function runServer(co, opts) {
    var l = net.listen(opts)
    if (opts.tls) {
        console.log("https listen on:", l.addr)
    } else {
        console.log("http listen on:", l.addr)
    }
    var mux = new http.ServeMux()

    mux.handle('/', function (w, r) {
        w.text(http.StatusOK, "cerberus is an idea")
    })
    mux.handle('/close', function (w, r) {
        w.text(http.StatusOK, "closed")
        l.close()
    })
    mux.handle('/chunk', function (w, r) {
        sync.go(function (co) {
            var chunk = w.chunk(http.StatusOK)
            try {
                for (var i = 0; i < 5; i++) {
                    var msg = "this is chunk " + i
                    chunk.chunk(co, msg)

                    sleep(co, 1000)
                }
            } catch (e) {
                console.log("err", e.toString())
            } finally {
                chunk.close()
            }
        })
    })
    mux.handle('/ws', function (w, r) {
        var ws = w.upgrade()
        if (!ws) {
            return
        }
        ws.onClose = function () {
            console.log("ws close")
            l.close()
        }
        ws.onMessage = function (data) {
            console.log("ws get:", data)
            ws.write(data)
            // setTimeout(function () {
            //     console.log('0')
            ws.close()
            //     console.log("c-----lose ok")
            // }, 10);
        }
        setTimeout(function () {
            console.log("write: connect ok")
            ws.write("connect ok")
        }, 1000)
    })
    new http.Server(l, mux)
    // new http.Server(l, {
    //     serveHTTP: function (w, r) {
    //         console.log("host:", r.host)
    //         var uri = r.uri
    //         console.log(r.methodString, uri.toString())
    //         console.log(uri.query)
    //         var h = r.header()
    //         console.log("User-Agent:", h.get("user-agent"))

    //         w.text(200, "ok\n")
    //         // w.status(http.StatusNoContent)
    //     }
    // })
}
function runClient(co, opts) {
    const unix = opts.network == 'unix'
    if (!unix) {
        if (ejs.os == "linux") {
            opts.tls = {
                // Load system ca
                certificate: [
                    RootCertificate.get(co),
                ],
            }
        } else {
            opts.tls = {
                // Don't verify certificate
                insecure: true,
            }
        }
    }

    var client = new http.HttpConn(opts)
    try {
        var r = client.do(co, {
            path: '/',
            method: http.Method.GET
        })
        console.log('statusCode:', r.statusCode)
        console.log('status', r.status)
        const header = r.header
        console.log(header.get("Content-length"))
        console.log(r.text())
    } catch (e) {
        console.log('err:', e.toString())
    }

    if (unix) {
        client.do(co, {
            path: '/close',
            method: http.Method.GET
        })
    }
    client.close()
}
function main(co) {
    // const opts = {
    //     network: 'tcp',
    //     address: 'www.bing.com:443',
    // }
    const opts = {
        network: 'unix',
        address: '@ejs_http',
        // network: 'tcp',
        // address: '127.0.0.1:9000',
    }
    runServer(co, opts)
    // runClient(co, opts)

    var c = http.Websocket.connect(co, {
        network: opts.network,
        address: opts.address,
        path: '/ws',
    })
    console.log('---------------c', c)
    c.onMessage = function (x) {
        console.log('onMessage', x)
    }
}
sync.go(function (co) {
    main(co)
    console.log("all ok")
})
