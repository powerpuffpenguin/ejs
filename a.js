var net = require("ejs/net")
// net.test()
var l = net.listen({
    network: 'tcp',
    address: ':9000',
    sync: true,
})
console.log("listen on", l.addr)

l.onError = function (e) {
    console.log(e)
}
l.onAccept = function (c) {
    console.log(c)
    c.close()
    l.close()
}
