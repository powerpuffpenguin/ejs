"use strict";
var __extends = (this && this.__extends) || (function () {
    var extendStatics = function (d, b) {
        extendStatics = Object.setPrototypeOf ||
            ({ __proto__: [] } instanceof Array && function (d, b) { d.__proto__ = b; }) ||
            function (d, b) { for (var p in b) if (Object.prototype.hasOwnProperty.call(b, p)) d[p] = b[p]; };
        return extendStatics(d, b);
    };
    return function (d, b) {
        if (typeof b !== "function" && b !== null)
            throw new TypeError("Class extends value " + String(b) + " is not a constructor or null");
        extendStatics(d, b);
        function __() { this.constructor = d; }
        d.prototype = b === null ? Object.create(b) : (__.prototype = b.prototype, new __());
    };
})();
var __values = (this && this.__values) || function(o) {
    var s = typeof Symbol === "function" && Symbol.iterator, m = s && o[s], i = 0;
    if (m) return m.call(o);
    if (o && typeof o.length === "number") return {
        next: function () {
            if (o && i >= o.length) o = void 0;
            return { value: o && o[i++], done: !o };
        }
    };
    throw new TypeError(s ? "Object is not iterable." : "Symbol.iterator is not defined.");
};
var __read = (this && this.__read) || function (o, n) {
    var m = typeof Symbol === "function" && o[Symbol.iterator];
    if (!m) return o;
    var i = m.call(o), r, ar = [], e;
    try {
        while ((n === void 0 || n-- > 0) && !(r = i.next()).done) ar.push(r.value);
    }
    catch (error) { e = { error: error }; }
    finally {
        try {
            if (r && !r.done && (m = i["return"])) m.call(i);
        }
        finally { if (e) throw e.error; }
    }
    return ar;
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Parser = exports.FlagBooleans = exports.FlagBoolean = exports.FlagBigints = exports.FlagBigint = exports.FlagNumbers = exports.FlagNumber = exports.FlagStrings = exports.FlagString = exports.FlagBase = exports.Flags = exports.Command = exports.FlagsException = void 0;
var FlagsException = /** @class */ (function (_super) {
    __extends(FlagsException, _super);
    function FlagsException(message) {
        return _super.call(this, message) || this;
    }
    return FlagsException;
}(Error));
exports.FlagsException = FlagsException;
var minpad = 8;
var matchUse = new RegExp(/^[a-zA-Z][a-zA-Z0-9\-_\.]*$/);
var matchFlagShort = new RegExp(/^[a-zA-Z0-9]$/);
function isShortFlag(v) {
    if (v.length != 1) {
        return false;
    }
    var c = v.codePointAt(0);
    return c !== undefined && c < 128 && c > 0;
}
function compareString(l, r) {
    if (l == r) {
        return 0;
    }
    return l < r ? -1 : 1;
}
/**
 * Represents a command or subcommand
 */
var Command = /** @class */ (function () {
    function Command(opts) {
        this.opts = opts;
        /**
         * parameters not matched
         */
        this.args = new Array();
        if (!matchUse.test(opts.use)) {
            throw new FlagsException("use invalid: ".concat(opts.use));
        }
        var short = opts.short;
        if (short !== undefined && short.indexOf("\n") != -1) {
            throw new FlagsException("short invalid: ".concat(short));
        }
        this.flags_ = Flags.make(this);
    }
    /**
     * Add subcommands to commands
     * @param cmds
     */
    Command.prototype.add = function () {
        var e_1, _a;
        var cmds = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            cmds[_i] = arguments[_i];
        }
        if (cmds.length == 0) {
            return;
        }
        var children = this.children_;
        if (!children) {
            children = new Map();
            this.children_ = children;
        }
        try {
            for (var cmds_1 = __values(cmds), cmds_1_1 = cmds_1.next(); !cmds_1_1.done; cmds_1_1 = cmds_1.next()) {
                var cmd = cmds_1_1.value;
                if (cmd.parent_) {
                    throw new FlagsException("command \"".concat(cmd.opts.use, "\" already added to \"").concat(cmd.parent_.flags().use, "\""));
                }
                var opts = cmd.opts;
                if (opts.prepare) {
                    var run = opts.prepare(cmd.flags(), cmd);
                    if (run) {
                        opts.run = run;
                    }
                }
                var key = opts.use;
                if (children.has(key)) {
                    throw new FlagsException("command \"".concat(key, "\" already exists"));
                }
                else {
                    cmd.parent_ = this;
                    cmd.flags();
                    children.set(key, cmd);
                }
            }
        }
        catch (e_1_1) { e_1 = { error: e_1_1 }; }
        finally {
            try {
                if (cmds_1_1 && !cmds_1_1.done && (_a = cmds_1.return)) _a.call(cmds_1);
            }
            finally { if (e_1) throw e_1.error; }
        }
    };
    /**
     * Returns the {@link Flags} associated with the command
     */
    Command.prototype.flags = function () {
        return this.flags_;
    };
    /**
     * @internal
     */
    Command.prototype.parse = function (args, opts) {
        if (opts === undefined) {
            opts = {};
        }
        this._parse(args, 0, args.length, opts);
    };
    Command.prototype._parse = function (args, start, end, opts) {
        // 重置解析狀態，以免多次解析緩存了上次的解析結果
        this.args.splice(0);
        var flags = this.flags();
        flags.reset();
        if (end - start < 1) {
            var run_1 = this.opts.run;
            if (run_1) {
                run_1(this.args, this);
            }
            return;
        }
        // 解析子命令和參數
        var children = this.children_;
        for (var i = start; i < end; i++) {
            var arg = args[i];
            if (arg == "-" || arg == "--") {
                if (opts.unknowFlags) {
                    continue;
                }
                throw new FlagsException("unknown flag in ".concat(flags.use, ": ").concat(arg));
            }
            if (arg.startsWith("-")) { // 解析參數
                // 解析內置特定參數
                if (arg == "-h") {
                    this._print();
                    return;
                }
                // 解析用戶定義參數
                var val = i + 1 < end ? args[i + 1] : undefined;
                if (arg.startsWith("--")) {
                    // 解析長參數
                    if (arg == "--help") {
                        var h = this._parseHelp(flags, "--help", val);
                        if (h == -1) {
                            this._print();
                            return;
                        }
                        i += h;
                        continue;
                    }
                    i += this._parseLong(flags, arg.substring(2), val, opts);
                }
                else {
                    // 解析短參數
                    if (arg == "-h") {
                        var h_1 = this._parseHelp(flags, "-h", val);
                        if (h_1 == -1) {
                            this._print();
                            return;
                        }
                        i += h_1;
                        continue;
                    }
                    var h = this._parseShort(flags, arg.substring(1), val, opts);
                    if (h == -1) { //help
                        this._print();
                        return;
                    }
                    i += h;
                }
            }
            else if (children) { // 解析子命令
                var sub = children.get(arg);
                if (sub) {
                    sub._parse(args, i + 1, end, opts);
                    return;
                }
                else {
                    if (opts.unknowCommand) {
                        return;
                    }
                    throw new FlagsException("unknow commnad <" + arg + ">");
                }
            }
            else { // 沒有子命令才允許傳入 args
                this.args.push(arg);
            }
        }
        var run = this.opts.run;
        if (run) {
            run(this.args, this);
        }
    };
    Command.prototype._throw = function (flags, flag, arg, val) {
        if (val === undefined && !flag.isBool()) {
            throw new FlagsException("flag in ".concat(flags.use, " needs an argument: ").concat(arg));
        }
        if (val === undefined) {
            val = "";
        }
        else {
            val = " ".concat(val);
        }
        throw new FlagsException("invalid flag value in ".concat(flags.use, ": ").concat(arg).concat(val));
    };
    Command.prototype._parseHelp = function (flags, arg, val) {
        if (val === undefined || val === "true") {
            return -1;
        }
        else if (val === "false") {
            return 1;
        }
        if (val === undefined) {
            throw new FlagsException("flag in ".concat(flags.use, " needs an argument: ").concat(arg));
        }
        if (val === undefined) {
            val = "";
        }
        else {
            val = " ".concat(val);
        }
        throw new FlagsException("invalid flag value in ".concat(flags.use, ": ").concat(arg).concat(val));
    };
    Command.prototype._parseShortOne = function (flags, arg, val, opts) {
        if (arg == "h") {
            return this._parseHelp(flags, "-".concat(arg), val);
        }
        var flag = flags.find(arg, true);
        if (!flag) {
            if (opts.unknowFlags) {
                return 1;
            }
            throw new FlagsException("unknown flag in ".concat(flags.use, ": -").concat(arg));
        }
        if (flag.isBool()) {
            if (val !== "false" && val !== "true") {
                val = undefined;
            }
        }
        if (flag.add(val)) {
            return val === undefined ? 0 : 1;
        }
        this._throw(flags, flag, "-".concat(arg), val);
    };
    Command.prototype._parseShort2 = function (flags, arg, val, opts) {
        if (arg == "h") {
            var v = this._parseHelp(flags, "-h", val);
            return v == -1 ? v : 0;
        }
        var flag = flags.find(arg, true);
        if (!flag) {
            if (opts.unknowFlags) {
                return 0;
            }
            throw new FlagsException("unknown flag in ".concat(flags.use, ": -").concat(arg));
        }
        if (flag.add(val)) {
            return 0;
        }
        this._throw(flags, flag, "-".concat(arg), val);
    };
    Command.prototype._parseShort = function (flags, arg, nextVal, opts) {
        switch (arg.length) {
            case 0:
                if (opts.unknowFlags) {
                    return 0;
                }
                throw new FlagsException("unknown flag in ".concat(flags.use, ": -").concat(arg));
            case 1:
                return this._parseShortOne(flags, arg, nextVal, opts);
        }
        if (arg[1] == "=") {
            return this._parseShort2(flags, arg[0], arg.substring(2), opts);
        }
        var name = arg[0];
        var flag = flags.find(name, true);
        if (!flag) {
            if (opts.unknowFlags) {
                return 0;
            }
            throw new FlagsException("unknown flag in ".concat(flags.use, ": -").concat(name));
        }
        else if (!flag.isBool()) {
            return this._parseShort2(flags, arg[0], arg.substring(1), opts);
        }
        if (flag.add(undefined)) {
            return this._parseShort(flags, arg.substring(1), nextVal, opts);
        }
        throw new FlagsException("invalid flag value in ".concat(flags.use, ": ").concat(name));
    };
    Command.prototype._parseLong = function (flags, arg, val, opts) {
        var found = arg.indexOf("=");
        var name;
        var next = false;
        if (found == -1) {
            name = arg;
            next = true;
        }
        else {
            name = arg.substring(0, found);
            val = arg.substring(found + 1);
        }
        var flag = flags.find(name);
        if (!flag) {
            if (opts.unknowFlags) {
                return next ? 1 : 0;
            }
            throw new FlagsException("unknown flag in ".concat(flags.use, ": --").concat(name));
        }
        if (next && flag.isBool()) {
            if (val !== "false" && val !== "true") {
                next = false;
                val = undefined;
            }
        }
        if (flag.add(val)) {
            return next ? 1 : 0;
        }
        this._throw(flags, flag, "--".concat(name), val);
    };
    Command.prototype._print = function () {
        console.log(this.toString());
    };
    /**
     * Get the description string of command usage
     */
    Command.prototype.toString = function () {
        var e_2, _a, e_3, _b, e_4, _c, e_5, _d;
        var _e, _f, _g;
        var opts = this.opts;
        var use = this.flags().use;
        var strs = new Array();
        var long = (_e = opts.long) !== null && _e !== void 0 ? _e : "";
        var short = (_f = opts.short) !== null && _f !== void 0 ? _f : "";
        if (long == "") {
            if (short != "") {
                strs.push(short);
            }
        }
        else {
            strs.push(long);
        }
        if (strs.length == 0) {
            strs.push("Usage:");
        }
        else {
            strs.push("\nUsage:");
        }
        strs.push("  ".concat(use, " [flags]"));
        var children = this.children_;
        if (children) {
            strs.push("  ".concat(use, " [command]\n\nAvailable Commands:"));
            var arrs = new Array();
            var pad = 0;
            try {
                for (var _h = __values(children.values()), _j = _h.next(); !_j.done; _j = _h.next()) {
                    var v = _j.value;
                    var len = (_g = v.opts.use.length) !== null && _g !== void 0 ? _g : 0;
                    if (len > pad) {
                        pad = len;
                    }
                    arrs.push(v);
                }
            }
            catch (e_2_1) { e_2 = { error: e_2_1 }; }
            finally {
                try {
                    if (_j && !_j.done && (_a = _h.return)) _a.call(_h);
                }
                finally { if (e_2) throw e_2.error; }
            }
            pad += 3;
            if (pad < minpad) {
                pad = minpad;
            }
            arrs.sort(function (l, r) { return compareString(l.opts.use, r.opts.use); });
            try {
                for (var arrs_1 = __values(arrs), arrs_1_1 = arrs_1.next(); !arrs_1_1.done; arrs_1_1 = arrs_1.next()) {
                    var child = arrs_1_1.value;
                    var opts_1 = child.opts;
                    strs.push("  ".concat(opts_1.use.padEnd(pad)).concat(opts_1.short));
                }
            }
            catch (e_3_1) { e_3 = { error: e_3_1 }; }
            finally {
                try {
                    if (arrs_1_1 && !arrs_1_1.done && (_b = arrs_1.return)) _b.call(arrs_1);
                }
                finally { if (e_3) throw e_3.error; }
            }
        }
        var flags = this.flags();
        var sp = 1;
        var lp = 4;
        try {
            for (var flags_1 = __values(flags), flags_1_1 = flags_1.next(); !flags_1_1.done; flags_1_1 = flags_1.next()) {
                var f = flags_1_1.value;
                if (sp < f.short.length) {
                    sp = f.short.length;
                }
                if (lp < f.name.length) {
                    lp = f.name.length;
                }
            }
        }
        catch (e_4_1) { e_4 = { error: e_4_1 }; }
        finally {
            try {
                if (flags_1_1 && !flags_1_1.done && (_c = flags_1.return)) _c.call(flags_1);
            }
            finally { if (e_4) throw e_4.error; }
        }
        if (lp < minpad) {
            lp = minpad;
        }
        strs.push("\nFlags:\n  -".concat("h".padEnd(sp), ", --").concat("help".padEnd(lp), "   help for ").concat(opts.use));
        try {
            for (var flags_2 = __values(flags), flags_2_1 = flags_2.next(); !flags_2_1.done; flags_2_1 = flags_2.next()) {
                var f = flags_2_1.value;
                var s = "";
                var str = f.defaultString();
                if (str != "") {
                    s += " " + str;
                }
                str = f.valuesString();
                if (str != "") {
                    s += " " + str;
                }
                if (f.short == "") {
                    strs.push("   ".concat("".padEnd(sp), "  --").concat(f.name.toString().padEnd(lp), "   ").concat(f.usage).concat(s));
                }
                else {
                    strs.push("  -".concat(f.short.toString().padEnd(sp), ", --").concat(f.name.toString().padEnd(lp), "   ").concat(f.usage).concat(s));
                }
            }
        }
        catch (e_5_1) { e_5 = { error: e_5_1 }; }
        finally {
            try {
                if (flags_2_1 && !flags_2_1.done && (_d = flags_2.return)) _d.call(flags_2);
            }
            finally { if (e_5) throw e_5.error; }
        }
        if (children) {
            strs.push("\nUse \"".concat(use, " [command] --help\" for more information about a command."));
        }
        return strs.join("\n");
    };
    /**
     * Use console.log output usage
     */
    Command.prototype.print = function () {
        console.log(this.toString());
    };
    /**
     * return parent command
     */
    Command.prototype.parent = function () {
        return this.parent_;
    };
    return Command;
}());
exports.Command = Command;
/**
 * Flags definition and parse
 */
var Flags = /** @class */ (function () {
    function Flags(cmd) {
        this.cmd = cmd;
    }
    /**
    * @internal
    */
    Flags.make = function (cmd) {
        return new Flags(cmd);
    };
    Object.defineProperty(Flags.prototype, "use", {
        /**
         * @internal
         */
        get: function () {
            var cmd = this.cmd;
            var parent = cmd.parent();
            var use = cmd.opts.use;
            while (parent) {
                use = "".concat(parent.opts.use, " ").concat(use);
                parent = parent.parent();
            }
            return use;
        },
        enumerable: false,
        configurable: true
    });
    /**
     * @internal
     */
    Flags.prototype.find = function (name, short) {
        var _a, _b;
        if (short === void 0) { short = false; }
        return short ? (_a = this.short_) === null || _a === void 0 ? void 0 : _a.get(name) : (_b = this.long_) === null || _b === void 0 ? void 0 : _b.get(name);
    };
    Flags.prototype._getArrs = function () {
        var e_6, _a;
        var keys = this.long_;
        if (!keys) {
            return;
        }
        var arrs = this.arrs_;
        if (!arrs || arrs.length != keys.size) {
            arrs = [];
            try {
                for (var _b = __values(keys.values()), _c = _b.next(); !_c.done; _c = _b.next()) {
                    var f = _c.value;
                    arrs.push(f);
                }
            }
            catch (e_6_1) { e_6 = { error: e_6_1 }; }
            finally {
                try {
                    if (_c && !_c.done && (_a = _b.return)) _a.call(_b);
                }
                finally { if (e_6) throw e_6.error; }
            }
            arrs.sort(function (l, r) { return compareString(l.name, r.name); });
        }
        return arrs;
    };
    /**
     * @internal
     */
    Flags.prototype.iterator = function () {
        var arrs = this._getArrs();
        var i = 0;
        return {
            next: function () {
                if (arrs && i < arrs.length) {
                    return { value: arrs[i++] };
                }
                return { done: true };
            },
        };
    };
    /**
     * @internal
     */
    Flags.prototype[Symbol.iterator] = function () {
        return this.iterator();
    };
    /**
     * @internal
     */
    Flags.prototype.reset = function () {
        var _a;
        (_a = this.long_) === null || _a === void 0 ? void 0 : _a.forEach(function (f) {
            f.reset();
        });
    };
    /**
     * Define flags
     */
    Flags.prototype.add = function () {
        var e_7, _a;
        var flags = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            flags[_i] = arguments[_i];
        }
        if (flags.length == 0) {
            return;
        }
        var kl = this.long_;
        if (!kl) {
            kl = new Map();
            this.long_ = kl;
        }
        var ks = this.short_;
        if (!ks) {
            ks = new Map();
            this.short_ = ks;
        }
        try {
            for (var flags_3 = __values(flags), flags_3_1 = flags_3.next(); !flags_3_1.done; flags_3_1 = flags_3.next()) {
                var f = flags_3_1.value;
                var name_1 = f.name;
                if (kl.has(name_1)) {
                    throw new FlagsException("".concat(this.use, " flag redefined: ").concat(name_1));
                }
                var short = f.short;
                if (short !== "") {
                    var found = ks.get(short);
                    if (found) {
                        throw new FlagsException("unable to redefine '".concat(short, "' shorthand in \"").concat(this.use, "\" flagset: it's already used for \"").concat(found.name, "\" flag"));
                    }
                    if (!isShortFlag(short)) {
                        throw new FlagsException("\"".concat(short, "\" shorthand in \"").concat(this.use, " is more than one ASCII character"));
                    }
                    ks.set(short, f);
                }
                kl.set(name_1, f);
            }
        }
        catch (e_7_1) { e_7 = { error: e_7_1 }; }
        finally {
            try {
                if (flags_3_1 && !flags_3_1.done && (_a = flags_3.return)) _a.call(flags_3);
            }
            finally { if (e_7) throw e_7.error; }
        }
    };
    /**
     * Define a flag of type string
     */
    Flags.prototype.string = function (opts) {
        var f = new FlagString(opts);
        this.add(f);
        return f;
    };
    /**
     * Define a flag of type Array<string>
     */
    Flags.prototype.strings = function (opts) {
        var f = new FlagStrings(opts);
        this.add(f);
        return f;
    };
    /**
     * Define a flag of type number
     */
    Flags.prototype.number = function (opts) {
        var f = new FlagNumber(opts);
        this.add(f);
        return f;
    };
    /**
     * Define a flag of type Array<number>
     */
    Flags.prototype.numbers = function (opts) {
        var f = new FlagNumbers(opts);
        this.add(f);
        return f;
    };
    /**
     * Define a flag of type bigint
     */
    Flags.prototype.bigint = function (opts) {
        var f = new FlagBigint(opts);
        this.add(f);
        return f;
    };
    /**
     * Define a flag of type Array<bigint>
     */
    Flags.prototype.bigints = function (opts) {
        var f = new FlagBigints(opts);
        this.add(f);
        return f;
    };
    /**
     * Define a flag of type boolean
     */
    Flags.prototype.bool = function (opts) {
        var f = new FlagBoolean(opts);
        this.add(f);
        return f;
    };
    /**
     * Define a flag of type Array<boolean>
     */
    Flags.prototype.bools = function (opts) {
        var f = new FlagBooleans(opts);
        this.add(f);
        return f;
    };
    return Flags;
}());
exports.Flags = Flags;
/**
 * A base class provides some common methods for the class flag
 */
var FlagBase = /** @class */ (function () {
    function FlagBase(opts) {
        this.opts = opts;
        if (opts.short !== undefined &&
            opts.short !== "" &&
            !matchFlagShort.test(opts.short)) {
            throw new FlagsException("\"".concat(opts.short, "\" shorthand should match \"^[a-zA-Z0-9]$\""));
        }
        if (!matchUse.test(opts.name)) {
            throw new FlagsException("\"".concat(opts.name, "\" flag should match \"^[a-zA-Z][a-zA-Z0-9\\-_\\.]*$\""));
        }
        if (opts.usage !== undefined && opts.usage.indexOf("\n") != -1) {
            throw new FlagsException("flag usage invalid: ".concat(opts.usage));
        }
        if (Array.isArray(opts.default)) {
            var a = Array.from(opts.default);
            this.value_ = a;
        }
        else {
            this.value_ = opts.default;
        }
    }
    Object.defineProperty(FlagBase.prototype, "value", {
        get: function () {
            return this.value_;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagBase.prototype, "short", {
        get: function () {
            var _a;
            return (_a = this.opts.short) !== null && _a !== void 0 ? _a : "";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagBase.prototype, "name", {
        get: function () {
            return this.opts.name;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagBase.prototype, "default", {
        get: function () {
            return this.opts.default;
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagBase.prototype, "usage", {
        get: function () {
            var _a;
            return (_a = this.opts.usage) !== null && _a !== void 0 ? _a : "";
        },
        enumerable: false,
        configurable: true
    });
    Object.defineProperty(FlagBase.prototype, "values", {
        get: function () {
            return this.opts.values;
        },
        enumerable: false,
        configurable: true
    });
    FlagBase.prototype.isValid = function (v) {
        var e_8, _a, e_9, _b;
        if (typeof v === "number") {
            if (!isFinite(v)) {
                return false;
            }
        }
        if (Array.isArray(v)) {
            try {
                for (var v_1 = __values(v), v_1_1 = v_1.next(); !v_1_1.done; v_1_1 = v_1.next()) {
                    var i = v_1_1.value;
                    if (typeof i === "number" && !isFinite(i)) {
                        return false;
                    }
                }
            }
            catch (e_8_1) { e_8 = { error: e_8_1 }; }
            finally {
                try {
                    if (v_1_1 && !v_1_1.done && (_a = v_1.return)) _a.call(v_1);
                }
                finally { if (e_8) throw e_8.error; }
            }
        }
        var opts = this.opts;
        var values = opts.values;
        if (values && values.length != 0) {
            try {
                for (var values_1 = __values(values), values_1_1 = values_1.next(); !values_1_1.done; values_1_1 = values_1.next()) {
                    var val = values_1_1.value;
                    if (this._equal(v, val)) {
                        return true;
                    }
                }
            }
            catch (e_9_1) { e_9 = { error: e_9_1 }; }
            finally {
                try {
                    if (values_1_1 && !values_1_1.done && (_b = values_1.return)) _b.call(values_1);
                }
                finally { if (e_9) throw e_9.error; }
            }
            var f_1 = opts.isValid;
            if (f_1) {
                return f_1(v);
            }
            return false;
        }
        var f = opts.isValid;
        if (f) {
            return f(v);
        }
        return true;
    };
    FlagBase.prototype._equal = function (l, r) {
        if (Array.isArray(l) && Array.isArray(r)) {
            if (l.length != r.length) {
                return false;
            }
            for (var i = 0; i < l.length; i++) {
                if (l[i] !== r[i]) {
                    return false;
                }
            }
        }
        return l === r;
    };
    FlagBase.prototype.reset = function () {
        var def = this.opts.default;
        if (Array.isArray(def)) {
            var arrs = this.value_;
            if (Array.isArray(arrs)) {
                arrs.splice(0);
                arrs.push.apply(arrs, __spreadArray([], __read(def), false));
                return;
            }
        }
        this.value_ = this.opts.default;
    };
    FlagBase.prototype.defaultString = function () {
        var val = this.opts.default;
        if (Array.isArray(val)) {
            if (val.length != 0) {
                return "(default ".concat(JSON.stringify(val), ")");
            }
        }
        else if (typeof val === "string") {
            if (val != "") {
                return ("(default ".concat(JSON.stringify(val), ")"));
            }
        }
        else if (typeof val === "boolean") {
            if (val) {
                return ("(default ".concat(val, ")"));
            }
        }
        else if (typeof val === "number") {
            if (val != 0) {
                return ("(default ".concat(val, ")"));
            }
        }
        else if (typeof val === "bigint") {
            if (val != BigInt(0)) {
                return ("(default ".concat(val, ")"));
            }
        }
        return "";
    };
    FlagBase.prototype.valuesString = function () {
        var vals = this.opts.values;
        if (vals && vals.length != 0) {
            return "(values ".concat(JSON.stringify(vals), ")");
        }
        return "";
    };
    FlagBase.prototype.add = function (_) {
        return false;
    };
    FlagBase.prototype.isBool = function () {
        return false;
    };
    return FlagBase;
}());
exports.FlagBase = FlagBase;
function formatFlagOptions(opts, def) {
    if (opts.default !== undefined) {
        return opts;
    }
    return {
        name: opts.name,
        default: def,
        short: opts.short,
        usage: opts.usage,
        values: opts.values,
        isValid: opts.isValid,
    };
}
/**
 * A flag of type string
 */
var FlagString = /** @class */ (function (_super) {
    __extends(FlagString, _super);
    function FlagString(opts) {
        return _super.call(this, formatFlagOptions(opts, "")) || this;
    }
    /**
     * @override
     */
    FlagString.prototype.add = function (v) {
        if (v === undefined || !this.isValid(v)) {
            return false;
        }
        this.value_ = v;
        return true;
    };
    return FlagString;
}(FlagBase));
exports.FlagString = FlagString;
/**
 * A flag of type Array<string>
 */
var FlagStrings = /** @class */ (function (_super) {
    __extends(FlagStrings, _super);
    function FlagStrings(opts) {
        return _super.call(this, formatFlagOptions(opts, [])) || this;
    }
    /**
     * @override
     */
    FlagStrings.prototype.add = function (v) {
        if (v === undefined || !this.isValid([v])) {
            return false;
        }
        this.value_.push(v);
        return true;
    };
    return FlagStrings;
}(FlagBase));
exports.FlagStrings = FlagStrings;
/**
 * A flag of type number
 */
var FlagNumber = /** @class */ (function (_super) {
    __extends(FlagNumber, _super);
    function FlagNumber(opts) {
        return _super.call(this, formatFlagOptions(opts, 0)) || this;
    }
    /**
     * @override
     */
    FlagNumber.prototype.add = function (v) {
        if (v === undefined) {
            return false;
        }
        var i = parseInt(v);
        if (!this.isValid(i)) {
            return false;
        }
        this.value_ = i;
        return true;
    };
    return FlagNumber;
}(FlagBase));
exports.FlagNumber = FlagNumber;
/**
 * A flag of type Array<number>
 */
var FlagNumbers = /** @class */ (function (_super) {
    __extends(FlagNumbers, _super);
    function FlagNumbers(opts) {
        return _super.call(this, formatFlagOptions(opts, [])) || this;
    }
    /**
     * @override
     */
    FlagNumbers.prototype.add = function (v) {
        if (v === undefined) {
            return false;
        }
        var i = parseInt(v);
        if (!this.isValid([i])) {
            return false;
        }
        this.value_.push(i);
        return true;
    };
    return FlagNumbers;
}(FlagBase));
exports.FlagNumbers = FlagNumbers;
/**
 * A flag of type bigint
 */
var FlagBigint = /** @class */ (function (_super) {
    __extends(FlagBigint, _super);
    function FlagBigint(opts) {
        return _super.call(this, formatFlagOptions(opts, BigInt(0))) || this;
    }
    /**
     * @override
     */
    FlagBigint.prototype.add = function (v) {
        if (v === undefined) {
            return false;
        }
        try {
            var i = BigInt(v);
            if (!this.isValid(i)) {
                return false;
            }
            this.value_ = i;
            return true;
        }
        catch (_) {
            return false;
        }
    };
    return FlagBigint;
}(FlagBase));
exports.FlagBigint = FlagBigint;
/**
 * A flag of type Array<bigint>
 */
var FlagBigints = /** @class */ (function (_super) {
    __extends(FlagBigints, _super);
    function FlagBigints(opts) {
        return _super.call(this, formatFlagOptions(opts, [])) || this;
    }
    /**
     * @override
     */
    FlagBigints.prototype.add = function (v) {
        if (v === undefined) {
            return false;
        }
        try {
            var i = BigInt(v);
            if (!this.isValid([i])) {
                return false;
            }
            this.value_.push(i);
            return true;
        }
        catch (_) {
            return false;
        }
    };
    return FlagBigints;
}(FlagBase));
exports.FlagBigints = FlagBigints;
function parseBool(v) {
    if (v === undefined) {
        return true;
    }
    else if (v === "true") {
        return true;
    }
    else if (v === "false") {
        return false;
    }
    return undefined;
}
/**
 * A flag of type boolean
 */
var FlagBoolean = /** @class */ (function (_super) {
    __extends(FlagBoolean, _super);
    function FlagBoolean(opts) {
        return _super.call(this, formatFlagOptions(opts, false)) || this;
    }
    /**
     * @override
     */
    FlagBoolean.prototype.isBool = function () {
        return true;
    };
    /**
     * @override
     */
    FlagBoolean.prototype.add = function (v) {
        var val = parseBool(v);
        if (val === undefined || !this.isValid(val)) {
            return false;
        }
        this.value_ = val;
        return true;
    };
    return FlagBoolean;
}(FlagBase));
exports.FlagBoolean = FlagBoolean;
/**
 * A flag of type Array<boolean>
 */
var FlagBooleans = /** @class */ (function (_super) {
    __extends(FlagBooleans, _super);
    function FlagBooleans(opts) {
        return _super.call(this, formatFlagOptions(opts, [])) || this;
    }
    /**
     * @override
     */
    FlagBooleans.prototype.isBool = function () {
        return true;
    };
    /**
     * @override
     */
    FlagBooleans.prototype.add = function (v) {
        var val = parseBool(v);
        if (val === undefined || !this.isValid([val])) {
            return false;
        }
        this.value_.push(val);
        return true;
    };
    return FlagBooleans;
}(FlagBase));
exports.FlagBooleans = FlagBooleans;
/**
 * command parser
 */
var Parser = /** @class */ (function () {
    function Parser(root) {
        this.root = root;
        var opts = root.opts;
        var prepare = opts.prepare;
        if (prepare) {
            var run = prepare(root.flags(), root);
            if (run) {
                opts.run = run;
            }
        }
    }
    /**
     * Parses command line arguments and invokes a handler callback for a matching command or its subcommands
     * @param args command line parameters
     * @param opts some optional behavior definitions
     *
     * @throws {@link FlagsException}
     *
     * @example deno
     * ```
     * new Parser(root).parse(Deno.args)
     * ```
     *
     * @example nodejs
     * ```
     * new Parser(root).parse(process.argv.splice(2))
     * ```
     */
    Parser.prototype.parse = function (args, opts) {
        this.root.parse(args, opts);
    };
    return Parser;
}());
exports.Parser = Parser;
