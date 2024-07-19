var sync = require("ejs/sync")
var net = require("ejs/net")
var RootCertificate = net.RootCertificate
var http = require("ejs/net/http")
var url = require("ejs/net/url")
var os = require("ejs/os")
var utf8 = require("ejs/unicode/utf8")
var strconv = require("ejs/strconv")
var hex = require("ejs/encoding/hex")
function main() {
    try {
        var buf = new Uint8Array(128)
        var n = hex.encode(buf, "jbc1", 1)
        console.log(n)
        buf = buf.subarray(0, n)
        console.log(new TextDecoder().decode(buf))

        var b0 = new Uint8Array(128)
        n = hex.decode(b0, buf)
        console.log(n)
        b0 = b0.subarray(0, n)
        console.log(new TextDecoder().decode(b0))

    } catch (e) {
        console.log("---", e)
        console.log("---", e.message)
        console.log("---", e.toString())
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