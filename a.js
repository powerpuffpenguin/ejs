var sync = require("ejs/sync")
var net = require("ejs/net")
var os = require("ejs/os")


const resolver = net.Resolver.getDefault()
resolver.resolve({
    name: "www.baidu.com",
    v6: false,
}, function (v, e) {
    console.log(v, e)

    // resolver.close()
})

// var File = os.File

// var a = new net.UdpAddr('1.2.3.4', 90)
// var b4 = new net.UdpAddr('12.2.3.4', 80)
// var b = new net.UdpAddr('::', 12345)
// console.log(b, b.toString())

// a.copyFrom(b4)
// console.log(a, a.toString())
// a.copyFrom(b)
// console.log(a, a.toString())


// sync.go(function (co) {

//     var f
//     try {
//         f = File.create(co, {
//             name: 'a.txt',
//             // flags: os.O_RDWR | os.O_CREATE | os.O_EXCL,
//             perm: 0o664,
//         })
//         f.writeAt(co, {
//             src: "ok",
//             offset: 2,
//         })

//         f.writeAt(co, {
//             src: "12",
//             offset: 8,
//         }, function (v, e) {
//             console.log(v, e, f.name())
//         })
//         console.log(f.stat(co))
//         console.log(f instanceof os.File)
//         var buf = new Uint8Array(128)
//         var n = f.read(co, buf)
//         console.log(n, buf.subarray(0, n))
//     } catch (e) {
//         console.log(e)
//         console.log(e.message)
//         console.log(e.toString())
//         if (f) {
//             f.close()
//         }
//     }
// })
