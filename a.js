var net = require("ejs/net")
net.dial({
    network: 'tcp',
    address: 'ip6-localhost:9000',
}, function (c, e) {
    if (e) {
        console.log(e)
        return
    }
    console.log("ok", c)
    c.close()
})