console.log("this is a.js")
console.log("__dirname", __dirname)
console.log("__filename", __filename)
console.log('exports', exports)
console.log('module', module)
console.log('require', require.main)
// console.log(ejs)
var e = new ejs.OsError(0, "ok")
console.log(e)
console.log(e.message)
console.log(e.errnoString)