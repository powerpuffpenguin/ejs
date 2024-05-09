"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
var flags_1 = require("../flags");
exports.command = new flags_1.Command({
    use: 'timer',
    short: 'timer example',
    run: function () {
        setTimeout(function () {
            var i = 0;
            var timer = setInterval(function () {
                console.log('interval_0', i++);
                if (i == 5) {
                    clearInterval(timer);
                    timer = setInterval(function () {
                        console.log('interval_1', i++);
                    }, 1000);
                    var timeout_1 = setTimeout(function () {
                        console.log("nerver");
                    }, 10 * 1000);
                    setTimeout(function () {
                        console.log("end");
                    }, 6 * 1000);
                    setTimeout(function () {
                        clearInterval(timer);
                        clearTimeout(timeout_1);
                    }, 5.5 * 1000);
                }
            }, 0);
        }, 0);
    }
});
