var net = require("ejs/net")
var abort = new net.AbortController()

net.dial({
    network: 'unix',
    address: '@abc',
    signal: abort.signal,
}, function (c, e) {
    console.log(c, e)
})
setTimeout(function (params) {
    abort.abort('test')
}, 0);