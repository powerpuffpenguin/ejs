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
var Hash = hash.MD5
var key = new Uint8Array([
    0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
    0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b, 0x0b,
    0x0b, 0x0b, 0x0b, 0x0b,
])
var data = "Hi There"
var b = Hash.hmac(key, data)
console.log(hex.encodeToString(b))
var h = Hash.createHMAC(key)
b = h.sum(data)
console.log(hex.encodeToString(b))
h.write(data)
b = h.sum()
console.log(hex.encodeToString(b))
b = h.clone().sum()
console.log(hex.encodeToString(b))
h.reset()
b = h.sum(data)
console.log(hex.encodeToString(b))