// console.log('this is a.js')
// console.log('__dirname', __dirname)
// console.log('__filename', __filename)
// console.log(require('__ejs/debug'))
// console.log(require('__ejs/debug2'))

var x = setTimeout(function () {
    console.log("setTimeout cb")
});
clearTimeout(x)
// var timeout = setTimeout(function () {
//     console.log("setTimeout cb 4")
// }, 4000);


var i = 0
var interval = setInterval(function () {
    console.log("setInterval cb", i++)
}, 0);

setTimeout(function () {
    clearInterval(interval)
}, 3000);
