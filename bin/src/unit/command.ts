
import { Command } from "../flags";
import { run } from "./unit";
import "../unit_tests/tests";
export const command = new Command({
    use: 'test',
    short: 'unit test',
    prepare(flags, _) {
        const module = flags.strings({
            name: 'module',
            short: 'm',
            usage: 'Testing matched modules',
        })
        const func = flags.strings({
            name: 'func',
            short: 'f',
            usage: 'Testing matched funcs',
        });
        const fail = flags.bool({
            name: 'allow-fail',
            short: 'a',
            usage: 'Ignore the failure and continue with the unfinished test',
        })
        const excludeModule = flags.strings({
            name: 'exclude-module',
            short: 'M',
            usage: 'Testing mismatched modules',
        })
        const excludeFunc = flags.strings({
            name: 'exclude-func',
            short: 'F',
            usage: 'Testing mismatched funcs',
        });
        return () => {
            run({
                module: module.value,
                func: func.value,
                fail: fail.value,
                excludeModule: excludeModule.value,
                excludeFunc: excludeFunc.value,
            })
        }
    },
})