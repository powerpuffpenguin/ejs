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
// console.log(exec.runSync('node', {
//     // args: ['nodejs', '-l'],
//     stdin: 2,
//     stdout: 3,
//     stderr: 3,
//     write: "console.log(123);\nconsole.log(1+2)"
// }))
// console.log(exec.runSync('./build/linux/x86_64/release/ejs', {
//     args: ['/home/king/project/cc/ejs/b.js', '-l'],
//     env: {
//         "KO": '123',
//     },
//     // stdin: 2,
//     // stdout: 3,
//     // stderr: 3,
//     workdir: '/home/',
//     // write: "console.log(123)\n"
// }))
var cmd = new exec.Command('node', {
    env: {
        "KO": '123',
    },
    stdin: 2,
    // stdout: 3,
    // stderr: 3,
    workdir: '/home/',
})



// var cmd = new exec.Command('ls', {
//     args: ['/home/king/project/cc/ejs/b.js', '-l'],
//     env: {
//         "KO": '123',
//     },
//     // stdin: 2,
//     stdout: 3,
//     stderr: 3,
//     workdir: '/home/',
//     // write: "console.log(123)\n"
// })
var i = 0
// cmd.stdout.onMessage = function (data) {
//     console.log(new TextDecoder().decode(data))
//     if (++i == 5) {
//         cmd.close()
//     }
// }
// cmd.stdout.onClose = function (e) {
//     console.log("onClose", e === undefined ? e : e.toString())
// }

cmd.run(function (exit, e) {
    console.log(exit, e === undefined ? e : e.toString())
})

console.log('write:', cmd.stdin.write("console.log(123);\nconsole.log(1+2)"))
cmd.stdin.onWritable = function () {
    cmd.stdin.close()
}
cmd.stdin.onClose = function (e) {
    console.log("onClose", e)
}
