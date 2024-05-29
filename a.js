var sync = require("ejs/sync")
var os = require("ejs/os")
var File = os.File;
sync.go(function (co) {
    var f
    try {
        f = File.create(co, "a.txt")
        f.writeAt(co, {
            src: "ok",
            offset: 2,
        })
        f.writeAt(co, {
            src: "12",
            offset: 8,
        })

        console.log(f.truncate(co, {
            size: 128
        }))
        console.log(f instanceof os.File)
    } catch (e) {
        console.log('err', e)
        if (f) {
            f.close()
        }
    }
})
