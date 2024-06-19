"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
var os = __importStar(require("ejs/os"));
var sync = __importStar(require("ejs/sync"));
// Start a coroutine
sync.go(function (co) {
    // Create a temporary file
    var f = os.File.createTemp(co, "ejs_temp_*");
    var name = f.name();
    console.log("create success: ".concat(name));
    try {
        // write then close
        f.write(co, 'this is a coroutine example');
        f.close();
        // read text file
        var text = os.readTextFile(co, name);
        console.log(text);
    }
    catch (e) {
        console.log("err: ".concat(e));
    }
    // remove
    os.remove(co, name);
});
os.stat;
