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
// var AES = crypto.AES
// var key = hash.MD5.sum("ok")
// var iv = hash.MD5.sum("iv")


function ECB() {
    console.log('--------------ECB')
    var plaintext = new Uint8Array(32)
    for (var i = 0; i < plaintext.length; i++) {
        plaintext[i] = i
    }
    var s = hex.encodeToString(plaintext)
    console.log(s)
    var ciphertext = AES.encryptECB(key, plaintext)
    console.log(hex.encodeToString(ciphertext))
    var output = AES.decryptECB(key, ciphertext)
    console.log(hex.encodeToString(output), hex.encodeToString(output) == s)
    console.log('-----------')
    const enc = AES.ecb(key)
    const dec = enc

    ciphertext = enc.encrypt(plaintext.subarray(0, 16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
    console.log('----------')
    ciphertext = enc.encrypt(plaintext.subarray(16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
}
function CBC() {
    console.log('--------------CBC')
    var plaintext = new Uint8Array(32)
    for (var i = 0; i < plaintext.length; i++) {
        plaintext[i] = i
    }
    var s = hex.encodeToString(plaintext)
    console.log(s)
    var ciphertext = AES.encryptCBC(key, iv, plaintext)
    console.log(hex.encodeToString(ciphertext))
    var output = AES.decryptCBC(key, iv, ciphertext)
    console.log(hex.encodeToString(output), hex.encodeToString(output) == s)
    console.log('-----------')
    const enc = AES.cbc(key, iv)
    const dec = AES.cbc(key, iv)

    ciphertext = enc.encrypt(plaintext.subarray(0, 16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
    console.log('----------')
    ciphertext = enc.encrypt(plaintext.subarray(16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
}
function CFB() {
    console.log('--------------CFB')
    var plaintext = new Uint8Array(32 + 2)
    for (var i = 0; i < plaintext.length; i++) {
        plaintext[i] = i
    }
    var s = hex.encodeToString(plaintext)
    console.log(s)
    var ciphertext = AES.encryptCFB(key, iv, plaintext)
    console.log(hex.encodeToString(ciphertext))
    var output = AES.decryptCFB(key, iv, ciphertext)
    console.log(hex.encodeToString(output), hex.encodeToString(output) == s)
    console.log('-----------')
    const enc = AES.cfb(key, iv)
    const dec = AES.cfb(key, iv)

    ciphertext = enc.encrypt(plaintext.subarray(0, 16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
    console.log('----------')
    ciphertext = enc.encrypt(plaintext.subarray(16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
}
function OFB() {
    console.log('--------------OFB')
    var plaintext = new Uint8Array(32 + 2)
    for (var i = 0; i < plaintext.length; i++) {
        plaintext[i] = i
    }
    var s = hex.encodeToString(plaintext)
    console.log(s)
    var ciphertext = AES.encryptOFB(key, iv, plaintext)
    console.log(hex.encodeToString(ciphertext))
    var output = AES.decryptOFB(key, iv, ciphertext)
    console.log(hex.encodeToString(output), hex.encodeToString(output) == s)
    console.log('-----------')
    const enc = AES.ofb(key, iv)
    const dec = AES.ofb(key, iv)

    ciphertext = enc.encrypt(plaintext.subarray(0, 16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
    console.log('----------')
    ciphertext = enc.encrypt(plaintext.subarray(16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
}
function CTR() {
    console.log('--------------CTR')
    var mode = crypto.CTRMode.LITTLE_ENDIAN
    var plaintext = new Uint8Array(32 + 2)
    for (var i = 0; i < plaintext.length; i++) {
        plaintext[i] = i
    }
    var s = hex.encodeToString(plaintext)
    console.log(s)
    var ciphertext = AES.encryptCTR(key, iv, mode, plaintext)
    console.log(hex.encodeToString(ciphertext))
    var output = AES.decryptCTR(key, iv, mode, ciphertext)
    console.log(hex.encodeToString(output), hex.encodeToString(output) == s)
    console.log('-----------')
    const enc = AES.ctr(key, iv, mode)
    const dec = AES.ctr(key, iv, mode)

    ciphertext = enc.encrypt(plaintext.subarray(0, 16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
    console.log('----------')
    ciphertext = enc.encrypt(plaintext.subarray(16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
}
function GCM() {
    console.log('--------------GCM')
    var adata = 'any data'
    var tag = new Uint8Array(16)
    var plaintext = new Uint8Array(16 + 2)
    for (var i = 0; i < plaintext.length; i++) {
        plaintext[i] = i
    }
    var s = hex.encodeToString(plaintext)
    console.log(s)
    var ciphertext = AES.encryptGCM(key, iv, adata, plaintext)
    console.log(hex.encodeToString(ciphertext))
    var output = AES.decryptGCM(key, iv, adata, ciphertext)
    console.log(hex.encodeToString(output), hex.encodeToString(output) == s)
    output = AES.decryptGCM(key, iv, adata, ciphertext.subarray(0, ciphertext.byteLength - 16), ciphertext.subarray(ciphertext.byteLength - 16))
    console.log(hex.encodeToString(output), hex.encodeToString(output) == s)
    console.log('-----------')


    const enc = AES.gcm(key, iv, adata)
    const dec = enc

    ciphertext = enc.encrypt(plaintext.subarray(0, 16))
    console.log(hex.encodeToString(ciphertext))
    output = dec.decrypt(ciphertext)
    console.log(hex.encodeToString(output))
    output = dec.decrypt(ciphertext.subarray(0, ciphertext.byteLength - 16), ciphertext.subarray(ciphertext.byteLength - 16))
    console.log(hex.encodeToString(output))
}
// ECB()
// CBC()
// CFB()
// OFB()
// CTR()
// GCM()

// var Hash32 = hash.CRC32
// console.log(Hash32.sum32("abc"))
// console.log(hex.encodeToString(Hash32.sum("abc")))
// var h = new Hash32()
// h.write("a")
// console.log(h.sum32("bc"))
// console.log(hex.encodeToString(h.sum("bc")))
