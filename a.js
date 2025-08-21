// var sync = require("ejs/sync")
// var net = require("ejs/net")
// var RootCertificate = net.RootCertificate
// var http = require("ejs/net/http")
// var url = require("ejs/net/url")
// var os = require("ejs/os")
// var utf8 = require("ejs/unicode/utf8")
// var strconv = require("ejs/strconv")
// var hex = require("ejs/encoding/hex")
// var binary = require("ejs/encoding/binary")
// var Base64 = require("ejs/encoding/base64").Base64
// var path = require("ejs/path")
// var hash = require("ejs/hash")
// var crypto = require("ejs/crypto")
var watch = require("ejs/os/watch")
var watcher
watcher = watch.watch(
    '/home/king/project/cc/ejs',
    watch.IN_MODIFY | watch.IN_CREATE | watch.IN_DELETE,
    function (a) {
        if (a.mask & watch.IN_MODIFY) {
            console.log('modify:', a.name, a.mask)
        } else if (a.mask & watch.IN_CREATE) {
            console.log('create:', a.name, a.mask)
        } else if (a.mask & watch.IN_DELETE) {
            console.log('delete:', a.name, a.mask)
            watcher.close()
            console.log("close")
            return true
        } else {
            console.log("unknow", a)
        }
    }
)
console.log("watcher:", watcher)
// watcher.close()