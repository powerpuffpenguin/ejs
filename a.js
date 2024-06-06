var sync = require("ejs/sync")
var os = require("ejs/os")

var File = os.File;
sync.go(function (co) {
    var f
    try {
        f = File.open(co, "src")
        f.readDirNames(function (items, e) {
            if (e) {
                console.log(e)
                return
            }
            for (var i = 0; i < items.length; i++) {
                var item = items[i]
                console.log(item)
            }
        })

        // const e = new os.LinkError({
        //     op: "ab",
        //     from: "a",
        //     to: "x",
        //     err: new Error("456")
        // })
        // console.log(e instanceof os.LinkError, e instanceof os.OsError)
        // console.log(e.toString())
        // console.log(e.message)
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
        console.log(e)
        console.log(e.message)
        console.log(e.toString())
        if (f) {
            f.close()
        }
    }
})
// var b = os.readFileSync("a.txt")
// console.log(b.subarray(2))
// console.log(b instanceof Uint8Array)
