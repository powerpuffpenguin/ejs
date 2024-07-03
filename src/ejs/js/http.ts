declare namespace deps {
    export class HttpServer {
        readonly __id = "HttpServer"
        p: unknown
    }
    export class RawHttpRequest {
        readonly __id = "RawHttpRequest"
    }
    export function create_server(cb: (req: RawHttpRequest) => void): HttpServer
    export function close_server(s: HttpServer): void
    export function serve(l: any, tls: any, server: any): void

    export function request_get_host(req: RawHttpRequest): string
    export class RawUri {
        readonly __id = "RawUri"
    }
    export function request_get_uri(req: RawHttpRequest): RawUri
    export function uri_get_fragment(uri: RawUri): string
    export function uri_get_host(uri: RawUri): string
    export function uri_get_port(uri: RawUri): number
    export function uri_get_path(uri: RawUri): string
    export function uri_get_query(uri: RawUri): string
    export function uri_get_scheme(uri: RawUri): string
    export function uri_get_userinfo(uri: RawUri): string

    export function writer_response_text(opts: {
        req: RawHttpRequest,
        text: string,
        code: number
    }): void
}
import { BaseTcpListener } from "ejs/net";
export class HttpServer {
    private srv_?: deps.HttpServer
    private tls_?: any
    constructor(readonly listener: BaseTcpListener, cb: (w: ResponseWriter, r: HttpRequest) => void) {
        if (!(listener instanceof BaseTcpListener)) {
            throw new Error("listener must instanceof BaseTcpListener")
        }
        const l = listener.native()
        if (!l) {
            throw new Error("listener already closed")
        }
        const srv = deps.create_server((req) => {
            cb(new ResponseWriter(req), new HttpRequest(req))
        })
        const tls = listener.tls
        deps.serve(l, tls?.p, srv.p)
        this.srv_ = srv
        this.tls_ = tls
    }
    close() {
        const srv = this.srv_
        if (srv) {
            if (this.tls_) {
                this.tls_ = undefined
            }
            this.srv_ = undefined
            deps.close_server(srv)
        }
    }
}
export class HttpRequest {
    constructor(readonly r: deps.RawHttpRequest) { }
    get host(): string {
        return deps.request_get_host(this.r)
    }
    get uri(): Uri {
        return new Uri(deps.request_get_uri(this.r))
    }
}
export class Uri {
    constructor(readonly uri: deps.RawUri) { }

    get fragment() {
        return deps.uri_get_fragment(this.uri)
    }
    get host() {
        return deps.uri_get_host(this.uri)
    }
    get port() {
        return deps.uri_get_port(this.uri)
    }
    get path() {
        return deps.uri_get_path(this.uri)
    }
    get query() {
        return deps.uri_get_query(this.uri)
    }
    get scheme() {
        return deps.uri_get_scheme(this.uri)
    }
    get userinfo() {
        return deps.uri_get_userinfo(this.uri)
    }
}
export class ResponseWriter {
    private req_?: deps.RawHttpRequest
    constructor(req: deps.RawHttpRequest) {
        this.req_ = req
    }
    private _req(): deps.RawHttpRequest {
        const r = this.req_
        if (r) {
            return r
        }
        throw new Error("ResponseWriter expired")
    }
    text(code: number, s: string) {
        const r = this._req()
        deps.writer_response_text({
            req: r,
            code: code,
            text: s,
        })
    }

}