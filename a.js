var sync = require("ejs/sync")
var net = require("ejs/net")
var RootCertificate = net.RootCertificate
var http = require("ejs/net/http")
var url = require("ejs/net/url")
var os = require("ejs/os")
var utf8 = require("ejs/unicode/utf8")
var strconv = require("ejs/strconv")
var hex = require("ejs/encoding/hex")
var Base64 = require("ejs/encoding/base64").Base64
var path = require("ejs/path")
function sleep(co, ms) {
    co.yield(function (notify) {
        setTimeout(function () {
            notify.value()
        }, ms)
    })
}
function main(co) {
    const opts = {
        network: 'tcp',
        address: '127.0.0.1:8080',
    }
    var client = new http.HttpClient(opts)
    while (true) {
        console.log("get")
        try {
            var r = client.do(co, {
                path: '/chunked',
                method: http.Method.GET,
            })
            console.log('statusCode:', r.statusCode)
            console.log('status', r.status)
            const header = r.header
            console.log(header.value("Content-length"))
            console.log(r.text())
        } catch (e) {
            console.log('err:', e.toString())
        }
        break
        sleep(co, 1000)
    }
}
sync.go(function (co) {
    main(co)
    console.log("all ok")
})
