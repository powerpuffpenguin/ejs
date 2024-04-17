// console.log("this is a.js")
// console.log("__dirname", __dirname)
// console.log("__filename", __filename)
// console.log('exports', exports)
// console.log('module', module)
// console.log('require', require.main)
// function Cat() {

// }
// function Err(code, message, options) {
//     Cat.call(this, message, options)

//     this.code = code

// }
// Err.prototype.constructor = Cat;
// var e = new Err(1, "err")
// console.log(e instanceof Err, e instanceof Cat)


const e = new Error("test", { cause: 'abc' })
console.log(e.cause)
e.message = 123
console.log(e)