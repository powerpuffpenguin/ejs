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
        var c
        try {
            c = net.dial(co, {
                network: 'tcp',
                // address: '127.0.0.1:9000',
                address: 'www.baidu.com:443',
                tls: {
                    // insecure: true,
                },
            })
            console.log("ok")
        } catch (e) {
            console.log("err:", e.toString())
        } finally {
            if (c) {
                c.close()
            }
        }
    })
}
main()