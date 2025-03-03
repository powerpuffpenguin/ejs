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
function main(co) {
    var opts = {
        resolver: net.Resolver.getDefault(),
        ip: '127.0.0.1',
        port: 9001,
        // port: 80,
        // address: '127.0.0.1:9443',
        // tls: {
        //     insecure: true,
        // },
        // sync: true,
        // tls: {
        //     certificate: [
        //         {
        //             cert: os.readTextFileSync('/home/king/project/docker/development-images/httptest/test.crt'),
        //             key: os.readTextFileSync('/home/king/project/docker/development-images/httptest/test.key'),
        //         },
        //     ],
        // },
    }
    // opts.address = '127.0.0.1:80'
    // opts.address = '127.0.0.1:9443'
    // // opts.address = 'www.baidu.com:443'
    // opts.tls = { insecure: true }
    // http.test()

    // var client = new http.HttpConn(opts)
    // console.log(client)
    // try {
    //     client.do({
    //         path: '/abc',
    //         method: http.Method.GET
    //     }, function (r, e) {
    //         console.log(r, e)
    //         console.log("close", client)
    //         client.close()
    //         console.log("close ok")
    //         // setTimeout(function () {


    //         //     if (e) {
    //         //         console.log("req err:", e.toString())
    //         //         return
    //         //     }
    //         //     console.log(r)
    //         //     console.log('statusCode:', r.statusCode)
    //         //     console.log('status', r.status)
    //         //     const header = r.header
    //         //     console.log(header.get("Content-length"))
    //         //     console.log(r.text)
    //         // }, 10)
    //     })
    // } catch (e) {
    //     console.log('err:', e.toString())

    //     client.close()
    // }
    // return

    // try {
    //     r = client.do(co, {
    //         path: '/abc',
    //         method: http.Method.GET
    //     })
    //     console.log('statusCode:', r.statusCode)
    //     console.log('status', r.status)
    //     const header = r.header
    //     console.log(header.get("Content-Type"))
    //     console.log(header.get("Content-length"))
    //     console.log(r.text)
    // } catch (e) {
    //     console.log('err:', e.toString())
    // }

    // console.log("close", client)
    // client.close()
    // console.log('------------co0', co)
    // co.yield(function (notify) {
    //     console.log('------------co1', co)
    //     client.do({
    //         path: '/abc',
    //         method: http.Method.GET
    //     }, function (r, e) {
    //         notify.value(r)
    //         console.log('--------------------')
    //     })
    // })
    // console.log('------------co2', co)

    // console.log("close", client)
    // client.close()



    // client.close()
    // client.do({}, function (resp, e) {
    //     console.log(resp, e)
    // })
    // opts.network = "tcp"
    // var l = net.listen(opts)
    // if (opts.tls) {
    //     console.log("https listen on:", l.addr)
    // } else {
    //     console.log("http listen on:", l.addr)
    // }
    // var mux = new http.ServeMux()

    // mux.handle('/', function (w, r) {
    //     w.text(http.StatusOK, "cerberus is an idea")
    // })
    // mux.handle('/close', function (w, r) {
    //     w.text(http.StatusOK, "closed")
    //     l.close()
    // })
    // mux.handle('/chunk', function (w, r) {
    //     sync.go(function (co) {
    //         var chunk = w.chunk(http.StatusOK)
    //         try {
    //             for (var i = 0; i < 5; i++) {
    //                 var msg = "this is chunk " + i
    //                 chunk.chunk(co, msg)
    //             }
    //         } catch (e) {
    //             console.log("err", e.toString())
    //         } finally {
    //             chunk.close()
    //         }
    //     })
    // })
    // mux.handle('/ws', function (w, r) {
    //     var ws = w.upgrade()
    //     if (!ws) {
    //         return
    //     }
    //     ws.onClose = function () {
    //         console.log("ws close")
    //         l.close()
    //     }
    //     ws.onMessage = function (data) {
    //         console.log("ws get:", data)
    //         ws.write(data)
    //         // setTimeout(function () {
    //         //     console.log('0')
    //         ws.close()
    //         //     console.log("c-----lose ok")
    //         // }, 10);

    //     }
    //     console.log(ws)
    //     ws.write("connect ok")
    // })
    // new http.Server(l, mux)
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
sync.go(function (co) {
    main(co)
    console.log("all ok")
})
