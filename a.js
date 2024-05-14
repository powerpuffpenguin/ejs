var net = require("ejs/net")

var l = net.listen({
    network: 'unix',
    address: '@abc',
    sync: true,
})
console.log("listen on", l.addr)

l.onError = function (e) {
    console.log(e)
}
l.onAccept = function (c) {
    console.log('remoteAddr:' + c.remoteAddr, ' localAddr:' + c.localAddr)
    c.close()
    // l.close()
}

// setTimeout(function () {
//     console.log('close')
//     l.close()
// }, 100)
// l.close()