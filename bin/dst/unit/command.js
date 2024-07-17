"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.command = void 0;
var flags_1 = require("../flags");
var unit_1 = require("./unit");
require("../unit_tests/tests");
exports.command = new flags_1.Command({
    use: 'test',
    short: 'unit test',
    prepare: function (flags, _) {
        var module = flags.strings({
            name: 'module',
            short: 'm',
            usage: 'Testing matched modules',
        });
        var func = flags.strings({
            name: 'func',
            short: 'f',
            usage: 'Testing matched funcs',
        });
        var fail = flags.bool({
            name: 'allow-fail',
            short: 'a',
            usage: 'Ignore the failure and continue with the unfinished test',
        });
        var excludeModule = flags.strings({
            name: 'exclude-module',
            short: 'M',
            usage: 'Testing mismatched modules',
        });
        var excludeFunc = flags.strings({
            name: 'exclude-func',
            short: 'F',
            usage: 'Testing mismatched funcs',
        });
        return function () {
            (0, unit_1.run)({
                module: module.value,
                func: func.value,
                fail: fail.value,
                excludeModule: excludeModule.value,
                excludeFunc: excludeFunc.value,
            });
        };
    },
});
