var sync = require("ejs/sync")
var os = require("ejs/os")
var File = os.File
var a = new Uint8Array(128)

sync.in_thread(a)
a = a.subarray(4)
sync.in_thread(a)

sync.go(function (co) {

    var f
    try {
        f = File.create(co, {
            name: 'a.txt',
            // flags: os.O_RDWR | os.O_CREATE | os.O_EXCL,
            perm: 0o664,
        })
        f.writeAt(co, {
            src: "ok",
            offset: 2,
        })

        f.writeAt(co, {
            src: "12",
            offset: 8,
        }, function (v, e) {
            console.log(v, e, f.name())
        })
        console.log(f.stat(co))
        console.log(f instanceof os.File)
        var buf = new Uint8Array(128)
        var n = f.read(co, buf)
        console.log(n, buf.subarray(0, n))
    } catch (e) {
        console.log(e)
        console.log(e.message)
        console.log(e.toString())
        if (f) {
            f.close()
        }
    }
})
