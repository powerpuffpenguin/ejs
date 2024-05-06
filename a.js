
var net = require("ejs/net")
var address = ':9000'
var l = net.listen({
    network: 'tcp',
    address: address,
    backlog: 1,
})
console.log("listen on:", l.addr.toString())

l.onAccept = function (c) {
    console.log("one in", c.remoteAddr, "->", c.localAddr, c.maxWriteBytes)
    c.onWritable = function () {
        console.log("onWritable")
    }
    c.onError = function (e) {
        console.log(e)
    }
    // c.onMessage = function (data) {
    //     console.log(new TextDecoder().decode(data))
    // }
    var b = new Uint8Array(1024)
    c.onReadable = function (r) {
        var n = r.copy(b, 2)
        console.log(r.length, n)
        console.log(new TextDecoder().decode(b.subarray(0, n)))
        r.drain(n + 2)
    }
    var i = 0
    var timer = setInterval(function () {
        if (c.isClosed) {
            clearInterval(timer)
            return
        }
        c.write("ok" + i + "中文測試abc")
        i++
    }, 1000)
    // console.log(c.write("ok"))
}
// setTimeout(function () {
//     l.close()
// }, 10000);
// setInterval(function () {

// }, 10000);