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

function main() {
    var opts = {
        network: 'tcp',
        address: '127.0.0.1:9000',
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
        console.log(ws)
        ws.write("connect ok")
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
main()