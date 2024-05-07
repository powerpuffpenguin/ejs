
var net = require("ejs/net")
// var address = 'ip6-localhost:9000'
// net.dial({
//     network: 'tcp',
//     address: address,
//     timeout: 1000,
// }, function (c, e) {
//     if (!c) {
//         console.log(e)
//         return
//     }
//     console.log(c)
//     c.onMessage = function (s) {
//         console.log(new TextDecoder().decode(s))
//         c.close()
//     }
//     c.write('123')
// })

var resolver = new net.Resolver()
console.log(resolver)