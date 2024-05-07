
var net = require("ejs/net")
var address = ':9000'
net.dial({
    network: 'tcp',
    address: address,
    backlog: 1,
}, function (c, e) {

})

