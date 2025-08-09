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
var crypto = require("ejs/crypto")
var AES = crypto.AES
var key = hash.MD5.sum("ok")

var plaintext = new Uint8Array(32 + 2)
for (var i = 0; i < plaintext.length; i++) {
    plaintext[i] = i
}
console.log(plaintext)
var ciphertext = new Uint8Array(plaintext.byteLength)
console.log(ciphertext)
console.log(AES.ecbEncryptTo(key, ciphertext, plaintext))
console.log(ciphertext)
console.log(hex.encodeToString(AES.ecbEncrypt(key, plaintext)))
// var Hash32 = hash.CRC32
// console.log(Hash32.sum32("abc"))
// console.log(hex.encodeToString(Hash32.sum("abc")))
// var h = new Hash32()
// h.write("a")
// console.log(h.sum32("bc"))
// console.log(hex.encodeToString(h.sum("bc")))
