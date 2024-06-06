"use strict";
(function () {
    var pad = function (s, m, f, start) {
        if (f === null || f === undefined || f === '') {
            f = " "
        } else {
            f = f.toString()
            if (f == "") {
                f = " "
            }
        }
        if (typeof m === "string") {
            m = parseInt(m)
        } else if (typeof m !== "number") {
            return s
        }
        m = Math.floor(m)
        var length = s.length
        if (!Number.isFinite(m) || length >= m) {
            return s
        }
        var i = f.length
        var n = i == 1 ? m - length : Math.floor((m - length + i - 1) / i)
        length += i * n
        var str = new Array(n)
        for (i = 0; i < n; i++) {
            str[i] = f
        }
        if (length > m) {
            n = length - m
            f = str[0].slice(0, i - n)
            if (start) {
                str[str.length - 1] = f
                str.push(s)
            } else {
                str[0] = s
                str.push(f)
            }
        } else {
            if (start) {
                str.push(s)
            } else {
                str[0] = s
                str.push(f)
            }
        }
        return str.join('')
    }
    String.prototype.padEnd = function (m, f) {
        return pad(this, m, f, false)
    }
    String.prototype.padStart = function (m, f) {
        return pad(this, m, f, true)
    }
    return function (deps) {
        var __values = (this && this.__values) || function (o) {
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
        var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
            function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
            return new (P || (P = Promise))(function (resolve, reject) {
                function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
                function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
                function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
                step((generator = generator.apply(thisArg, _arguments || [])).next());
            });
        };
        var __generator = (this && this.__generator) || function (thisArg, body) {
            var _ = { label: 0, sent: function () { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g;
            return g = { next: verb(0), "throw": verb(1), "return": verb(2) }, typeof Symbol === "function" && (g[Symbol.iterator] = function () { return this; }), g;
            function verb(n) { return function (v) { return step([n, v]); }; }
            function step(op) {
                if (f) throw new TypeError("Generator is already executing.");
                while (_) try {
                    if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
                    if (y = 0, t) op = [op[0] & 2, t.value];
                    switch (op[0]) {
                        case 0: case 1: t = op; break;
                        case 4: _.label++; return { value: op[1], done: false };
                        case 5: _.label++; y = op[1]; op = [0]; continue;
                        case 7: op = _.ops.pop(); _.trys.pop(); continue;
                        default:
                            if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                            if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                            if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                            if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                            if (t[2]) _.ops.pop();
                            _.trys.pop(); continue;
                    }
                    op = body.call(thisArg, _);
                } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
                if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
            }
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
        var CError = /** @class */ (function (_super) {
            __extends(CError, _super);
            function CError(message, options) {
                var _newTarget = this.constructor;
                var _this = _super.call(this, undefined, options) || this;
                // restore prototype chain   
                var proto = _newTarget.prototype;
                if (Object.setPrototypeOf) {
                    Object.setPrototypeOf(_this, proto);
                }
                else {
                    _this.__proto__ = proto;
                }
                _this.name = "CError";
                _this.message = message !== null && message !== void 0 ? message : '';
                _this.cause = options === null || options === void 0 ? void 0 : options.cause;
                return _this;
            }
            return CError;
        }(Error));
        var OsError =/** @class */ (function (_super) {
            __extends(OsError, _super);
            function OsError(errno, message) {
                if (message === undefined || message === null) {
                    message = deps.strerror(errno)
                }
                var _this = _super.call(this, message, { cause: 1 }) || this;
                _this.errno = errno;
                _this.name = "OsError";
                return _this;
            }
            Object.defineProperty(OsError.prototype, "errnoString", {
                get: function () {
                    return deps.strerror(this.errno);
                },
                enumerable: false,
                configurable: true
            });
            return OsError;
        }(CError));
        return {
            __values: __values,
            __extends: __extends,
            __awaiter: __awaiter,
            __generator: __generator,
            __read: __read,
            __spreadArray: __spreadArray,
            Error: CError,
            OsError: OsError,
        }
    }
})()
