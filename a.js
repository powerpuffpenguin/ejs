var net = require("ejs/net")

var addr = new net.UdpAddr('127.0.0.1', 8964)
console.log(addr.toString(), addr)
// var conn = new net.UdpConn(addr)
var conn = net.UdpConn.create({

})
console.log(conn)
console.log('localAddr', conn.localAddr.toString())
console.log('write', conn.write("ok", addr))

console.log('write', conn.write("ok3", addr))
var b = new Uint8Array(5)
var remote = new net.UdpAddr('127.0.0.1', 90)
var i = 0
conn.onReadable = function (r) {

    console.log('onReadable', conn.localAddr.toString())

    console.log('------', r.read(b, remote), remote.toString())
    if (++i == 2) {
        this.close()
    }
}
// conn.onMessage = function (msg) {
//     console.log('onMessage', new TextDecoder().decode(msg))
// }
// conn.close()

