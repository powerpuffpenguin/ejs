var sync = require("ejs/sync")
var net = require("ejs/net")
var RootCertificate = net.RootCertificate
var http = require("ejs/http")
var os = require("ejs/os")
function main() {
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
        console.log("scheme:", uri.scheme)
        console.log("userinfo:", uri.userinfo)
        console.log("host:", uri.host)
        console.log("port:", uri.port)
        console.log("path:", uri.path)
        console.log("query:", uri.query)
        console.log("fragment:", uri.fragment)

        // w.text(200, "ok\n")
        // w.status(http.StatusNoContent)
    })

}
main()