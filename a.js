
var net = require("ejs/net")
// var address = 'localhost:9000'
// net.dial({
//     network: 'tcp',
//     address: address,
//     // timeout: 1000,
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

var resolver = new net.Resolver({
    // system: true,
    nameserver: ['8.8.8.8'],
})
// var req = resolver.resolve({
//     name: 'www.baidu.com',
//     // name: 'localhost',
//     // v6: true,
// }, function (ip, e) {
//     console.log(ip, e)
// })
// // req.cancel()
// // resolver.close()
