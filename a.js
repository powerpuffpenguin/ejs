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
var hash = require("ejs/hash")
var Hash32 = hash.Adler32
// console.log(Hash32.sum32("61"))
// console.log(hex.encodeToString(Hash32.sum("61")))

// console.log(ejs.isBufferData(new Int8Array()))

os.writeFile({
    name: "a.txt"
}, function (e) {
    console.log("write", e)
})