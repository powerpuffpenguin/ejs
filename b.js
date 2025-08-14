// function version(x) {
//     var z = x % 100
//     x -= z
//     x /= 100

//     y = x % 100
//     x -= y
//     x /= 100

//     return x + '.' + y + '.' + z
// }
// console.log(__dirname)
// console.log(__filename)
// console.log(ejs.os, ejs.arch)
// console.log('gcc:', ejs.gcc)
// console.log('ejs:', version(ejs.version))
// console.log('duk:', version(Duktape.version), Duktape.env)
var os = require("ejs/os")
console.log(os.environ())
console.log(os.getenv("KO"))
console.log(os.getenv("XX"))
console.log(os.cwd())