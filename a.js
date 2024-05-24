var os = require("ejs/os")

os.open({
    name: "a.js"
}, function (f, e) {
    console.log(f, e)
})
