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
var exec = require("ejs/os/exec")
// console.log(exec.runSync('./build/linux/x86_64/release/ejs', {
//     args: ['b.js'],
//     env: {
//         "KO": 123,
//         "XX": true,
//     },
//     stdout: 1,
//     // workdir: '/home/12'
// }))
console.log(exec.runSync('ls', {
    args: ['/home/king/project/cc/ejs/b.js', '-l'],
    env: {
        "KO": 123,
        "XX": true,
    },
    stdout: 1,
    workdir: '/home/',
    write: "console.log(123)\n"
}))