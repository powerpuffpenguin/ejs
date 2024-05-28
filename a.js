var os = require("ejs/os")
var File = os.File;

File.create("a.txt", function (f, e) {
    if (!f) {
        console.log(e)
        return
    }
    f.writeAt({
        src: "ok",
        offset: 2,
    }, function (n, e) {
        f.writeAt({
            src: "12",
            offset: 8,
        }, function (n, e) {
            console.log(n, e)
        })
    })
})
