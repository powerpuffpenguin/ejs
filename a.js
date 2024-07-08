var sync = require("ejs/sync")
var net = require("ejs/net")
var RootCertificate = net.RootCertificate
var http = require("ejs/net/http")
var url = require("ejs/net/url")
var os = require("ejs/os")
var utf8 = require("ejs/unicode/utf8")
function main() {
    {
        var buf0 = new Uint8Array(32)
        var b1 = buf0.subarray(16, 18)
        console.log(buf0.subarray(16, 18).buffer === buf0.subarray(16, 18).buffer)
        // b1 = utf8.test(b1)
        // console.log(b1.byteOffset, b1.length)

        // utf8.appendRune(buf0.subarray(16, 16).subarray(0, 2), 65)
        console.log(buf0)
    }
    // {
    //     var query = new url.Values()

    //     query.add('name', 'kate')
    //     query.add('id', 1)
    //     query.add('id', 2)
    //     console.log('url:', url.URL.parse(query.encode()))
    //     console.log('url:', url.URL.parse('HTTPS://www.google.com/ab/cd?id=1&id=2#koxs'))
    // }
    return
    var l = net.listen({
        network: 'tcp',
        address: '127.0.0.1:9000',
        // sync: true,
        tls: {
            certificate: [
                {
                    cert: os.readTextFileSync('/home/king/project/docker/development-images/httptest/test.crt'),
                    key: os.readTextFileSync('/home/king/project/docker/development-images/httptest/test.key'),
                },
            ],
        },
    })

    console.log("https listen on:", l.addr)
    new http.Server(l, function (w, r) {
        console.log("host:", r.host)
        var uri = r.uri
        console.log(r.methodString, r.uri.toString())
        // console.log("scheme:", uri.scheme)
        // console.log("userinfo:", uri.userinfo)
        // console.log("host:", uri.host)
        // console.log("port:", uri.port)
        // console.log("path:", uri.path)
        // console.log("query:", uri.query)
        // console.log("fragment:", uri.fragment)

        var h = r.header()
        h.add("y", 10)
        h.add("y", 11)


        h.add("x", 1)
        h.add("x", 2)
        h.add("x", 3)
        h.removeAll("x")

        h.set("y", 123)

        console.log(h.get("x"))
        console.log(h.get("user-agent"))

        w.text(200, "ok\n")
        // w.status(http.StatusNoContent)
    })

}
main()