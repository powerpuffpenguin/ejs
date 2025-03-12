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

var s = 'abc1'
var array = [Base64.std, Base64.rawstd, Base64.url, Base64.rawurl]
for (var i = 0; i < array.length; i++) {
    var enc = array[i]
    var dst = enc.encodeToString(s)
    var buf = enc.decode(dst)
    console.log(buf.length, enc.encodedLen(buf.length), dst.length)
    console.log(dst, "'" + new TextDecoder().decode(buf) + "'")

}


