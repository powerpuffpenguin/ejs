var net = require("ejs/net")

var addr = new net.UdpAddr('127.0.0.1', 8964)
console.log(addr.toString(), addr)
// var conn = new net.UdpConn(addr)
var conn = net.UdpConn.create({
    network: 'udp4'
})
conn.bind(new net.UdpAddr('127.0.0.1', 8963))

console.log(conn, addr)
conn.connect(addr)
// conn.connect(new net.UdpAddr('::', 8964))
console.log('localAddr', conn.localAddr.toString(), "remoteAddr", conn.remoteAddr.toString())
console.log('write', conn.writeTo("ok", addr))

// console.log('write', conn.writeTo("ok3", addr))
var b = new Uint8Array(1024)
var remote = new net.UdpAddr('127.0.0.1', 90)
var i = 0
conn.onReadable = function (r) {

    console.log('onReadable', conn.localAddr.toString())
    var n = r.read(b, remote)
    console.log('------', n, remote.toString(), new TextDecoder().decode(b.subarray(0, n)))
    // if (++i == 2) {
    //     this.close()
    // }
}
// conn.onMessage = function (msg) {
//     console.log('onMessage', new TextDecoder().decode(msg))
// }
// conn.close()

