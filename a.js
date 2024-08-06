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
String.prototype.replaceAll1 = function (search, replacement) {
    console.log("replaceAll1")
    var target = this;
    console.log("replaceAll1", target, new RegExp(search, 'g'), replacement)
    return target.replace(new RegExp(search, 'g'), replacement)
}
function main() {
    {
        // const u = url.URL.parse("a=1&a=2;a=banana")
        // console.log(u)
        const v = url.Values.parse("a=1&a=2;a=banana", true)
        console.log(v.values)
        console.log(v.encode())
        // var base = url.URL.parse('http://foo.com/bar')
        // var rel = url.URL.parse('..')
        // console.log(base.toString())
        // console.log(rel.toString())

        // console.log(base.escapedPath())
        // console.log(rel.escapedPath())
        // console.log(url.resolvePath(base.escapedPath(), rel.escapedPath()))
        // base.resolveReference(rel)
        return
    }
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

    // new http.Server(l, mux)
    new http.Server(l, {
        serveHTTP: function (w, r) {
            console.log("host:", r.host)
            var uri = r.uri
            console.log(r.methodString, uri.toString())
            console.log(uri.query)
            var h = r.header()
            console.log("User-Agent:", h.get("user-agent"))

            w.text(200, "ok\n")
            // w.status(http.StatusNoContent)
        }
    })
}
main()