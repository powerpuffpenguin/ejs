// var i = 0
// var x = setTimeout(function () {
//     var timer = setInterval(function () {
//         console.log('interval_0', i++)
//         if (i == 5) {
//             clearInterval(timer)
//         }
//     }, 0)
// }, 0)
var net = require("ejs/net")
var c = new net.AbortController()
const s = c.signal
console.log(c, s)

var f = function (r) {
    console.log('----- onabort1', this._abort)
}
// s.onabort = f
s.addEventListener(f)
s.addEventListener(f)
// s.removeEventListener("abort", f)
console.log(s.reason, s.aborted)

c.abort("abc")
console.log(s.reason, s.aborted)
c.abort("def")

