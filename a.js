var sync = require("ejs/sync")
var os = require("ejs/os")

var File = os.File;
sync.go(function (co) {
    var f
    try {
        // f = File.createTemp(co, {
        //     pattern: "test*.log",
        //     dir: '',
        // })
        os.rmdir(co, { name: 'c.txt', all: true })
        // f = File.openFile(co, {
        //     name: 'a.txt',
        //     flags: os.O_RDWR | os.O_CREATE | os.O_EXCL,
        //     perm: 0o664,
        // })
        // f = File.create(co, "a.txt")
        // console.log(f)
        // f.writeAt(co, {
        //     src: "ok",
        //     offset: 2,
        // })
        // f.writeAt(co, {
        //     src: "12",
        //     offset: 8,
        // })

        // console.log(f.stat(co))
        // console.log(f instanceof os.File)
        // var buf = new Uint8Array(128)
        // var n = f.read(co, buf)
        // console.log(n, buf.subarray(0, n))
    } catch (e) {
        console.log('err', e, e.toString())
        if (f) {
            f.close()
        }
    }
})
// var b = os.readFileSync("a.txt")
// console.log(b.subarray(2))
// console.log(b instanceof Uint8Array)
