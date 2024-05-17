var net = require("ejs/net")

var l = net.UdpConn.listen({
    address: ':11223',
})
var buf = new Uint8Array(1024 * 32)
var addr = new net.UdpAddr()
l.onReadable = function (r) {
    var n = r.read(buf, addr)
    this.writeTo(buf.subarray(0, n), addr)
    l.close()
}


var c = net.UdpConn.dial({
    address: ':11223',
})
c.write('ok')
// c.write('ok 456')
var decoder = new TextDecoder()
c.onMessage = function (msg) {
    console.log(this.localAddr.toString(), this.remoteAddr.toString())
    console.log("recv", msg, decoder.decode(msg))
    c.close()
}
