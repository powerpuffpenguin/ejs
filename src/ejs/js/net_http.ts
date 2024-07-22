declare namespace deps {
    export const GET: number
    export const POST: number
    export const HEAD: number
    export const PUT: number
    export const DELETE: number
    export const OPTIONS: number
    export const TRACE: number
    export const CONNECT: number
    export const PATCH: number

    export class Server {
        readonly __id = "Server"
        p: unknown
    }
    export class RawRequest {
        readonly __id = "RawRequest"
    }
    export function create_server(cb: (req: RawRequest) => void): Server
    export function close_server(s: Server): void
    export function serve(l: any, tls: any, server: any): void

    export function request_free_raw(req: RawRequest): void
    export class RawHeader {
        readonly __id = "RawHeader"
    }
    export function request_input_header(req: RawRequest): RawHeader
    export function request_output_header(req: RawRequest): RawHeader

    export function header_set(req: RawHeader, key: string, value: string): void
    export function header_add(req: RawHeader, key: string, value: string): void
    export function header_get(req: RawHeader, key: string): string
    export function header_del(req: RawHeader, key: string): void
    export function header_del_all(req: RawHeader, key: string): void
    export function header_clear(req: RawHeader): void


    export function request_get_host(req: RawRequest): string
    export function request_get_method(req: RawRequest): number
    export class RawUri {
        readonly __id = "RawUri"
    }
    export function request_get_uri(req: RawRequest): [string, RawUri]
    export function request_get_uri_r(req: RawRequest): RawUri
    export function request_get_uri_s(req: RawRequest): string
    export function uri_join(uri: RawUri): string
    export function uri_get_fragment(uri: RawUri): string
    export function uri_get_host(uri: RawUri): string
    export function uri_get_port(uri: RawUri): number
    export function uri_get_path(uri: RawUri): string
    export function uri_get_query(uri: RawUri): string
    export function uri_get_scheme(uri: RawUri): string
    export function uri_get_userinfo(uri: RawUri): string

    export function status_text(code: number): string
    export interface WriterResponseOptions {
        f: Uint8Array

        r: deps.RawRequest
        code: number
        t?: string
        body?: string | Uint8Array
    }
    export function create_flags(): Uint8Array
    export function writer_response(opts: WriterResponseOptions): void
}
import { BaseTcpListener } from "ejs/net";
export enum Method {
    GET = deps.GET,
    POST = deps.POST,
    HEAD = deps.HEAD,
    PUT = deps.PUT,
    DELETE = deps.DELETE,
    OPTIONS = deps.OPTIONS,
    TRACE = deps.TRACE,
    CONNECT = deps.CONNECT,
    PATCH = deps.PATCH,
}



export const StatusContinue = 100 // RFC 9110, 15.2.1
export const StatusSwitchingProtocols = 101 // RFC 9110, 15.2.2
export const StatusProcessing = 102 // RFC 2518, 10.1
export const StatusEarlyHints = 103 // RFC 8297

export const StatusOK = 200 // RFC 9110, 15.3.1
export const StatusCreated = 201 // RFC 9110, 15.3.2
export const StatusAccepted = 202 // RFC 9110, 15.3.3
export const StatusNonAuthoritativeInfo = 203 // RFC 9110, 15.3.4
export const StatusNoContent = 204 // RFC 9110, 15.3.5
export const StatusResetContent = 205 // RFC 9110, 15.3.6
export const StatusPartialContent = 206 // RFC 9110, 15.3.7
export const StatusMultiStatus = 207 // RFC 4918, 11.1
export const StatusAlreadyReported = 208 // RFC 5842, 7.1
export const StatusIMUsed = 226 // RFC 3229, 10.4.1

export const StatusMultipleChoices = 300 // RFC 9110, 15.4.1
export const StatusMovedPermanently = 301 // RFC 9110, 15.4.2
export const StatusFound = 302 // RFC 9110, 15.4.3
export const StatusSeeOther = 303 // RFC 9110, 15.4.4
export const StatusNotModified = 304 // RFC 9110, 15.4.5
export const StatusUseProxy = 305 // RFC 9110, 15.4.6
// _                       = 306 // RFC 9110, 15.4.7 (Unused)
export const StatusTemporaryRedirect = 307 // RFC 9110, 15.4.8
export const StatusPermanentRedirect = 308 // RFC 9110, 15.4.9

export const StatusBadRequest = 400 // RFC 9110, 15.5.1
export const StatusUnauthorized = 401 // RFC 9110, 15.5.2
export const StatusPaymentRequired = 402 // RFC 9110, 15.5.3
export const StatusForbidden = 403 // RFC 9110, 15.5.4
export const StatusNotFound = 404 // RFC 9110, 15.5.5
export const StatusMethodNotAllowed = 405 // RFC 9110, 15.5.6
export const StatusNotAcceptable = 406 // RFC 9110, 15.5.7
export const StatusProxyAuthRequired = 407 // RFC 9110, 15.5.8
export const StatusRequestTimeout = 408 // RFC 9110, 15.5.9
export const StatusConflict = 409 // RFC 9110, 15.5.10
export const StatusGone = 410 // RFC 9110, 15.5.11
export const StatusLengthRequired = 411 // RFC 9110, 15.5.12
export const StatusPreconditionFailed = 412 // RFC 9110, 15.5.13
export const StatusRequestEntityTooLarge = 413 // RFC 9110, 15.5.14
export const StatusRequestURITooLong = 414 // RFC 9110, 15.5.15
export const StatusUnsupportedMediaType = 415 // RFC 9110, 15.5.16
export const StatusRequestedRangeNotSatisfiable = 416 // RFC 9110, 15.5.17
export const StatusExpectationFailed = 417 // RFC 9110, 15.5.18
export const StatusTeapot = 418 // RFC 9110, 15.5.19 (Unused)
export const StatusMisdirectedRequest = 421 // RFC 9110, 15.5.20
export const StatusUnprocessableEntity = 422 // RFC 9110, 15.5.21
export const StatusLocked = 423 // RFC 4918, 11.3
export const StatusFailedDependency = 424 // RFC 4918, 11.4
export const StatusTooEarly = 425 // RFC 8470, 5.2.
export const StatusUpgradeRequired = 426 // RFC 9110, 15.5.22
export const StatusPreconditionRequired = 428 // RFC 6585, 3
export const StatusTooManyRequests = 429 // RFC 6585, 4
export const StatusRequestHeaderFieldsTooLarge = 431 // RFC 6585, 5
export const StatusUnavailableForLegalReasons = 451 // RFC 7725, 3

export const StatusInternalServerError = 500 // RFC 9110, 15.6.1
export const StatusNotImplemented = 501 // RFC 9110, 15.6.2
export const StatusBadGateway = 502 // RFC 9110, 15.6.3
export const StatusServiceUnavailable = 503 // RFC 9110, 15.6.4
export const StatusGatewayTimeout = 504 // RFC 9110, 15.6.5
export const StatusHTTPVersionNotSupported = 505 // RFC 9110, 15.6.6
export const StatusVariantAlsoNegotiates = 506 // RFC 2295, 8.1
export const StatusInsufficientStorage = 507 // RFC 4918, 11.5
export const StatusLoopDetected = 508 // RFC 5842, 7.2
export const StatusNotExtended = 510 // RFC 2774, 7
export const StatusNetworkAuthenticationRequired = 511 // RFC 6585, 6

export const statusText = deps.status_text

export const ContentTypeHTML = "text/html; charset=utf-8"
export const ContentTypeText = "text/plain; charset=utf-8"
export const ContentTypeJSON = "application/json; charset=utf-8"
export const ContentTypeJSONP = "application/javascript; charset=utf-8"
export const ContentTypeXML = "application/xml; charset=utf-8"
export const ContentTypeYAML = "application/yaml; charset=utf-8"

interface RequestShared {
    expired: Uint8Array
    uri?: Uri
    inputHeader?: Header
    outputHeader?: Header
}
export class Server {
    private srv_?: deps.Server
    private tls_?: any
    constructor(readonly listener: BaseTcpListener, cb: (w: ResponseWriter, r: Request) => void) {
        if (!(listener instanceof BaseTcpListener)) {
            throw new Error("listener must instanceof BaseTcpListener")
        }
        const l = listener.native()
        if (!l) {
            throw new Error("listener already closed")
        }
        const srv = deps.create_server((req) => {
            let w: ResponseWriter | undefined

            try {
                const flags = deps.create_flags()
                flags[0] = 1
                const shared: RequestShared = {
                    expired: flags,
                }
                const r = Request.__create(req, shared)
                w = new ResponseWriter(req, shared)
                cb(w, r)
            } catch (e) {
                if (w) {
                    w.close()
                } else {
                    deps.request_free_raw(req)
                }
                throw e
            }
        })
        const tls = l.tls
        deps.serve(l, tls?.p, srv.p)
        this.srv_ = srv
        if (tls) {
            this.tls_ = tls
        }
    }
    close() {
        const listener = this.listener
        if (!listener.isClosed) {
            listener.close()
        }
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
function getRequestUri(req: deps.RawRequest, shared: RequestShared): Uri {
    let u = shared.uri
    if (!u) {
        const [s, raw] = deps.request_get_uri(req)
        u = new Uri(raw, s)
        shared.uri = u
    }
    return u
}
function getRequestInputHeader(req: deps.RawRequest, shared: RequestShared): Header {
    let v = shared.inputHeader
    if (!v) {
        v = new Header(deps.request_input_header(req), shared)
        shared.inputHeader = v
    }
    return v
}
function getRequestOutputHeader(req: deps.RawRequest, shared: RequestShared): Header {
    let v = shared.outputHeader
    if (!v) {
        v = new Header(deps.request_output_header(req), shared)
        shared.outputHeader = v
    }
    return v
}
let internalcall = false
export class Request {
    static __create(r: deps.RawRequest, shared: RequestShared) {
        try {
            internalcall = true
            return new Request(r, shared, getRequestInputHeader)
        } finally {
            internalcall = false
        }
    }
    constructor(r: deps.RawRequest, shared: RequestShared, getHeader: (r: deps.RawRequest, shared: RequestShared) => Header) {
        if (internalcall) {
            internalcall = false
            this.r_ = r
            this.shared_ = shared
            this._getHeader = getHeader

        } else {
            this.r_ = r
            this.shared_ = {
                expired: deps.create_flags(),
            }
            this._getHeader = getRequestOutputHeader
        }
    }
    readonly r_: deps.RawRequest
    private shared_: RequestShared
    private readonly _getHeader: (r: deps.RawRequest, shared: RequestShared) => Header
    get isValid(): boolean {
        const f = this.shared_.expired
        return f[0] ? true : false
    }
    private _get(): deps.RawRequest {
        const f = this.shared_.expired
        if (f[0]) {
            return this.r_
        }
        throw new Error("ResponseWriter expired")
    }
    get host(): string {
        const r = this._get()
        return deps.request_get_host(r)
    }
    get uri(): Uri {
        const r = this._get()
        return getRequestUri(r, this.shared_)
    }
    get method(): number {
        const r = this._get()
        return deps.request_get_method(r)
    }
    get methodString(): string | undefined {
        const r = this._get()
        const v = deps.request_get_method(r)
        return Method[v]
    }

    header(): Header {
        const r = this._get()
        const get = this._getHeader
        return get(r, this.shared_)
    }

}
export class Uri {
    constructor(readonly raw_: deps.RawUri, private uri_?: string) { }

    get fragment() {
        return deps.uri_get_fragment(this.raw_)
    }
    get host() {
        return deps.uri_get_host(this.raw_)
    }
    get port() {
        return deps.uri_get_port(this.raw_)
    }
    get path() {
        return deps.uri_get_path(this.raw_)
    }
    get query() {
        return deps.uri_get_query(this.raw_)
    }
    get scheme() {
        return deps.uri_get_scheme(this.raw_)
    }
    get userinfo() {
        return deps.uri_get_userinfo(this.raw_)
    }
    toString(): string {
        let s = this.uri_
        if (s === undefined) {
            s = deps.uri_join(this.raw_)
            this.uri_ = s
        }
        return s
    }
}

export class ResponseWriter {
    private req_?: deps.RawRequest
    constructor(req: deps.RawRequest, readonly shared_: RequestShared) {
        this.req_ = req
    }
    private _get(): deps.RawRequest {
        const f = this.shared_.expired
        if (f[0]) {
            const r = this.req_
            if (r) {
                return r
            }
        }
        throw new Error("ResponseWriter expired")
    }
    private _req(): deps.RawRequest {
        const f = this.shared_.expired
        if (f[0]) {
            const r = this.req_
            if (r) {
                this.req_ = undefined
                return r
            }
        }
        throw new Error("ResponseWriter expired")
    }
    private _flags(): Uint8Array {
        const f = this.shared_.expired
        if (f[0]) {
            return f
        }
        throw new Error("ResponseWriter expired")
    }
    close() {
        const f = this.shared_.expired!
        if (f[0]) {
            const r = this.req_
            if (r) {
                this.req_ = undefined
                try {
                    deps.writer_response({
                        f: f,
                        r: r,
                        t: ContentTypeText,
                        code: StatusNotImplemented,
                        body: 'handler miss: ResponseWriter did not return data, there is a bug in the server',
                    })
                } catch (e) {
                    if (f[0]) {
                        f[0] = 0
                        deps.request_free_raw(r)
                    }
                    throw e
                }
            }
        }
    }
    status(code: number) {
        const f = this._flags()
        const r = this._req()
        try {
            deps.writer_response({
                f: f,
                r: r,
                code: code,
            })
        } catch (e) {
            if (f[0]) {
                f[0] = 0
                deps.request_free_raw(r)
            }
            throw e
        }
    }
    text(code: number, body: string) {
        const f = this._flags()
        const r = this._req()
        try {
            deps.writer_response({
                f: f,
                r: r,
                t: ContentTypeText,
                code: code,
                body: body,
            })
        } catch (e) {
            if (f[0]) {
                f[0] = 0
                deps.request_free_raw(r)
            }
            throw e
        }
    }
    json(code: number, body: any, replacer?: (number | string)[] | null, space?: string | number) {
        const f = this._flags()
        const r = this._req()
        try {
            deps.writer_response({
                f: f,
                r: r,
                t: ContentTypeJSON,
                code: code,
                body: JSON.stringify(body, replacer, space),
            })
        } catch (e) {
            if (f[0]) {
                f[0] = 0
                deps.request_free_raw(r)
            }
            throw e
        }
    }
    jsonp(code: number, callback: string, body: any, replacer?: (number | string)[] | null, space?: string | number) {
        const f = this._flags()
        const r = this._req()
        try {
            if (callback.length == 0) {
                deps.writer_response({
                    f: f,
                    r: r,
                    t: ContentTypeJSON,
                    code: code,
                    body: JSON.stringify(body, replacer, space),
                })
            } else {
                deps.writer_response({
                    f: f,
                    r: r,
                    t: ContentTypeJSONP,
                    code: code,
                    body: `${callback}(${JSON.stringify(body, replacer, space)})`,
                })
            }
        } catch (e) {
            if (f[0]) {
                f[0] = 0
                deps.request_free_raw(r)
            }
            throw e
        }
    }
    header(key?: string, value?: any): Header | void {
        const r = this._get()
        if ((key === undefined || key === null)) {
            return getRequestOutputHeader(r, this.shared_)
        }
        const raw = deps.request_output_header(r)
        if (typeof value === "string") {
            deps.header_set(raw, key, value)
        } else {
            deps.header_set(raw, key, `${value}`)
        }
    }
}

export class Header {
    constructor(public raw_: deps.RawHeader, readonly shared_: RequestShared) { }
    get isValid(): boolean {
        const f = this.shared_.expired
        return f[0] ? true : false
    }
    private _raw(): deps.RawHeader {
        const f = this.shared_.expired
        if (f[0]) {
            return this.raw_
        }
        throw new Error("Header expired")
    }
    set(key: string, value?: any): void {
        const raw = this._raw()
        if (typeof value === "string") {
            deps.header_set(raw, key, value)
        } else {
            deps.header_set(raw, key, `${value}`)
        }
    }
    add(key: string, value?: any): void {
        const raw = this._raw()
        if (typeof value === "string") {
            deps.header_add(raw, key, value)
        } else {
            deps.header_add(raw, key, `${value}`)
        }
    }
    get(key: string): string {
        const raw = this._raw()
        return deps.header_get(raw, key)
    }
    remove(key: string): void {
        const raw = this._raw()
        deps.header_del(raw, key)
    }
    removeAll(key: string): void {
        const raw = this._raw()
        deps.header_del_all(raw, key)
    }
    clear() {
        const f = this.shared_.expired
        if (f[0]) {
            deps.header_clear(this.raw_)
        }
    }
}
export interface Handler {
    serveHTTP(w: ResponseWriter, r: Request): void
}

interface muxEntry {
    h: Handler
    pattern: string
}

export class ServeMux implements Handler {
    /**
     *  whether any patterns contain hostnames
     */
    private hosts_ = false
    private m_?: Record<string, muxEntry>
    /**
     *  array of entries sorted from longest to shortest
     */
    private es_?: Array<muxEntry>
    handler(r: Request): [Handler, string] {
        // CONNECT requests are not canonicalized.
        // if (r.method == Method.CONNECT) {
        //     // If r.URL.Path is /tree and its handler is not registered,
        //     // the /tree -> /tree/ redirect applies to CONNECT requests
        //     // but the path canonicalization does not.
        //     // if u, ok := mux.redirectToPathSlash(r.URL.Host, r.URL.Path, r.URL); ok {
        //     //     return RedirectHandler(u.String(), StatusMovedPermanently), u.Path
        //     // }

        //     // return mux.handler(r.Host, r.URL.Path)
        // }

        // // All other requests have any port stripped and path cleaned
        // // before passing to mux.handler.
        // host := stripHostPort(r.Host)
        // path := cleanPath(r.URL.Path)

        // // If the given path is /tree and its handler is not registered,
        // // redirect for /tree/.
        // if u, ok := mux.redirectToPathSlash(host, path, r.URL); ok {
        //     return RedirectHandler(u.String(), StatusMovedPermanently), u.Path
        // }

        // if path != r.URL.Path {
        //     _, pattern = mux.handler(host, path)
        //     u := &url.URL{Path: path, RawQuery: r.URL.RawQuery}
        //     return RedirectHandler(u.String(), StatusMovedPermanently), pattern
        // }

        // return mux.handler(host, r.URL.Path)
        throw new Error("not found");

    }
    serveHTTP(w: ResponseWriter, r: Request): void {
        if (!r.isValid) {
            return
        }
        if (deps.request_get_uri_s(r.r_) == "*") {
            w.status(StatusBadRequest)
            return
        }

        const found = this.handler(r)
        found[0].serveHTTP(w, r)
    }
}