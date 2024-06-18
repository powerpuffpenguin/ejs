var sync = require("ejs/sync")
function fibonacciCo(co, n) {
    for (var i = 0; i < 4000; i++) {
        console.log('yield', i)
        co.yield(function (notify) {
            // console.log('notify', i)
            // notify.value(n)

            setImmediate(function () {
                console.log('notify', i)
                notify.value(n)
            })
        })
    }
    // if (n < 2) {
    //     return co.yield(function (notify) {
    //         notify.value(n)
    //         // setImmediate(function () {
    //         // notify.value(n)
    //         // })
    //     })
    // }
    // return fibonacciCo(co, n - 1) + fibonacciCo(co, n - 2)
}
sync.go(function (co) {
    try {
        var v = fibonacciCo(co, 17)
        console.log(v)
    } catch (e) {
        console.log('err xx', e.toString())
    }
})
// var os = require("ejs/os")
// require("./b")
// console.log('return 0', ejs.next(function () {
//     console.log('0')
//     console.log('return 1', ejs.next(function () {
//         console.log('1')
//     }))
//     console.log('return 2', ejs.next(function () {
//         console.log('2')
//         console.log('return 3', ejs.next(function () {
//             console.log('3')
//         }))
//     }))
// }))

// console.log(setTimeout(function () {

// }, 1))
// var File = os.File;
// sync.go(function (co) {
//     var f
//     try {
//         // const e = new os.LinkError({
//         //     op: "ab",
//         //     from: "a",
//         //     to: "x",
//         //     err: new Error("456")
//         // })
//         // console.log(e instanceof os.LinkError, e instanceof os.OsError)
//         // console.log(e.toString())
//         // console.log(e.message)
//         // f = File.openFile(co, {
//         //     name: 'a.txt',
//         //     flags: os.O_RDWR | os.O_CREATE | os.O_EXCL,
//         //     perm: 0o664,
//         // })
//         f = os.mkdirTemp(co, {
//             pattern: "test_*.log",
//             // dir: '/'
//             dir: ''
//         })
//         // f = File.createTempSync({
//         //     pattern: "test_*.log",
//         //     // dir: '/'
//         //     dir: '.'
//         // })
//         console.log(f)
//         // f.writeAt(co, {
//         //     src: "ok",
//         //     offset: 2,
//         // })

//         // f.writeAt({
//         //     src: "12",
//         //     offset: 8,
//         // }, function (v, e) {
//         //     console.log(v, e, f.name())
//         // })
//         // console.log(f.stat(co))
//         // console.log(f instanceof os.File)
//         // var buf = new Uint8Array(128)
//         // var n = f.read(co, buf)
//         // console.log(n, buf.subarray(0, n))
//     } catch (e) {
//         console.log(e)
//         console.log(e.message)
//         console.log(e.toString())
//         if (f) {
//             f.close()
//         }
//     }
// })
// var b = os.readFileSync("a.txt")
// console.log(b.subarray(2))
// console.log(b instanceof Uint8Array)
