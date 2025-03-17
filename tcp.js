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
    console.log("tcp listen on:", l.addr)
    l.onAccept = function (c) {
        c.onClose = function () {
            console.log("server: close")
            l.close()
        }
        c.write("ok")
        c.onMessage = function () {

        }
    }
}
function runClient(co, opts) {
    var c = new net.dial(co, opts)
    c.onClose = function () {
        console.log("client: close")
    }
    c.onReadable = function (r) {
        console.log("have data:", r.length)
        c.onReadable = undefined
        setTimeout(function () {
            console.log('set')
            c.onReadable = function (r) {
                console.log("repeat have data", r.length)
                c.close()
            }
        }, 1000)
    }

}
function main(co) {
    const opts = {
        network: 'unix',
        address: '@ejs_tcp',
    }
    runServer(co, opts)
    runClient(co, opts)
}
sync.go(function (co) {
    main(co)
    console.log("all ok")
})
