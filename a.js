var sync = require("ejs/sync")
var net = require("ejs/net")
var RootCertificate = net.RootCertificate
var http = require("ejs/net/http")
var url = require("ejs/net/url")
var os = require("ejs/os")
var utf8 = require("ejs/unicode/utf8")
var strconv = require("ejs/strconv")
var hex = require("ejs/encoding/hex")
var binary = require("ejs/encoding/binary")
var Base64 = require("ejs/encoding/base64").Base64
var path = require("ejs/path")
var hash = require("ejs/hash")
// var Hash32 = hash.Adler32
// console.log(Hash32.sum32("61"))
// console.log(hex.encodeToString(Hash32.sum("61")))
var b0 = new ArrayBuffer(2)
new DataView(b0).setUint16(0, 65534, false)
console.log(b0)

var b1 = new ArrayBuffer(2)
binary.BigEndian.setUint16(b1, 0, 65534)
console.log(b1)