var os = require("ejs/os")
var File = os.File;
console.log(ejs.threads())
os.stat("src/main.c", function (info, e) {
    if (!info) {
        console.log(e)
        return
    }

    console.log(info)
    console.log(info.name(), info.modTime())

    console.log(ejs.threads())
})
// File.open("src/main.c", function (f, e) {
//     if (!f) {
//         console.log(e)
//         return
//     }
//     f.stat(function (info, e) {
//         if (!info) {
//             console.log(e)
//             return
//         }

//         console.log(info)
//         console.log(info.name(), info.modTime())
//     })
// })
