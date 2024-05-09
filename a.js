var i = 0
var x = setTimeout(function () {
    var timer = setInterval(function () {
        console.log('interval_0', i++)
        if (i == 5) {
            clearInterval(timer)
        }
    }, 0)
}, 0)

