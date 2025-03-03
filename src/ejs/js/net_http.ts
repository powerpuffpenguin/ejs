declare namespace __duk {
    const os: string
    const arch: string
}
declare namespace deps {
    const GET: number
    const POST: number
    const HEAD: number
    const PUT: number
    const DELETE: number
    const OPTIONS: number
    const TRACE: number
    const CONNECT: number
    const PATCH: number

    const HTTP_TIMEOUT: number
    const HTTP_EOF: number
    const HTTP_INVALID_HEADER: number
    const HTTP_BUFFER_ERROR: number
    const HTTP_REQUEST_CANCEL: number
    const HTTP_DATA_TOO_LONG: number

    class Pointer {
        readonly __id = "pointer"
    }
    class Server {
        readonly __id = "Server"
        p: Pointer
    }
    class RawRequest {
        readonly __id = "RawRequest"
    }
    function create_server(cb: (req: RawRequest) => void): Server
    function close_server(s: Server): void
    function serve(l: any, tls: any, server: any): void

    function request_free_raw(req: RawRequest): void
    class RawHeader {
        readonly __id = "RawHeader"
    }
    function request_input_header(req: RawRequest): RawHeader
    function request_output_header(req: RawRequest): RawHeader

    function header_set(req: RawHeader, key: string, value: string): void
    function header_add(req: RawHeader, key: string, value: string): void
    function header_get(req: RawHeader, key: string): string | undefined
    function header_del(req: RawHeader, key: string): void
    function header_del_all(req: RawHeader, key: string): void
    function header_clear(req: RawHeader): void


    function request_get_host(req: RawRequest): string
    function request_get_method(req: RawRequest): number
    class RawUri {
        readonly __id = "RawUri"
    }
    function request_get_uri(req: RawRequest): [string, RawUri]
    function request_get_uri_r(req: RawRequest): RawUri
    function request_get_uri_s(req: RawRequest): string
    function uri_join(uri: RawUri): string
    function uri_get_fragment(uri: RawUri): string
    function uri_get_host(uri: RawUri): string
    function uri_get_port(uri: RawUri): number
    function uri_get_path(uri: RawUri): string
    function uri_get_query(uri: RawUri): string
    function uri_get_scheme(uri: RawUri): string
    function uri_get_userinfo(uri: RawUri): string

    function status_text(code: number): string
    interface WriterResponseOptions {
        f: Uint8Array

        r: deps.RawRequest
        code: number
        t?: string
        body?: string | Uint8Array
    }
    function create_flags(): Uint8Array
    function writer_response(opts: WriterResponseOptions): void
    class ChunkWriter {
        readonly __id = 'ChunkWriter'
        p: Pointer
    }
    interface CreateChunkWriteOptions {
        f: Uint8Array

        r: deps.RawRequest
        code: number

        cb?: () => void
    }
    function create_chunk_writer(opts: CreateChunkWriteOptions): ChunkWriter
    function close_chunk_writer(writer: ChunkWriter): void
    function write_chunk_writer(writer: Pointer, data: string | Uint8Array): void

    class WSConn {
        readonly __id = "WSConn"
        cbm?: (data: string | Uint8Array) => void
        cbc?: () => void
        p: Pointer
    }
    function ws_upgrade(f: Uint8Array, r: deps.RawRequest): WSConn | undefined
    function ws_close(p: WSConn, reason?: number): void
    function ws_write(p: Pointer, data: Uint8Array | string): void
    function ws_cbc(p: Pointer, enable: boolean): void
    function ws_cbm(p: Pointer, enable: boolean): void

    function html_escape(s: string): string
    function hexEscapeNonASCII(s: string): string

    interface TlsConfig {
        /**
         * @default Tls12
         */
        minVersion?: number
        /**
         * @default Tls13
         */
        maxVersion?: number

        certificate?: Array<string>

        insecure?: boolean
        debug?: boolean
    }
    class Tls {
        readonly __id = "Tls"
        p: unknown
    }
    function create_tls(config: TlsConfig): Tls
    class HttpClient {
        readonly __id = "HttpClient"
        p: Pointer
        cbc: () => void
        cb: (err?: number) => void
    }
    interface CreateHttpClientOptions {
        host: string
        port?: number
        tls?: unknown
        resolver?: unknown,
    }
    function create_http_client(opts: CreateHttpClientOptions): HttpClient
    function close_http_client(client: HttpClient): void
    class HttpRequest {
        readonly __id = "HttpRequest"
        p: RawRequest
    }
    function create_http_request(p: Pointer): HttpRequest
    function close_http_request(req: HttpRequest): void
    function do_http_request(client: Pointer,
        req: HttpRequest,
        path: string,
        method: number,
    ): void
    function get_response_code(p: RawRequest): number
    function get_response_code_line(p: RawRequest): string
    function get_response_body(p: RawRequest): Uint8Array
}
import { BaseTcpListener, TlsConfig, AbortSignal, Resolver, splitHostPort } from "ejs/net";
import { clean, split } from "ejs/path";
import { URL } from "ejs/net/url";
import { parseArgs } from "ejs/sync";
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
    constructor(readonly listener: BaseTcpListener,
        h: Handler,
    ) {
        if (!(listener instanceof BaseTcpListener)) {
            throw new Error("listener must instanceof BaseTcpListener")
        }
        const l = (listener as any).native()
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
                h.serveHTTP(w, r)
            } catch (e) {
                throw e
            } finally {
                if (w) {
                    w.close()
                } else {
                    deps.request_free_raw(req)
                }
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
    body(code: number, contentType: string, body: string | Uint8Array) {
        const f = this._flags()
        const r = this._req()
        try {
            deps.writer_response({
                f: f,
                r: r,
                t: contentType,
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
    text(code: number, body: string | Uint8Array) {
        this.body(code, ContentTypeText, body)
    }
    json(code: number, body: any, replacer?: (number | string)[] | null, space?: string | number) {
        this.body(code, ContentTypeJSON, JSON.stringify(body, replacer, space))
    }
    jsonp(code: number, callback: string, body: any, replacer?: (number | string)[] | null, space?: string | number) {
        if (callback.length == 0) {
            this.body(code, ContentTypeJSON, JSON.stringify(body, replacer, space))
        } else {
            this.body(code, ContentTypeJSONP, `${callback}(${JSON.stringify(body, replacer, space)})`)
        }
    }
    chunk(code: number): ChunkWriter {
        const f = this._flags()
        const r = this._req()
        let writer: deps.ChunkWriter
        const opts: deps.CreateChunkWriteOptions = {
            f: f,
            r: r,
            code: code,
        }
        try {
            writer = deps.create_chunk_writer(opts)
        } catch (e) {
            if (f[0]) {
                f[0] = 0
                deps.request_free_raw(r)
            }
            throw e
        }
        return new ChunkWriter(opts, writer)
    }
    upgrade(): Websocket | undefined {
        const f = this._flags()
        const r = this._req()
        let ws: deps.WSConn | undefined
        try {
            ws = deps.ws_upgrade(f, r)
        } catch (e) {
            if (f[0]) {
                this.req_ = undefined
                try {
                    deps.writer_response({
                        f: f,
                        r: r,
                        t: ContentTypeText,
                        code: StatusInternalServerError,
                        body: `${e}`,
                    })
                } catch (_) {
                    if (f[0]) {
                        f[0] = 0
                        deps.request_free_raw(r)
                    }

                }
            }
            throw e
        }
        if (ws) {
            try {
                return new Websocket(ws)
            } catch (e) {
                deps.ws_close(ws, 1011)
                throw e
            }
        }
    }
}
export class ChunkWriter {
    private w_?: deps.ChunkWriter
    private writer_?: deps.ChunkWriter
    private cb_?: () => void
    constructor(readonly opts: deps.CreateChunkWriteOptions, writer?: deps.ChunkWriter) {
        this.w_ = writer
        this.writer_ = writer
        opts.cb = () => {
            const cb = this.cb_
            if (cb) {
                this.cb_ = undefined
                try {
                    cb()
                } catch (e) {
                    if (!this.writer_) {
                        const w = this.w_
                        if (w) {
                            this.w_ = undefined
                            deps.close_chunk_writer(w)
                        }
                    }
                    throw e
                }
            }
        }
    }
    private _chunk(data: string | Uint8Array, cb: () => void) {
        const writer = this.writer_

        if (!writer) {
            throw new Error("http: chunk writer closed")
        }
        if (this.cb_) {
            throw new Error("http: chunk writer busy")
        }
        try {
            this.cb_ = cb
            deps.write_chunk_writer(writer.p, data)
        } catch (e) {
            this.cb_ = undefined
            throw e
        }
    }
    chunk(a: any, b: any) {
        const { co, cb, opts } = parseArgs<string | Uint8Array, () => void>("ChunkWriter.chunk", a, b)
        if (co) {
            co.yield<void>((notify) => {
                this._chunk(opts!, () => notify.value())
            })
        } else if (cb) {
            this._chunk(opts!, cb)
        } else {
            return new Promise<void>((resolve) => {
                this._chunk(opts!, resolve)
            })
        }
    }
    close() {
        const writer = this.writer_
        if (writer) {
            this.writer_ = undefined
            if (!this.cb_) {
                deps.close_chunk_writer(writer)
            }
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
    get(key: string): string | undefined {
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

interface MuxEntry {
    pattern: string
    h: Handler
}
class HandlerFunc implements Handler {
    constructor(readonly f: (w: ResponseWriter, r: Request) => void) {
        if (typeof f !== "function") {
            throw new Error("http: invalid handler function")
        }
    }
    serveHTTP(w: ResponseWriter, r: Request): void {
        const f = this.f
        f(w, r)
    }
}
export function handlerFunc(f: (w: ResponseWriter, r: Request) => void): Handler {
    return new HandlerFunc(f)
}
// Helper handlers

// Error replies to the request with the specified error message and HTTP code.
// It does not otherwise end the request; the caller should ensure no further
// writes are done to w.
// The error message should be plain text.
export function error(w: ResponseWriter, error: string, code: number): void {
    w.header("X-Content-Type-Options", "nosniff")
    w.text(code, error)
}

// NotFound replies to the request with an HTTP 404 not found error.
export function notFound(w: ResponseWriter, r: Request): void {
    w.header("X-Content-Type-Options", "nosniff")
    w.text(StatusNotFound, "404 page not found")
}
const _notFoundMuxEntry: MuxEntry = {
    pattern: '',
    h: handlerFunc(notFound),
}
// NotFoundHandler returns a simple request handler
// that replies to each request with a “404 page not found” reply.
export function notFoundHandler(): Handler {
    return handlerFunc(notFound)
}
// Redirect replies to the request with a redirect to url,
// which may be a path relative to the request path.
//
// The provided code should be in the 3xx range and is usually
// StatusMovedPermanently, StatusFound or StatusSeeOther.
//
// If the Content-Type header has not been set, Redirect sets it
// to "text/html; charset=utf-8" and writes a small HTML body.
// Setting the Content-Type header to any value, including nil,
// disables that behavior.
export function redirect(w: ResponseWriter, r: Request, url: string, code: number): void {
    try {
        const u = URL.parse(url)
        // If url was relative, make its path absolute by
        // combining with request path.
        // The client would probably do this for us,
        // but doing it ourselves is more reliable.
        // See RFC 7231, section 7.1.2
        if (u.scheme == "" && u.host == "") {
            let oldpath = r.uri.path
            if (oldpath == "") { // should not happen, but avoid a crash if it does
                oldpath = "/"
            }

            // no leading http://server
            if (url == "" || !url.startsWith('/')) {
                // make relative path absolute
                const olddir = split(oldpath)
                url = olddir[0] + url
            }

            let query: string
            const i = url.indexOf("?")
            if (i >= 0) {
                query = url.substring(i)
                url = url.substring(0, i)
            } else {
                query = ''
            }

            // clean up but preserve trailing slash
            const trailing = url.endsWith("/")
            url = clean(url)
            if (trailing && !url.endsWith("/")) {
                url += "/"
            }
            url += query
        }
    } catch (_) {
    }

    const h = w.header()!

    // RFC 7231 notes that a short HTML body is usually included in
    // the response because older user agents may not understand 301/307.
    // Do it only if the request didn't already have a Content-Type header.
    const hadCT = h.get("Content-Type")
    h.set("Location", deps.hexEscapeNonASCII(url))
    if (hadCT == "") {
        w.status(code)
        return
    }

    switch (r.method) {
        case Method.HEAD:
            h.set("Content-Type", "text/html; charset=utf-8")
            break
        case Method.GET:
            w.body(code,
                "<a href=\"" + deps.html_escape(url) + "\">" + statusText(code) + "</a>.\n",
                "text/html; charset=utf-8")
            return
    }
    w.status(code)
}
// Redirect to a fixed URL
class RedirectHandler implements Handler {
    constructor(readonly url: string, readonly code: number) { }
    serveHTTP(w: ResponseWriter, r: Request): void {
        redirect(w, r, this.url, this.code)
    }
}

// cleanPath returns the canonical path for p, eliminating . and .. elements.
function cleanPath(p: string): string {
    if (p == "") {
        return "/"
    }
    if (!p.startsWith("/")) {
        p = "/" + p
    }
    let np = clean(p)
    // path.Clean removes trailing slash except for root;
    // put the trailing slash back if necessary.
    if (p.endsWith("/") && np != "/") {
        // Fast path for common case of p being the string we want:
        if (p.length == np.length + 1 && p.startsWith(np)) {
            np = p
        } else {
            np += "/"
        }
    }
    return np
}

// stripHostPort returns h without any trailing ":<port>".
function stripHostPort(hostport: string): string {

    let j = 0

    // The port starts after the last colon.
    let i = hostport.lastIndexOf(':')
    if (i < 0) {
        return hostport
    }
    let k = 0

    let host: string
    if (hostport[0] == '[') {
        // Expect the first ']' just before the last ':'.
        const end = hostport.indexOf(']', 1)
        if (end < 0) {
            return ""
        }
        switch (end + 1) {
            case hostport.length:
                // There can't be a ':' behind the ']' now.
                return ""
            case i:
                // The expected result.
                break
            default:
                // Either ']' isn't followed by a colon, or it is
                // followed by a colon that is not the last one.
                if (hostport[end + 1] == ':') {
                    return ""
                }
                return ""
        }
        host = hostport.substring(1, end)
        j = 1
        k = end + 1 // there can't be a '[' resp. ']' before these positions
    } else {
        host = hostport.substring(0, i)
        if (host.indexOf(':') >= 0) {
            return ""
        }
    }
    if (hostport.indexOf('[', j) >= 0) {
        return ""
    }
    if (hostport.indexOf(']', k) >= 0) {
        return ""
    }

    return host
}

function joinPathQuery(path: string, query: string): string {
    return query == "" ? path : `${path}?${query}`
}
export class ServeMux implements Handler {
    /**
     *  whether any patterns contain hostnames
     */
    private hosts_ = false
    private m_?: Record<string, MuxEntry>
    /**
     *  array of entries sorted from longest to shortest
     */
    private es_?: Array<MuxEntry>
    // shouldRedirectRLocked reports whether the given path and host should be redirected to
    // path+"/". This should happen if a handler is registered for path+"/" but
    // not path -- see comments at ServeMux.
    private _shouldRedirectRLocked(host: string, path: string): boolean {
        const m = this.m_
        if (m) {
            if (m[path]) {
                return false
            }
            host += path
            if (m[host]) {
                return false
            }
        }
        const n = path.length
        if (n == 0) {
            return false
        }
        if (m) {
            if (!path.endsWith("/")) {
                if (m[path + "/"]) {
                    return true
                }
                if (m[host + "/"]) {
                    return true
                }
            }
        }
        return false
    }
    // redirectToPathSlash determines if the given path needs appending "/" to it.
    // This occurs when a handler for path + "/" was already registered, but
    // not for path itself. If the path needs appending to, it creates a new
    // URL, setting the path to u.Path + "/" and returning true to indicate so.
    private _redirectToPathSlash(host: string, path: string, u: Uri): {
        url: string,
        path: string,
        ok: boolean
    } {
        if (!this._shouldRedirectRLocked(host, path)) {
            return {
                url: u.toString(),
                path: u.path,
                ok: false
            }
        }
        path += "/"
        return {
            url: joinPathQuery(path, u.query),
            path: path,
            ok: true,
        }
    }
    handler(r: Request): MuxEntry {
        // CONNECT requests are not canonicalized.
        const uri = r.uri
        if (r.method == Method.CONNECT) {
            const o = this._redirectToPathSlash(uri.host, uri.path, uri)
            if (o.ok) {
                return {
                    h: new RedirectHandler(o.url, StatusMovedPermanently),
                    pattern: o.path,
                }
            }
            return this._handler(r.host, uri.path)
        }

        // All other requests have any port stripped and path cleaned
        // before passing to mux.handler.
        const host = stripHostPort(r.host)
        const path = cleanPath(uri.path)

        // If the given path is /tree and its handler is not registered,
        // redirect for /tree/.
        const o = this._redirectToPathSlash(host, path, uri)
        if (o.ok) {
            return {
                h: new RedirectHandler(o.url, StatusMovedPermanently),
                pattern: o.path,
            }
        }
        if (path != r.uri.path) {
            const found = this._handler(host, path)
            return {
                h: new RedirectHandler(joinPathQuery(path, uri.query), StatusMovedPermanently),
                pattern: found.pattern,
            }
        }
        return this._handler(host, r.uri.path)
    }
    /**
     * Find a handler on a handler map given a path string.
     * Most-specific (longest) pattern wins.
     */
    private _match(path: string): MuxEntry | undefined {
        // Check for exact match first.
        const m = this.m_
        if (m) {
            const v = m[path]
            if (v) {
                return v
            }
        }
        // Check for longest valid match.  mux.es contains all patterns
        // that end in / sorted from longest to shortest.
        const es = this.es_
        if (es) {
            const length = es.length
            let e: MuxEntry
            for (let i = 0; i < length; i++) {
                e = es[i]
                if (path.startsWith(e.pattern)) {
                    return e
                }
            }
        }
    }
    private _handler(host: string, path: string): MuxEntry {
        // Host-specific pattern takes precedence over generic ones
        let h: MuxEntry | undefined
        if (this.hosts_) {
            h = this._match(host + path)
        }
        if (!h) {
            h = this._match(path)
        }
        return h ? h : _notFoundMuxEntry
    }
    serveHTTP(w: ResponseWriter, r: Request): void {
        if (!r.isValid) {
            return
        }
        if (deps.request_get_uri_s(r.r_) == "*") {
            w.header("Connection", "close")
            w.status(StatusBadRequest)
            return
        }

        const found = this.handler(r)
        found.h.serveHTTP(w, r)
    }
    handle(pattern: string, handler: Handler | ((w: ResponseWriter, r: Request) => void)): void {
        const t = typeof handler
        if (t == "function") {
            this._handle(pattern, new HandlerFunc(handler as any))
        }
        else if (t === "object" && typeof (handler as any).serveHTTP === "function") {
            this._handle(pattern, (handler as any))
        } else {
            throw new Error("http: invalid handler")
        }
    }
    private _handle(pattern: string, handler: Handler) {
        if (typeof pattern !== "string" || pattern == "") {
            throw new Error("http: invalid pattern")
        }
        let m = this.m_
        if (m) {
            if (m[pattern]) {
                throw new Error("http: multiple registrations for " + pattern)
            }
        } else {
            m = {}
            this.m_ = m
        }
        const e: MuxEntry = { h: handler, pattern: pattern }
        m[pattern] = e
        if (pattern.endsWith('/')) {
            const es = this.es_
            if (es) {
                const n = es.length
                const i = sortSearch(n, (i) => {
                    return es[i].pattern.length < e.pattern.length
                })
                if (n == i) {
                    es.push(e)
                } else {
                    es.splice(i, 0, e)
                }
            } else {
                this.es_ = [e]
            }
        }
        if (!pattern.startsWith('/')) {
            this.hosts_ = true
        }
    }
}
function sortSearch(n: number, f: (i: number) => boolean): number {
    // Define f(-1) == false and f(n) == true.
    // Invariant: f(i-1) == false, f(j) == true.
    let i = 0
    let j = n
    let h
    while (i < j) {
        // h := int(uint(i+j) >> 1) // avoid overflow when computing h
        h = Math.floor((i + j) / 2)
        // i ≤ h < j
        if (!f(h)) {
            i = h + 1 // preserves f(i-1) == false
        } else {
            j = h // preserves f(j) == true
        }
    }
    // i == j, f(i-1) == false, and f(j) (= f(i)) == true  =>  answer is i.
    return i
}

export class Websocket {
    private ws_?: deps.WSConn
    constructor(ws: deps.WSConn) {
        this.ws_ = ws
        ws.cbc = () => {
            const ws = this.ws_
            if (ws) {
                this.ws_ = undefined
            }

            const f = this.onCloseBind_
            if (f) {
                f()
            }
        }
        ws.cbm = (data) => {
            const f = this.onMessageBind_
            if (f) {
                f(data)
            }
        }
    }
    private _ws(): deps.WSConn {
        const ws = this.ws_
        if (!ws) {
            throw new Error("Websocket already closed")
        }
        return ws
    }
    write(data: string | Uint8Array) {
        const ws = this._ws()
        deps.ws_write(ws.p, data)
    }
    close(reason = 1000) {
        const ws = this.ws_
        if (ws) {
            this.ws_ = undefined
            deps.ws_close(ws, reason)
        }
    }
    private onClose_?: () => void
    private onCloseBind_?: () => void
    get onClose(): undefined | (() => void) {
        return this.onClose_
    }
    set onClose(v: undefined | (() => void)) {
        if (typeof v === "function") {
            const bind = v.bind(this)

            if (this.onClose_) {
                this.onClose_ = v
                this.onCloseBind_ = bind
            } else {
                this.onClose_ = v
                this.onCloseBind_ = bind

                const ws = this.ws_
                if (ws) {
                    deps.ws_cbc(ws.p, true)
                }
            }
        } else {
            if (this.onClose_) {
                this.onClose_ = undefined
                this.onCloseBind_ = undefined
                const ws = this.ws_
                if (ws) {
                    deps.ws_cbc(ws.p, false)
                }
            }
        }
    }
    private onMessage_?: (data: string | Uint8Array) => void
    private onMessageBind_?: (data: string | Uint8Array) => void
    get onMessage(): undefined | ((data: string | Uint8Array) => void) {
        return this.onMessage_
    }
    set onMessage(v: undefined | ((data: string | Uint8Array) => void)) {
        if (typeof v === "function") {
            const bind = v.bind(this)

            if (this.onMessage_) {
                this.onMessage_ = v
                this.onMessageBind_ = bind
            } else {
                this.onMessage_ = v
                this.onMessageBind_ = bind

                const ws = this.ws_
                if (ws) {
                    deps.ws_cbm(ws.p, true)
                }
            }
        } else {
            if (this.onMessage_) {
                this.onMessage_ = undefined
                this.onMessageBind_ = undefined
                const ws = this.ws_
                if (ws) {
                    deps.ws_cbm(ws.p, false)
                }
            }
        }
    }
}
export let defaultUserAgent = `ejs-${__duk.os}-${__duk.arch}-client/1.1`
export interface HttpConnOptions {
    host?: string
    ip: string
    port?: number
    resolver: Resolver
    tls?: TlsConfig
}
export class HttpConn {
    private tls_?: deps.Tls
    private resolver_?: Resolver
    private host_: string
    private c_?: deps.HttpClient
    private cb_?: (e?: Error) => void
    protected request_?: deps.HttpRequest
    constructor(opts: HttpConnOptions) {
        let tls: any
        const tlsConfig = opts.tls
        if (tlsConfig) {
            tls = deps.create_tls(tlsConfig)
            this.host_ = opts.host ?? tlsConfig.serverName ?? opts.ip
            this.tls_ = tls
        } else {
            this.host_ = opts.host ?? opts.ip
        }
        this.resolver_ = opts.resolver
        const c = deps.create_http_client({
            host: opts.ip,
            port: opts.port,
            tls: tls?.p,
            resolver: (opts.resolver as any).native().p,
        })
        c.cbc = () => {
            if (this.tls_) {
                this.tls_ = undefined
            }
            if (this.resolver_) {
                this.resolver_ = undefined
            }
            if (this.c_) {
                this.c_ = undefined
                const cb = this.cb_
                if (cb) {
                    this.cb_ = undefined
                    this.request_ = undefined
                    cb(new Error("HTTP_EOF"))
                }
            }
        }
        c.cb = (err) => {
            this._cb(false, err)
        }
        this.c_ = c
    }
    close() {
        const c = this.c_
        if (c) {
            this.c_ = undefined
            if (this.tls_) {
                this.tls_ = undefined
            }
            if (this.resolver_) {
                this.resolver_ = undefined
            }
            if (this.do_) {
                this.delayed_ = c
            } else {
                deps.close_http_client(c)
                this._cb(true)
            }
        }
    }
    private _cb(closed: boolean, err?: number) {
        const cb = this.cb_
        if (!cb) {
            return
        }
        this.cb_ = undefined
        this.request_ = undefined

        if (closed) {
            cb(new Error("HttpConn already closed"))
        } else if (err === undefined) {
            cb()
        } else {
            let e: Error
            switch (err) {
                case deps.HTTP_TIMEOUT:
                    e = new Error('HTTP_TIMEOUT')
                    break
                case deps.HTTP_EOF:
                    e = new Error('HTTP_EOF')
                    break
                case deps.HTTP_INVALID_HEADER:
                    e = new Error('HTTP_INVALID_HEADER')
                    break
                case deps.HTTP_BUFFER_ERROR:
                    e = new Error('HTTP_BUFFER_ERROR')
                    break
                case deps.HTTP_REQUEST_CANCEL:
                    e = new Error('HTTP_REQUEST_CANCEL')
                    break
                case deps.HTTP_DATA_TOO_LONG:
                    e = new Error('HTTP_DATA_TOO_LONG')
                    break
                default:
                    e = new Error("HTTP_UNKNOW_ERROR")
                    break
            }
            cb(e)
        }
    }
    private do_ = 0
    private delayed_?: deps.HttpClient
    do(a: any, b: any) {
        const { co, cb, opts } = parseArgs<RequestOptions, (r?: Response, e?: any) => void>("HttpConn do", a, b)
        if (co) {
            return co.yield((notify) => {
                this._do(opts!, (r, e) => {
                    this.do_++
                    if (e) {
                        notify.error(e)
                    } else {
                        notify.value(r)
                    }
                    if (!(--this.do_)) {
                        const c = this.delayed_
                        if (c) {
                            this.delayed_ = undefined
                            setImmediate(() => {
                                deps.close_http_client(c)
                                this._cb(true)
                            })
                        }
                    }
                })
            })
        } else if (cb) {
            this._do(opts!, cb)
        } else {
            return new Promise((resolve, reject) => {
                this._do(opts!, (r, e) => {
                    if (e) {
                        reject(e)
                    } else {
                        resolve(r)
                    }
                })
            })
        }
    }
    create() {
        const c = this.c_
        if (!c) {
            throw new Error("HttpConn already closed")
        }
        return deps.create_http_request(c.p)
    }
    private _do(opts: RequestOptions, callback: (r?: Response, e?: any) => void) {
        const c = this.c_
        if (!c) {
            throw new Error("HttpConn already closed")
        }
        if (this.cb_) {
            throw new Error("HttpConn busy")
        }
        const r = deps.create_http_request(c.p)
        try {
            const header = opts.header
            let host = false
            let userAgent = false
            let accept = false
            let connection = false
            const h = deps.request_output_header(r.p)
            if (header) {
                for (const key in header) {
                    if (Object.prototype.hasOwnProperty.call(header, key)) {
                        const v = header[key]
                        if (Array.isArray(v)) {
                            if (v.length == 0) {
                                continue
                            }
                            for (let i = 0; i < v.length; i++) {
                                deps.header_add(h, key, v[i])
                            }
                        } else {
                            deps.header_add(h, key, v)
                        }

                        const lower = key.toLowerCase()
                        if (lower === "host") {
                            host = true
                        } else if (lower === "user-agent") {
                            userAgent = true
                        } else if (lower === "accept") {
                            accept = true
                        } else if (lower == "connection") {
                            connection = true
                        }
                    }
                }
            }
            if (!host) {
                deps.header_add(h, "Host", this.host_)
            }
            if (!userAgent) {
                deps.header_add(h, "User-Agent", defaultUserAgent)
            }
            if (!accept) {
                deps.header_add(h, "Accept", "*/*")
            }
            if (!connection) {
                deps.header_add(h, "Connection", "keep-alive")
            }
            const resp = Response.create(r)
            const cb = (e?: Error) => {
                this.cb_ = undefined
                this.request_ = undefined
                if (e === undefined) {
                    callback(resp)
                } else {
                    callback(undefined, e)
                }
            }
            this.cb_ = cb
            this.request_ = r
            deps.do_http_request(
                c.p,
                r,
                opts.path ?? '/',
                opts.method ?? deps.GET,
            )

        } catch (e) {
            this.cb_ = undefined
            this.request_ = undefined
            deps.close_http_request(r)
            throw e
        }
    }
}
export interface RequestOptions {
    limit?: number
    path?: string
    method?: Method
    header?: Record<string, string | Array<string>>
    body?: string | Uint8Array | ArrayBuffer
    signal?: AbortSignal
}
export class Response {
    static create(req: deps.HttpRequest | undefined): Response {
        const flags = deps.create_flags()
        flags[0] = 1
        return new Response(req, {
            expired: flags,
        })
    }
    private constructor(private req_: deps.HttpRequest | undefined, private shared_: RequestShared) {
    }
    close(): void {
        const f = this.shared_.expired
        if (f[0]) {
            f[0] = 0
            const r = this.req_!
            this.req_ = undefined
            deps.close_http_request(r)
        }
    }
    get isValid(): boolean {
        const f = this.shared_.expired
        return f[0] ? true : false
    }
    private _get(): deps.HttpRequest {
        const f = this.shared_.expired
        if (f[0]) {
            return this.req_!
        }
        throw new Error("Response expired")
    }
    get statusCode(): number {
        return deps.get_response_code(this._get().p)
    }
    get status(): string {
        return deps.get_response_code_line(this._get().p)
    }
    get header(): Header {
        return getRequestInputHeader(this._get().p, this.shared_)
    }
    private buufer_?: Uint8Array
    get body(): Uint8Array {
        let buf = this.buufer_
        if (!buf) {
            buf = deps.get_response_body(this._get().p)
            this.buufer_ = buf
        }
        return buf
    }
    get text(): string {
        return new TextDecoder().decode(this.body)
    }
    get json(): string {
        return JSON.parse(this.text)
    }
}