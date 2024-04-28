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
            usage: 'test module match',
        });
        var func = flags.strings({
            name: 'func',
            short: 'f',
            usage: 'test func match',
        });
        var fail = flags.bool({
            name: 'fail',
            short: 'F',
            usage: 'Ignore the failure and continue with the unfinished test',
        });
        return function () {
            (0, unit_1.run)(module.value, func.value, fail.value);
        };
    },
});
