
var net = require("ejs/net")
var address = ':9000'
var l = net.listen({
    network: 'tcp',
    address: address,
    backlog: 1,
})
console.log("listen on:", l.addr.toString())

l.onAccept = function (l, c) {
    console.log("one in", c.remoteAddr, "->", c.localAddr, c.maxWriteBytes)
    c.onWritable = function () {
        console.log("onWritable")
    }
    setInterval(function () {
        c.write("ok")
    }, 1000)
    // console.log(c.write("ok"))
}
// setTimeout(function () {
//     l.close()
// }, 10000);
// setInterval(function () {

// }, 10000);