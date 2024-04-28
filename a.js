
var net = require("ejs/net")
var IP = net.IP
var ip = IP.parse("ff02::2")
// var ip = IP.parse("127.0.0.1")
console.log(ip)
console.log(ip.toString(), ip.toString().length)

