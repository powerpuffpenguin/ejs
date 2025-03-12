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
exports.command = void 0;
var flags_1 = require("../flags");
var net = __importStar(require("ejs/net"));
var os = __importStar(require("ejs/os"));
var http = __importStar(require("ejs/net/http"));
exports.command = new flags_1.Command({
    use: 'http-server',
    short: 'http server example',
    prepare: function (flags, _) {
        var address = flags.string({
            name: 'addr',
            short: 'a',
            usage: 'listen address',
            default: ":9000",
        });
        var network = flags.string({
            name: 'network',
            usage: 'network',
            values: [
                'tcp', 'tcp4', 'tcp6', 'unix',
            ],
            default: 'tcp',
        });
        var sync = flags.bool({
            name: 'sync',
            usage: 'sync listener',
            default: false,
        });
        var backlog = flags.number({
            name: 'backlog',
            usage: 'accept backlog',
            default: 5,
        });
        var certFile = flags.string({
            name: 'certFile',
            usage: 'x509 cert file path',
        });
        var keyFile = flags.string({
            name: 'keyFile',
            usage: 'x509 key file path',
        });
        return function () {
            // create a listener
            var tls;
            if (certFile.value != '' && keyFile.value != '') {
                tls = {
                    certificate: [
                        {
                            cert: os.readTextFileSync(certFile.value),
                            key: os.readTextFileSync(keyFile.value),
                        }
                    ]
                };
            }
            var l = net.listen({
                network: network.value,
                address: address.value,
                sync: sync.value,
                backlog: backlog.value,
                tls: tls
            });
            if (sync.value) {
                if (tls) {
                    console.log("https sync listen: ".concat(l.addr));
                }
                else {
                    console.log("http sync listen: ".concat(l.addr));
                }
            }
            else {
                if (tls) {
                    console.log("https listen: ".concat(l.addr));
                }
                else {
                    console.log("http listen: ".concat(l.addr));
                }
            }
            new http.Server(l, createServeMux());
        };
    },
});
function createServeMux() {
    var mux = new http.ServeMux();
    mux.handle('/', function (w, r) {
        w.text(http.StatusOK, "cerberus is an idea");
    });
    mux.handle('/json', function (w, r) {
        w.json(http.StatusOK, {
            name: "king",
            level: 123,
        });
    });
    mux.handle('/jsonp', function (w, r) {
        w.jsonp(http.StatusOK, "cb", {
            name: "king",
            level: 123,
        });
    });
    mux.handle('/xml', function (w, r) {
        w.body(http.StatusOK, http.ContentTypeXML, "<root><name>cerberus</name><lv>1</lv></root>");
    });
    mux.handle('/yaml', function (w, r) {
        w.body(http.StatusOK, http.ContentTypeYAML, "networks:\n  ingress_intranet:\n    external: true\nservices:\n  code:\n    build:\n      context: .\n      dockerfile: android.Dockerfile\n");
    });
    mux.handle('/html', function (w, r) {
        w.body(http.StatusOK, http.ContentTypeHTML, "<!DOCTYPE html>\n<html lang=\"en\">\n<head>\n    <meta charset=\"UTF-8\">\n    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\">\n    <title>Document</title>\n</head>\n<body>\n    ok\n</body>\n</html>");
    });
    mux.handle('/ws', function (w, r) {
        var ws = w.upgrade();
        if (!ws) {
            return;
        }
        ws.onClose = function () {
            console.log("ws close");
        };
        var i = 0;
        ws.onMessage = function (data) {
            console.log("ws get:", data);
            ws.write(data);
            if (i > 10) {
                ws.close();
            }
        };
        ws.write("connect ok");
    });
    return mux;
}
