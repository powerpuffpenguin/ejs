var os = require("ejs/os")
var File = os.File;

File.open("src/main.c", function (f, e) {
    if (!f) {
        console.log(e)
        return
    }

    var buf = new Uint8Array(10);
    f.readAt({
        dst: buf,
        offset: 2,
    }, function (n, e) {
        console.log(new TextDecoder().decode(buf.subarray(0, n)))
        f.readAt({
            dst: buf,
            offset: 4,
        }, function (n, e) {
            console.log(new TextDecoder().decode(buf.subarray(0, n)))
        })
    })

})
