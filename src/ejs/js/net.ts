

declare namespace __duk {
    class Error {
        constructor(message?: string)
    }
    class OsError extends Error { }
}
declare namespace deps {
    const ETIMEDOUT: number
    function copy(dst: Uint8Array, src: Uint8Array): number
    function eq(a: Uint8Array, b: Uint8Array): boolean
    function hex_string(b: Uint8Array): string
    function ip_string(ip: Uint8Array): string
    function parse_ip(s: string): Uint8Array | undefined
    function ip_4in6(ip: Uint8Array): boolean
    function ip_equal(a: Uint8Array, b: Uint8Array): boolean
    function ip_mask(mask: Uint8Array, ip: Uint8Array): Uint8Array | undefined
    function networkNumberAndMask(ip: Uint8Array, mask: Uint8Array): [Uint8Array, Uint8Array] | undefined
    function cidr_mask(ones: number, bits: number): Uint8Array | undefined
    function mask_size(mask: Uint8Array): [number, number]
    function ipnet_contains(net_ip: Uint8Array, mask: Uint8Array, ip: Uint8Array): boolean
    function ipnet_string(net_ip: Uint8Array, mask: Uint8Array): string
    function parse_cidr(s: string): { ip: Uint8Array, mask: Uint8Array } | undefined

    class evbuffer {
        readonly __id = "evbuffer"
    }
    function evbuffer_len(b: evbuffer): number
    function evbuffer_read(b: evbuffer, dst: Uint8Array): number
    function evbuffer_copy(b: evbuffer, dst: Uint8Array, skip?: number): number
    function evbuffer_drain(b: evbuffer, n: number): number

    const BEV_EVENT_CONNECTED: number
    const BEV_EVENT_WRITING: number
    const BEV_EVENT_READING: number
    const BEV_EVENT_TIMEOUT: number
    const BEV_EVENT_EOF: number
    const BEV_EVENT_ERROR: number

    function socket_error(err: number): string

    interface ConnMetadata {
        /**
         * max write bytes
         */
        mw: number
    }

    class TcpConn {
        readonly __id = "TcpConn"

        busy?: boolean
        cbw: () => void
        cbr: (b: evbuffer) => void
        cbe?: (what: number, err?: number) => void
        md: ConnMetadata
        p: unknown
    }
    class TcpListenerOptions {
        remoteIP?: string
        remotePort?: number
        localIP?: string
        localPort?: number
    }
    class TcpListener {
        readonly __id = "TcpListener"
        cb?: (c?: TcpConn, opts?: TcpListenerOptions, e?: string) => void
        err?: (e: any) => void
    }
    interface TcpListenerOptions {
        ip?: string
        v6?: boolean
        port: number
        backlog: number
        sync: boolean
        tls?: deps.ServerTls
    }
    function tcp_listen(opts: TcpListenerOptions): TcpListener
    function tcp_listen_close(l: TcpListener): void
    function tcp_listen_cb(l: TcpListener, enable: boolean): void
    function tcp_listen_err(l: TcpListener, enable: boolean): void
    function tcp_conn_stash(c: TcpConn, put: boolean): void
    function tcp_conn_pop_stash(p: unknown): void
    function tcp_conn_close(c: TcpConn): void
    function tcp_conn_write(c: TcpConn, data: string | Uint8Array | ArrayBuffer): number | undefined
    function tcp_conn_cb(c: TcpConn, enable: boolean): void
    function tcp_conn_localAddr(c: TcpConn): [string, number]
    interface TcpConnectOptions {
        ip: string
        v6: boolean
        port: number
        tls: unknown
    }
    function tcp_conect(opts: TcpConnectOptions): TcpConn


    interface UnixListenerOptions {
        address: string
        backlog: number
        sync: boolean
        tls?: ServerTls
    }
    function unix_listen(opts: UnixListenerOptions): TcpListener
    interface UnixConnectOptions {
        name: string
        tls: unknown
    }
    function unix_conect(opts: UnixConnectOptions): TcpConn

    class Resolve {
        readonly __id = "Resolve"
    }
    class Resolver {
        readonly __id = "Resolver"
    }
    interface ResolverOptions {
        /**
         * upstream domain name server ip
         */
        nameserver?: Array<string>
        /**
         * Whether to load the dns server set by the system default settings
         * @remarks
         * Under Linux, the settings in /etc/resolv.conf will be loaded.
         * @default true
         */
        system?: boolean
    }
    function resolver_new(opts: ResolverOptions): Resolver
    function resolver_free(r: Resolver): void
    interface ResolverResult {
        ip?: Array<string>
        v6?: boolean
    }
    interface ResolverIPOptions {
        r: Resolver
        name: string
        v6: boolean
        cb: (v?: ResolverResult, result?: number, msg?: string) => void
    }
    function resolver_ip(opts: ResolverIPOptions): Resolve
    function resolver_ip_cancel(r: Resolve): void

    class UdpAddr {
        readonly __id = "UdpAddr"
        s?: string
    }
    function udp_addr(ip: string, port: number): UdpAddr
    function udp_addr_copy(dst: UdpAddr, src: UdpAddr): void
    function udp_addr_s(addr: UdpAddr): string
    class UdpConn {
        readonly __id = "UdpConn"
        md: ConnMetadata
        cb: () => void

        addr?: UdpAddr
    }
    interface UdpConnOptions {
        v6?: boolean
    }
    function udp_create(opts?: UdpConnOptions): UdpConn
    function udp_connect(conn: UdpConn, remoteAddr: UdpAddr): UdpAddr
    function udp_bind(conn: UdpConn, localAddr: UdpAddr): UdpAddr
    function udp_close(c: UdpConn): void
    function udp_localAddr(c: UdpConn): [string, number]
    function udp_write(c: UdpConn, data: string | Uint8Array | ArrayBuffer, remote?: UdpAddr): number
    function udp_conn_cb(c: UdpConn, enable: boolean): void
    interface UdpListenOptions {
        ip?: string
        port: number
        v6?: boolean
    }
    function udp_listen(opts: UdpListenOptions): UdpConn
    function udp_dial(opts: UdpListenOptions): UdpConn

    interface UdpReadOptions {
        c: UdpConn
        dst: Uint8Array
        addr?: deps.UdpAddr // in out

        out?: boolean // if true, out to addr
    }
    function udp_read(opts: UdpReadOptions): number

    let _ipv6: undefined | boolean
    function support_ipv6(): boolean
    let _ipv4: undefined | boolean
    function support_ipv4(): boolean

    function mbedtls_debug(v: number): void

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

    interface Certificate {
        cert: string
        key: string
        password?: string
    }
    interface ServerTlsConfig {
        /**
         * @default Tls12
         */
        minVersion?: number
        /**
         * @default Tls13
         */
        maxVersion?: number

        certificate?: Array<Certificate>

        debug?: boolean
    }
    class ServerTls {
        readonly __id = "ServerTls"
        p: unknown
    }
    function create_server_tls(config: ServerTlsConfig): ServerTls

    interface AsyncOptions {
        post?: boolean
    }
    function load_certificate(): string
    function load_certificate(opts: AsyncOptions, cb: (s?: string, e?: any) => void): void
}
import { parseArgs, parseOptionalArgs, callReturn, callVoid, coReturn, isYieldContext } from "ejs/sync";
export class AddrError extends __duk.Error {
    constructor(readonly addr: string, message: string) {
        super(message);
        (this as any).name = "AddrError"
    }
}
export class NetError extends __duk.Error {
    constructor(message: string) {
        super(message);
        (this as any).name = "NetError"
    }
    /**
     * If true, it means that this is an error that occurred when connecting to the server.
     */
    connect?: boolean
    /**
     * If true, it means that this is an error that occurred while reading the data.
     */
    read?: boolean
    /**
     * If true it means this is an error that occurred while writing data
     */
    write?: boolean

    /**
     * If true, it means that the connection/read/write timeout occurred
     */
    timeout?: boolean
    /**
     * If true, it means that read/write encountered eof
     */
    eof?: boolean

    /**
     * Request canceled
     */
    cancel?: boolean
}
export const IPv4len = 4;
export const IPv6len = 16;
/**
 * An IPMask is a bitmask that can be used to manipulate IP addresses for IP addressing and routing.
 */
export class IPMask {
    constructor(readonly mask: Uint8Array) { }
    /**
     * returns the IP mask (in 4-byte form) of the IPv4 mask a.b.c.d.
     */
    static v4(a: number, b: number, c: number, d: number): IPMask {
        return new IPMask(new Uint8Array([a, b, c, d]))
    }
    /**
     * returns an IPMask consisting of 'ones' 1 bits followed by 0s up to a total length of 'bits' bits.
     */
    static cidr(ones: number, bits: number): IPMask | undefined {
        const mask = deps.cidr_mask(ones, bits)
        if (mask) {
            return new IPMask(mask)
        }
    }
    get length(): number {
        return this.mask.length
    }
    toString(): string {
        if (this.mask.length == 0) {
            return "<undefined>"
        }
        return deps.hex_string(this.mask)
    }
    /**
     * returns the number of leading ones and total bits in the mask.
     * @remarks
     * If the mask is not in the canonical form--ones followed by zeros--then returns [0,0]
     * @returns [ones:number, bits:number]
     */
    size(): [number, number] {
        return deps.mask_size(this.mask)
    }
}
const classAMask = IPMask.v4(0xff, 0, 0, 0);
const classBMask = IPMask.v4(0xff, 0xff, 0, 0)
const classCMask = IPMask.v4(0xff, 0xff, 0xff, 0)

/**
 * An IP is a single IP address. Accept either 4-byte (IPv4) or 16-byte (IPv6) Uint8Array as input.
 */
export class IP {
    constructor(readonly ip: Uint8Array) { }
    static v4bcast = IP.v4(255, 255, 255, 255); // limited broadcast
    static v4allsys = IP.v4(224, 0, 0, 1); // all systems
    static v4allrouter = IP.v4(224, 0, 0, 2); // all routers
    static v4zero = IP.v4(0, 0, 0, 0); // all zeros

    static v6zero = new IP(
        new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    );
    static v6unspecified = new IP(
        new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0]),
    );
    static v6loopback = new IP(
        new Uint8Array([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1]),
    );
    static v6interfacelocalallnodes = new IP(
        new Uint8Array([0xff, 0x01, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01]),
    );
    static v6linklocalallnodes = new IP(
        new Uint8Array([0xff, 0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x01]),
    );
    static v6linklocalallrouters = new IP(
        new Uint8Array([0xff, 0x02, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0x02]),
    );

    /**
     * returns the IP address (in 16-byte form) of the IPv4 address a.b.c.d.
     */
    static v4(a: number, b: number, c: number, d: number): IP {
        const p = new Uint8Array([
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0,
            0xff,
            0xff,
            a,
            b,
            c,
            d,
        ]);
        return new IP(p);
    }
    /**
     * parses s as an IP address, returning the result.
     * @remarks
     * The string s can be in IPv4 dotted decimal ("192.0.2.1"), IPv6 ("2001:db8::68"), or IPv4-mapped IPv6 ("::ffff:192.0.2.1") form.
     * If s is not a valid textual representation of an IP address, parse returns nil.
     */
    static parse(s: string): IP | undefined {
        const ip = deps.parse_ip(s)
        if (ip) {
            return new IP(ip)
        }
    }
    get length(): number {
        return this.ip.length
    }

    /**
     * returns the default IP mask for the IP address ip.
     * @remarks
     * Only IPv4 addresses have default masks; DefaultMask returns undefined if ip is not a valid IPv4 address.
     */
    defaultMask(): IPMask | undefined {
        const b = this.ip
        let v: number = 0
        switch (b.length) {
            case IPv4len:
                v = b[0]
                break
            case IPv6len:
                if (!deps.ip_4in6(b)) {
                    return
                }
                v = b[12];
                break
            default:
                break
        }
        if (v < 0x80) {
            return classAMask
        } else if (v < 0xC0) {
            return classBMask
        }
        return classCMask
    }
    /**
     * reports whether ip and o are the same IP address. An IPv4 address and that same address in IPv6 form are considered to be equal.
     */
    equal(o: IP): boolean {
        return deps.ip_equal(this.ip, o.ip)
    }
    /**
     * reports whether ip is a global unicast address.
     * @remarks
     * The identification of global unicast addresses uses address type
     * identification as defined in RFC 1122, RFC 4632 and RFC 4291 with
     * the exception of IPv4 directed broadcast addresses.
     * It returns true even if ip is in IPv4 private address space or
     * local IPv6 unicast address space.
     */
    get isGlobalUnicast(): boolean {
        return (this.length == IPv4len || this.length == IPv6len) &&
            !this.equal(IP.v4bcast) &&
            !this.isUnspecified &&
            !this.isLoopback &&
            !this.isMulticast &&
            !this.isLinkLocalUnicast
    }
    /**
     * reports whether ip is an interface-local multicast address.
     */
    get isInterfaceLocalMulticast(): boolean {
        const ip = this.ip
        return ip.length == IPv6len &&
            ip[0] == 0xff &&
            (ip[1] & 0x0f) == 0x01
    }
    /**
     * reports whether ip is a link-local multicast address.
     */
    get isLinkLocalMulticast(): boolean {
        const ip4 = this.to4()
        if (ip4) {
            const ip = ip4.ip
            return ip[0] == 224 && ip[1] == 0 && ip[2] == 0
        }
        const ip = this.ip
        return ip.length == IPv6len && ip[0] == 0xff && (ip[1] & 0x0f) == 0x02
    }
    /**
     * reports whether ip is a link-local unicast address.
     */
    get isLinkLocalUnicast(): boolean {
        const ip4 = this.to4()
        if (ip4) {
            const ip = ip4.ip
            return ip[0] == 169 && ip[1] == 254
        }
        const ip = this.ip
        return ip.length == IPv6len && ip[0] == 0xfe && (ip[1] & 0xc0) == 0x80
    }
    /**
     * reports whether ip is a loopback address.
     */
    get isLoopback(): boolean {
        const ip4 = this.to4()
        if (ip4) {
            return ip4.ip[0] == 127
        }
        return this.equal(IP.v6loopback)
    }
    /**
     * reports whether ip is a multicast address.
     */
    get isMulticast(): boolean {
        const ip4 = this.to4()
        if (ip4) {
            return (ip4.ip[0] & 0xf0) == 0xe0
        }
        const ip = this.ip
        return ip.length == IPv6len && ip[0] == 0xff
    }
    /**
     * reports whether ip is a private address, according to RFC 1918 (IPv4 addresses) and RFC 4193 (IPv6 addresses).
     */
    get isPrivate(): boolean {
        const ipv4 = this.to4()
        if (ipv4) {
            // Following RFC 1918, Section 3. Private Address Space which says:
            //   The Internet Assigned Numbers Authority (IANA) has reserved the
            //   following three blocks of the IP address space for private internets:
            //     10.0.0.0        -   10.255.255.255  (10/8 prefix)
            //     172.16.0.0      -   172.31.255.255  (172.16/12 prefix)
            //     192.168.0.0     -   192.168.255.255 (192.168/16 prefix)
            const ip4 = ipv4.ip
            return ip4[0] == 10 ||
                (ip4[0] == 172 && (ip4[1] & 0xf0) == 16) ||
                (ip4[0] == 192 && ip4[1] == 168)
        }
        // Following RFC 4193, Section 8. IANA Considerations which says:
        //   The IANA has assigned the FC00::/7 prefix to "Unique Local Unicast".
        const ip = this.ip
        return ip.length == IPv6len && (ip[0] & 0xfe) == 0xfc
    }
    /**
     * reports whether ip is an unspecified address, either the IPv4 address "0.0.0.0" or the IPv6 address "::".
     */
    get isUnspecified(): boolean {
        return this.equal(IP.v4zero) || this.equal(IP.v6unspecified)
    }
    /**
     * If ip is an IPv4 or IPv6 address, returns true.
     */
    get isValid(): boolean {
        return this.ip.length == IPv4len || this.ip.length == IPv6len
    }
    /**
     * If ip is an IPv4 address, returns true.
     */
    get isV4(): boolean {
        return this.ip.length == IPv4len || (
            this.ip.length == IPv6len && deps.ip_4in6(this.ip)
        )
    }
    /**
     * If ip is an IPv6 address, returns true.
     */
    get isV6(): boolean {
        return this.ip.length == IPv6len && !deps.ip_4in6(this.ip)
    }
    /**
     * converts the IPv4 address ip to a 4-byte representation.
     * @remarks
     * If ip is not an IPv4 address, To4 returns nil.
     */
    to4(): IP | undefined {
        const ip = this.ip;
        if (ip.length == IPv4len) {
            return this;
        }
        const ret = deps.ip_4in6(ip)
        if (ret) {
            return new IP(ip.subarray(12, 16))
        }
    }

    /**
     * converts the IP address ip to a 16-byte representation.
     * @remarks
     * If ip is not an IP address (it is the wrong length), to16 returns undefined.
     */
    to16(): IP | undefined {
        const ip = this.ip;
        if (ip.length == IPv4len) {
            return IP.v4(ip[0], ip[1], ip[2], ip[3]);
        }
        if (ip.length == IPv6len) {
            return this;
        }
        return;
    }

    /**
     * returns the string form of the IP address ip.
     * @remarks 
     * It returns one of 4 forms:
     *   - "<undefined>", if ip has length 0
     *   - dotted decimal ("192.0.2.1"), if ip is an IPv4 or IP4-mapped IPv6 address
     *   - IPv6 ("2001:db8::1"), if ip is a valid IPv6 address
     *   - the hexadecimal form of ip, without punctuation, if no other cases apply
     */
    toString(): string {
        return deps.ip_string(this.ip)
    }

    /**
     * returns the result of masking the IP address ip with mask.
     */
    mask(mask: IPMask): IP | undefined {
        const ip = deps.ip_mask(mask.mask, this.ip)
        if (ip) {
            return new IP(ip)
        }
    }
}
/**
 * An IPNet represents an IP network.
 */
export class IPNet {
    constructor(readonly ip: IP, readonly mask: IPMask) { }
    /**
     * returns the address's network name, "ip+net".
     */
    readonly network = "ip+net"
    /**
     * reports whether the network includes ip.
     */
    contains(ip: IP): boolean {
        return deps.ipnet_contains(this.ip.ip, this.mask.mask, ip.ip)
    }
    /**
     * returns the CIDR notation of n like "192.0.2.0/24" or "2001:db8::/48" as defined in RFC 4632 and RFC 4291.
     * 
     * @remarks
     * If the mask is not in the canonical form, it returns the string which consists of an IP address, followed by a slash character and a mask expressed as hexadecimal form with no punctuation like "198.51.100.0/c000ff00".
     */
    toString(): string {
        return deps.ipnet_string(this.ip.ip, this.mask.mask)
    }
}

/**
 * parses s as a CIDR notation IP address and prefix length, like "192.0.2.0/24" or "2001:db8::/32", as defined in RFC 4632 and RFC 4291.
 * 
 * @remarks
 * It returns the IP address and the network implied by the IP and prefix length.
 * 
 * For example, parseCIDR("192.0.2.1/24") returns the IP address 192.0.2.1 and the network 192.0.2.0/24.
 * 
 */
export function parseCIDR(s: string): [IP, IPNet] | undefined {
    const o = deps.parse_cidr(s)
    if (o) {
        const ip = new IP(o.ip)
        const mask = new IPMask(o.mask)
        const ipnet = new IPNet(ip.mask(mask)!, mask)
        return [ip, ipnet]
    }
}

/**
 * combines host and port into a network address of the
 * form "host:port". If host contains a colon, as found in literal
 * IPv6 addresses, then JoinHostPort returns "[host]:port".
 */
export function joinHostPort(host: string, port: string | number): string {
    // We assume that host is a literal IPv6 address if host has
    // colons.
    if (host.indexOf(':') >= 0) {
        return `[${host}]:${port}`
    }
    return `${host}:${port}`
}

const missingPort = "missing port in address"
const tooManyColons = "too many colons in address"
/**
 * SplitHostPort splits a network address of the form "host:port",
 * "host%zone:port", "[host]:port" or "[host%zone]:port" into host or
 * host%zone and port.
 * 
 *  A literal IPv6 address in hostport must be enclosed in square
 * brackets, as in "[::1]:80", "[::1%lo0]:80".
 */
export function splitHostPort(hostport: string): [string, string] {
    let j = 0
    let k = 0

    // The port starts after the last colon.
    let i = hostport.lastIndexOf(':')
    if (i < 0) {
        throw new AddrError(hostport, missingPort)
    }
    let host: string
    let port: string
    if (hostport[0] == '[') {
        // Expect the first ']' just before the last ':'.
        const end = hostport.indexOf(']', 1)
        if (end < 0) {
            throw new AddrError(hostport, "missing ']' in address")
        }
        switch (end + 1) {
            case hostport.length:
                // There can't be a ':' behind the ']' now.
                throw new AddrError(hostport, missingPort)
            case i:
                // The expected result.
                break
            default:
                // Either ']' isn't followed by a colon, or it is
                // followed by a colon that is not the last one.
                if (hostport[end + 1] == ':') {
                    throw new AddrError(hostport, tooManyColons)
                }
                throw new AddrError(hostport, missingPort)
        }
        host = hostport.substring(1, end)
        j = 1
        k = end + 1 // there can't be a '[' resp. ']' before these positions
    } else {
        host = hostport.substring(0, i)
        if (host.indexOf(':') >= 0) {
            throw new AddrError(hostport, tooManyColons)
        }
    }
    if (hostport.indexOf('[', j) >= 0) {
        throw new AddrError(hostport, "unexpected '[' in address")
    }
    if (hostport.indexOf(']', k) >= 0) {
        throw new AddrError(hostport, "unexpected ']' in address")
    }

    port = hostport.substring(i + 1)
    return [host, port]
}

/**
 * for test
 * @internal
 */
export function networkNumberAndMask(n: IPNet): [IP, IPMask] | undefined {
    const o = deps.networkNumberAndMask(n.ip.ip, n.mask.mask)
    if (o) {
        const [ip, mask] = o
        return [new IP(ip), new IPMask(mask)]
    }
    return
}
export interface ResolveOptions {
    /**
     * Name to be queried
     */
    name: string
    /**
     * A signal that can be used to cancel resolve
     */
    signal?: AbortSignal
    /**
     * If not set, ipv4 and ipv6 will be queried at the same time, but only the result queried first will be called back.
     */
    v6?: boolean
}
export interface ResolveResult {
    ip?: Array<string>
    v6?: boolean
}


export type AbortListener = (this: AbortSignal, reason: any) => any
/** 
 * A signal object that allows you to communicate with a request and abort it if required via an AbortController object.
 */
export class AbortSignal {
    static _abort(signal: AbortSignal, reason?: any) {
        if (signal.aborted_) {
            return
        }
        signal.aborted_ = true
        signal.reason_ = reason
        const listeners = signal.listeners_
        if (!listeners) {
            return
        }
        signal.listeners_ = undefined
        const length = listeners.length
        for (let i = 0; i < length; i++) {
            listeners[i].bind(signal)(reason)
        }
    }
    private aborted_ = false
    /** 
     * Returns true if this AbortSignal's AbortController has signaled to abort,
     * and false otherwise. 
     */
    get aborted(): boolean {
        return this.aborted_
    }
    private reason_: any
    get reason(): any {
        return this.reason_
    }
    private listeners_?: Array<AbortListener>
    addEventListener(listener: AbortListener): void {
        const listeners = this.listeners_
        if (!listeners) {
            this.listeners_ = [listener]
            return
        }
        const length = listeners.length
        for (let i = 0; i < length; i++) {
            if (listeners[i] == listener) {
                return
            }
        }
        listeners.push(listener)
    }
    removeEventListener(listener: AbortListener): void {
        const listeners = this.listeners_
        if (!listeners || listeners.length == 0) {
            return
        }
        const length = listeners.length
        for (let i = 0; i < length; i++) {
            if (listeners[i] == listener) {
                listeners.splice(i, 1)
                return
            }
        }
    }
    /** 
     * Throws this AbortSignal's abort reason, if its AbortController has
     * signaled to abort; otherwise, does nothing. 
     */
    throwIfAborted(): void {
        if (this.aborted_) {
            throw this.reason_
        }
    }
}
/**
 * A controller object that allows you to abort one or more requests as and when desired.
 */
export class AbortController {
    /** 
     * Returns the AbortSignal object associated with this object. 
     */
    readonly signal = new AbortSignal()
    /** 
     * Invoking this method will set this object's AbortSignal's aborted flag and
     * signal to any observers that the associated activity is to be aborted. 
     */
    abort(reason?: any): void {
        AbortSignal._abort(this.signal, reason)
    }
}

function throwResolverError(e: any): never {
    if (typeof e === "string") {
        throw new ResolverError(e)
    }
    throw e
}
export class ResolverError extends NetError {
    constructor(message: string) {
        super(message);
        (this as any).name = "ResolverError"
    }
    /**
     * resolve result
     */
    result?: number
}

class Resolve4or6 {
    cb?: (v?: ResolveResult, e?: any) => void

    v4?: deps.Resolve
    v6?: deps.Resolve
    err?: ResolverError
    v?: deps.ResolverResult
    constructor(readonly r: deps.Resolver, readonly opts: ResolveOptions, cb?: (v?: ResolveResult, e?: any) => void) {
        this.cb = cb
    }
    private _cancel() {
        let req = this.v4
        if (req) {
            this.v4 = undefined
            deps.resolver_ip_cancel(req)
        }
        req = this.v6
        if (req) {
            this.v6 = undefined
            deps.resolver_ip_cancel(req)
        }
    }
    resolve() {
        const opts = this.opts
        const signal = opts.signal
        let onAbort: AbortListener | undefined
        if (signal) {
            onAbort = (reason) => {
                const cb = this.cb
                if (!cb) {
                    return
                }
                this.cb = undefined
                this._cancel()

                cb(undefined, reason)
            }
            signal.addEventListener(onAbort)
        }

        try {
            const r = this.r
            const onip = (v6: boolean, v?: deps.ResolverResult, result?: number, msg?: string) => {
                const cb = this.cb
                if (!cb) {
                    return
                }
                if (v6) {
                    this.v6 = undefined
                } else {
                    this.v4 = undefined
                }
                if (result) {
                    let err = this.err
                    if (err) { // 2 request end
                        this.cb = undefined
                        this._cancel()
                        if (onAbort) {
                            signal!.removeEventListener(onAbort)
                        }
                        cb(undefined, err)
                        return
                    }

                    err = new ResolverError(msg!)
                    this.err = err
                    if (result == 69) {
                        err.cancel = true
                    }
                    err.result = result

                    if (this.v) { // 2 request end
                        this.cb = undefined
                        this._cancel()
                        if (onAbort) {
                            signal!.removeEventListener(onAbort)
                        }
                        cb(undefined, err)
                    }
                    return
                } else if (!v!.ip) {
                    const err = this.err
                    if (err) { // 2 request end
                        this.cb = undefined
                        this._cancel()
                        if (onAbort) {
                            signal!.removeEventListener(onAbort)
                        }
                        cb(undefined, err)
                        return
                    }
                    this.v = v
                    return
                }

                this.cb = undefined
                this._cancel()
                if (onAbort) {
                    signal!.removeEventListener(onAbort)
                }
                cb(v, undefined)
            }
            this.v4 = deps.resolver_ip({
                r: r,
                name: opts.name,
                v6: false,
                cb: (v, result, msg) => {
                    onip(false, v, result, msg)
                },
            })
            this.v6 = deps.resolver_ip({
                r: r,
                name: opts.name,
                v6: true,
                cb: (ip, result, msg) => {
                    onip(true, ip, result, msg)
                },
            })
        } catch (e) {
            this.cb = undefined
            this._cancel()

            if (onAbort) {
                signal!.removeEventListener(onAbort)
            }
            throwResolverError(e)
        }
    }
}

export class Resolver {
    private r_?: deps.Resolver
    constructor(opts: deps.ResolverOptions = { system: true }) {
        const r = deps.resolver_new(opts)
        this.r_ = r
    }
    native() {
        return this.r_
    }
    get isClosed() {
        return this.r_ ? false : true
    }
    close() {
        const r = this.r_
        if (r) {
            this.r_ = undefined
            deps.resolver_free(r)
        }
    }

    resolve(opts: ResolveOptions, cb: (v?: ResolveResult, e?: any) => void): void {
        const r = this.r_
        if (!r) {
            throw new ResolverError("Resolver already closed")
        }
        if (typeof cb !== "function") {
            throw new ResolverError("cb must be a function")
        }
        if (typeof opts.name !== "string" || opts.name == "") {
            throw new ResolverError("resolve name invalid")
        }
        if (opts.v6 === undefined || opts.v6 === null) {
            new Resolve4or6(r, opts, cb).resolve()
        } else {
            this._resolve(r, opts.v6 ? true : false, opts, cb)
        }
    }
    private _resolve(r: deps.Resolver, v6: boolean, opts: ResolveOptions, cb?: (v?: ResolveResult, e?: any) => void): void {
        let req: deps.Resolve | undefined
        let onAbort: AbortListener | undefined
        const signal = opts.signal
        if (signal) {
            signal.throwIfAborted()
            onAbort = (reason) => {
                const f = cb
                if (!f) {
                    return
                }
                cb = undefined
                if (req) {
                    deps.resolver_ip_cancel(req)
                }
                f(undefined, reason)
            }
            signal.addEventListener(onAbort)
        }
        try {
            req = deps.resolver_ip({
                r: r,
                name: opts.name,
                v6: v6,
                cb: (v, result, msg) => {
                    const f = cb
                    if (!f) {
                        return
                    }
                    cb = undefined
                    if (signal) {
                        signal.removeEventListener(onAbort!)
                    }

                    if (result) {
                        const e = new ResolverError(msg!)
                        if (result == 69) {
                            e.cancel = true
                        }
                        e.result = result
                        f(undefined, e)
                    } else {
                        f(v, undefined)
                    }
                },
            })
        } catch (e) {
            cb = undefined
            throwResolverError(e)
        }
    }
    private static default_?: Resolver
    static setDefault(v?: Resolver) {
        const o = Resolver.default_
        if (o === v) {
            return
        }
        if (v === undefined || v === null) {
            Resolver.default_ = undefined
        } else if (v instanceof Resolver) {
            Resolver.default_ = v
        } else {
            Resolver.default_ = undefined
        }
    }
    static getDefault(): Resolver {
        let v = Resolver.default_
        if (!v) {
            v = new Resolver({ system: true })
            Resolver.default_ = v
        }
        return v
    }
    static hasDefault(): boolean {
        return Resolver.default_ ? true : false
    }
}


export interface Addr {
    /**
     * name of the network (for example, "tcp", "udp")
     */
    readonly network: string
    /**
     * string form of address (for example, "192.0.2.1:25", "[2001:db8::1]:80")
     */
    readonly address: string
}
export class NetAddr implements Addr {
    constructor(readonly network: string, readonly address: string) {
    }
    toString(): string {
        return this.address
    }
}
export interface ServerTlsConfig extends deps.ServerTlsConfig {

}
export interface ListenOptions {
    /**
     * name of the network (for example, "tcp", "tcp4", "tcp6", "unix")
     */
    network: string
    /**
     * string form of address (for example, "192.0.2.1:25", "[2001:db8::1]:80")
     */
    address: string
    /**
     * @default 5
     */
    backlog?: number

    /**
     * If true, a synchronous accept will be called in a separate thread to accept the connection.
     * 
     * @remarks
     * Usually there is no need to set it, but some chips and systems have bugs in asynchronous accept and cannot be used. At this time, you can only set it to true to return to synchronous mode.
     * 
     * This kind of situation exists, such as the chips and systems in West Korea. Don't ask me why I know it. It's really enviable that you haven't encountered it.
     * 
     * @default false
     */
    sync?: boolean

    tls?: ServerTlsConfig
}

export class TcpError extends NetError {
    constructor(message: string) {
        super(message);
        (this as any).name = "TcpError"
    }
}

function throwTcpError(e: any): never {
    if (typeof e === "string") {
        throw new TcpError(e)
    }
    throw e
}
export class UnixError extends NetError {
    constructor(message: string) {
        super(message);
        (this as any).name = "UnixError"
    }
}

function throwUnixError(e: any): never {
    if (typeof e === "string") {
        throw new UnixError(e)
    }
    throw e
}
/**
 * Conn is a generic stream-oriented network connection.
 */
export interface Conn {
    readonly remoteAddr: Addr
    readonly localAddr: Addr
    /**
     * Returns whether the connection has been closed
     */
    readonly isClosed: boolean
    /**
     * Close the connection and release resources
     */
    close(): void
    /**
     * Callback when an error occurs
     */
    onError?: (this: Conn, e: any) => void
    /**
     * Write data returns the actual number of bytes written
     * 
     * @param data data to write
     * @returns If undefined is returned, it means that the write buffer is full and you need to wait for the onWritable callback before continuing to write data.
     */
    write(data: string | Uint8Array | ArrayBuffer): number | undefined
    /**
     * Callback whenever the write buffer changes from unwritable to writable
     */
    onWritable?: (this: Conn) => void
    /**
     * Write buffer size
     */
    maxWriteBytes: number
    /**
     * Callback when a message is received. If set to undefined, it will stop receiving data.
     * @remarks
     * The data passed in the callback is only valid in the callback function. If you want to continue to access it after the callback ends, you should create a copy of it in the callback.
     */
    onMessage?: OnMessageCallback<Conn>

    onReadable?: OnReadableCallback<Conn>

    /**
     * 
     */
    buffer?: Uint8Array
}
/**
 * Readable network device for reading ready data
 */
export interface Readable {
    /**
     * Returns the currently ready data length
     */
    readonly length: number
    /**
     * Read as much data as possible into dst, returning the actual bytes read
     * @returns the actual read data length
     */
    read(dst: Uint8Array): number
    /**
     * Copies as much data as possible to dst, returning the actual copied bytes. 
     * This function does not cause the Readable.length property to change
     * @returns the actual copied data length
     */
    copy(dst: Uint8Array, skip?: number): number
    /**
     * Discard data of specified length
     * @returns the actual discarded data length
     */
    drain(n: number): number
}
class evbufferReadable implements Readable {
    constructor(readonly b: deps.evbuffer, private Error: typeof NetError) { }
    get length(): number {
        if (this.closed_) {
            throw new this.Error(`Readable has expired, it is only valid in callback function onReadable`)
        }
        return deps.evbuffer_len(this.b)
    }
    read(dst: Uint8Array): number {
        if (this.closed_) {
            throw new this.Error(`Readable has expired, it is only valid in callback function onReadable`)
        }
        return deps.evbuffer_read(this.b, dst)
    }
    copy(dst: Uint8Array, skip?: number): number {
        if (this.closed_) {
            throw new this.Error(`Readable has expired, it is only valid in callback function onReadable`)
        }
        return deps.evbuffer_copy(this.b, dst, skip)
    }
    drain(n: number) {
        if (this.closed_) {
            throw new this.Error(`Readable has expired, it is only valid in callback function onReadable`)
        }
        return deps.evbuffer_drain(this.b, n)
    }
    private closed_ = false
    _close() {
        this.closed_ = true
    }
}
export type OnReadableCallback<Self> = (this: Self, r: Readable) => void
export type OnMessageCallback<Self> = (this: Self, data: Uint8Array) => void
interface tcpConnBridge {
    Error: typeof NetError
    throwError(e: any): never
}

export class BaseTcpConn implements Conn {
    c_?: deps.TcpConn
    private md_: deps.ConnMetadata
    constructor(readonly remoteAddr: Addr, readonly localAddr: Addr,
        conn: deps.TcpConn,
        readonly bridge_: tcpConnBridge,
    ) {
        this.c_ = conn
        this.md_ = conn.md
        conn.cbw = () => {
            const f = this.onWritableBInd_
            if (f) {
                f()
            }
        }
        conn.cbr = (r) => {
            this._cbr(r)
        }
        conn.cbe = (what, err) => {
            const f = this.onErrorBind_
            const bridge = this.bridge_
            let e: NetError
            if (what & deps.BEV_EVENT_WRITING) {
                if (what & deps.BEV_EVENT_EOF) {
                    if (f) {
                        e = new bridge.Error("write eof")
                        e.write = true
                        e.eof = true
                    }
                } else if (what & deps.BEV_EVENT_TIMEOUT) {
                    if (f) {
                        e = new bridge.Error("write timeout")
                        e.write = true
                        e.timeout = true
                    }
                } else if (err) {
                    if (f) {
                        if (err === deps.ETIMEDOUT) {
                            e = new bridge.Error("write timeout")
                        } else {
                            e = new bridge.Error(deps.socket_error(err))
                        }
                        e.write = true
                    }
                } else {
                    return
                }
            } else if (what & deps.BEV_EVENT_READING) {
                if (what & deps.BEV_EVENT_EOF) {
                    if (f) {
                        e = new bridge.Error("read eof")
                        e.read = true
                        e.eof = true
                    }
                } else if (what & deps.BEV_EVENT_TIMEOUT) {
                    if (f) {
                        e = new bridge.Error("read timeout")
                        e.read = true
                        e.timeout = true
                    }
                } else if (err) {
                    if (f) {
                        if (err === deps.ETIMEDOUT) {
                            e = new bridge.Error("read timeout")
                            e.timeout = true
                        } else {
                            e = new bridge.Error(deps.socket_error(err))
                        }
                        e.read = true
                    }
                } else {
                    return
                }
            } else if (err) {
                if (f) {
                    e = new bridge.Error(deps.socket_error(err))
                }
            } else {
                return
            }
            this.close()
            if (f) {
                f(e!)
            }
        }
    }
    private onError_?: (this: Conn, e: any) => void
    private onErrorBind_?: (e: any) => void
    get onError(): ((this: Conn, e: any) => void) | undefined {
        return this.onError_
    }
    set onError(f: ((e: any) => void) | undefined) {
        if (f === undefined || f === null) {
            this.onError_ = undefined
            this.onErrorBind_ = undefined
        } else {
            if (f === this.onError_) {
                return
            }
            if (typeof f !== "function") {
                throw new this.bridge_.Error("onError must be a function")
            }
            this.onErrorBind_ = f.bind(this)
            this.onError_ = f
        }
    }
    get isClosed(): boolean {
        return this.c_ ? false : true
    }
    close(): void {
        const c = this.c_
        if (c) {
            this.c_ = undefined
            deps.tcp_conn_close(c)
        }
    }
    private _get(): deps.TcpConn {
        const c = this.c_
        if (!c) {
            throw new this.bridge_.Error(`conn already closed`)
        }
        return c
    }
    /**
     * Write data returns the actual number of bytes written
     * 
     * @param data data to write
     * @returns If undefined is returned, it means that the write buffer is full and you need to wait for the onWritable callback before continuing to write data.
     */
    write(data: string | Uint8Array | ArrayBuffer): number | undefined {
        const c = this._get()
        try {
            return deps.tcp_conn_write(c, data)
        } catch (e) {
            this.bridge_.throwError(e)
        }
    }
    /**
     * Callback whenever the write buffer changes from unwritable to writable
     */
    private onWritable_?: (this: Conn) => void
    private onWritableBInd_?: () => void
    get onWritable() {
        return this.onWritable_
    }
    set onWritable(f: any) {
        if (f === undefined || f === null) {
            this.onWritable_ = undefined
            this.onWritableBInd_ = undefined
        } else {
            if (f === this.onWritable_) {
                return
            }
            if (typeof f !== "function") {
                throw new this.bridge_.Error("onWritable must be a function")
            }
            this.onWritableBInd_ = f.bind(this)
            this.onWritable_ = f
        }
    }

    /**
     * Write buffer size
     */
    get maxWriteBytes(): number {
        return this.md_.mw
    }
    set maxWriteBytes(v: number) {
        if (!Number.isSafeInteger(v)) {
            throw new this.bridge_.Error("maxWriteBytes must be a safe integer")
        } else if (v < 0) {
            v = 0
        }
        if (v != this.md_.mw) {
            this.md_.mw = v
        }
    }
    private _buffer(): Uint8Array {
        let b = this.buffer
        if (b && b.length > 0) {
            return b
        }
        b = new Uint8Array(1024 * 32)
        this.buffer = b
        return b
    }
    buffer?: Uint8Array
    private _cbr(r: deps.evbuffer) {
        const onReadable = this.onReadableBind_
        if (onReadable) {
            const rb = new evbufferReadable(r, this.bridge_.Error)
            onReadable(rb)
            rb._close()
            if (this.isClosed) {
                return
            }
        }

        const onMessage = this.onMessageBind_
        if (onMessage) {
            const b = this._buffer()
            const n = deps.evbuffer_read(r, b)
            switch (n) {
                case 0:
                    break
                case b.length:
                    onMessage(b)
                    break
                default:
                    onMessage(b.length == n ? b : b.subarray(0, n))
                    break
            }
        } else if (!onReadable) {
            const c = this.c_
            if (c) {
                deps.tcp_conn_cb(c, false)
            }
        }
    }
    private onReadable_?: OnReadableCallback<Conn>
    private onReadableBind_?: (r: Readable) => void
    /**
     * Callback when a message is received. If set to undefined, it will stop receiving data. 
     */
    get onReadable(): OnReadableCallback<Conn> | undefined {
        return this.onReadable_
    }
    set onReadable(f: OnReadableCallback<Conn> | undefined) {
        if (f === undefined || f === null) {
            if (!this.onReadable_) {
                return
            }
            const c = this.c_
            if (c && !this.onMessage_) {
                deps.tcp_conn_cb(c, false)
            }
            this.onReadable_ = undefined
            this.onReadableBind_ = undefined
        } else {
            if (f === this.onReadable_) {
                return
            }
            if (typeof f !== "function") {
                throw new this.bridge_.Error("onReadable must be a function")
            }
            const c = this.c_
            if (c && !this.onMessage_) {
                deps.tcp_conn_cb(c, true)
            }
            this.onReadableBind_ = f.bind(this)
            this.onReadable_ = f

        }
    }

    private onMessage_?: OnMessageCallback<Conn>
    private onMessageBind_?: (data: Uint8Array) => void
    /**
     * Callback when a message is received. If set to undefined, it will stop receiving data. 
     */
    get onMessage(): OnMessageCallback<Conn> | undefined {
        return this.onMessage_
    }
    set onMessage(f: OnMessageCallback<Conn> | undefined) {
        if (f === undefined || f === null) {
            if (!this.onMessage_) {
                return
            }
            const c = this.c_
            if (c && !this.onReadable_) {
                deps.tcp_conn_cb(c, false)
            }
            this.onMessage_ = undefined
            this.onMessageBind_ = undefined
        } else {
            if (f === this.onMessage_) {
                return
            }
            if (typeof f !== "function") {
                throw new this.bridge_.Error("onMessage must be a function")
            }
            const c = this.c_
            if (c && !this.onReadable_) {
                deps.tcp_conn_cb(c, true)
            }
            this.onMessageBind_ = f.bind(this)
            this.onMessage_ = f
        }
    }
}

export type OnAcceptCallback = (this: Listener, c?: Conn) => void
export type onErrorCallback<T> = (this: T, e: any) => void
export interface Listener {
    readonly addr: Addr
    close(): void
    onAccept?: OnAcceptCallback
    onError?: onErrorCallback<Listener>
}
interface tcpListenerBridge {
    Error: typeof NetError
    throwError(e: any): never
    conn(c: deps.TcpConn, opts?: deps.TcpListenerOptions): BaseTcpConn
}
export class BaseTcpListener implements Listener {
    private l_?: deps.TcpListener
    native() {
        return this.l_
    }
    constructor(readonly addr: Addr,
        l: deps.TcpListener,
        readonly bridge: tcpListenerBridge,
        tls?: boolean,
    ) {
        l.cb = (conn, opts, err) => {
            const onAccept = this.onAcceptBind_
            if (!onAccept) {
                if (conn) {
                    deps.tcp_conn_stash(conn, false)
                }
                return
            } else if (!conn) {
                const onError = this.onErrorBind_
                if (onError) {
                    const e = new this.bridge.Error(err!)
                    e.connect = true
                    onError(e)
                }
                return
            } else if (tls) {
                this._acceptTLS(conn, opts)
            } else {
                this._accept(conn, opts, onAccept)
            }
        }
        l.err = (e) => {
            const cb = this.onErrorBind_
            if (cb) {
                cb(e)
            }
        }
        this.l_ = l
    }
    private _acceptTLS(conn: deps.TcpConn, opts: deps.TcpListenerOptions | undefined) {
        try {
            deps.tcp_conn_stash(conn, true)
        } catch (e) {
            const onError = this.onErrorBind_
            if (onError) {
                onError(e)
            }
            return
        }
        try {
            conn.cbe = (what) => {
                const onAccept = this.onAcceptBind_
                if (!onAccept) {
                    deps.tcp_conn_close(conn)
                    return
                }

                if (what & deps.BEV_EVENT_TIMEOUT) {
                    deps.tcp_conn_close(conn)
                    const onError = this.onErrorBind_
                    if (onError) {
                        const e = new this.bridge.Error("tls handshake timeout")
                        e.timeout = true
                        onError(e)
                    }
                    return
                } else if (what & deps.BEV_EVENT_ERROR) {
                    deps.tcp_conn_close(conn)
                    const onError = this.onErrorBind_
                    if (onError) {
                        const e = new this.bridge.Error("tls handshake fail")
                        onError(e)
                    }
                    return
                }

                let c: Conn
                try {
                    c = this.bridge.conn(conn, opts)
                } catch (e) {
                    deps.tcp_conn_close(conn)
                    const onError = this.onErrorBind_
                    if (onError) {
                        onError(e)
                    }
                    return
                }
                deps.tcp_conn_cb(conn, false)
                onAccept(c)
            }
        } catch (e) {
            deps.tcp_conn_close(conn)
            const onError = this.onErrorBind_
            if (onError) {
                onError(e)
            }
        }
    }
    private _accept(conn: deps.TcpConn, opts: deps.TcpListenerOptions | undefined, cb: (c: Conn) => void) {
        let c: Conn
        try {
            c = this.bridge.conn(conn, opts)
        } catch (e) {
            deps.tcp_conn_stash(conn, false)
            const onError = this.onErrorBind_
            if (onError) {
                onError(e)
            }
            return
        }
        deps.tcp_conn_stash(conn, true)
        cb(c)
    }
    get isClosed(): boolean {
        return this.l_ ? false : true
    }
    close(): void {
        const l = this.l_
        if (l) {
            this.l_ = undefined
            deps.tcp_listen_close(l)
        }
    }
    private onAccept_?: OnAcceptCallback
    private onAcceptBind_?: (c: Conn) => void
    private onError_?: onErrorCallback<Listener>
    private onErrorBind_?: (e: any) => void
    set onAccept(f: OnAcceptCallback | undefined) {
        if (f === undefined || f === null) {
            if (!this.onAccept_) {
                return
            }
            const l = this.l_
            if (l) {
                deps.tcp_listen_cb(l, false)
            }
            this.onAccept_ = undefined
            this.onAcceptBind_ = undefined
        } else {
            if (f === this.onAccept_) {
                return
            }
            if (typeof f !== "function") {
                throw new this.bridge.Error("onAccept must be a function")
            }
            const bind = f.bind(this)
            const l = this.l_
            if (l) {
                deps.tcp_listen_cb(l, true)
            }
            this.onAccept_ = f
            this.onAcceptBind_ = bind
        }
    }
    set onError(f: onErrorCallback<Listener> | undefined) {
        if (f === undefined || f === null) {
            if (!this.onError_) {
                return
            }
            const l = this.l_
            if (l) {
                deps.tcp_listen_err(l, false)
            }
            this.onError_ = undefined
            this.onErrorBind_ = undefined
        } else {
            if (f === this.onError_) {
                return
            }
            if (typeof f !== "function") {
                throw new this.bridge.Error("onError must be a function")
            }
            const bind = f.bind(this)
            const l = this.l_
            if (l) {
                deps.tcp_listen_err(l, true)
            }
            this.onError_ = f
            this.onErrorBind_ = bind
        }
    }
    get onAccept(): OnAcceptCallback | undefined {
        return this.onAccept_
    }
    get onError(): onErrorCallback<Listener> | undefined {
        return this.onError_
    }
}
export class TcpListener extends BaseTcpListener {
    constructor(readonly addr: Addr, l: deps.TcpListener, tls?: boolean) {
        super(addr, l, {
            Error: TcpError,
            throwError: throwTcpError,
            conn(conn, opts) {
                let remoteIP = opts!.remoteIP!;
                if (remoteIP.startsWith('::ffff:')) {
                    remoteIP = remoteIP.substring(7)
                }
                let localIP = opts!.localIP!;
                if (localIP.startsWith('::ffff:')) {
                    localIP = localIP.substring(7)
                }
                return new TcpConn(
                    new NetAddr('tcp', joinHostPort(remoteIP, opts!.remotePort!)),
                    new NetAddr('tcp', joinHostPort(localIP, opts!.localPort!)),
                    conn,
                )
            }
        }, tls)
    }
}
export class TcpConn extends BaseTcpConn {
    constructor(remoteAddr: Addr, localAddr: Addr, conn: deps.TcpConn) {
        super(remoteAddr, localAddr, conn, {
            Error: TcpError,
            throwError: throwTcpError,
        })
    }
}
export class UnixConn extends BaseTcpConn {
    constructor(remoteAddr: Addr, localAddr: Addr, conn: deps.TcpConn) {
        super(remoteAddr, localAddr, conn, {
            Error: UnixError,
            throwError: throwUnixError,
        })
    }
}
export class UnixListener extends BaseTcpListener {
    constructor(readonly addr: Addr, l: deps.TcpListener, tls?: boolean) {
        super(addr, l, {
            Error: UnixError,
            throwError: throwUnixError,
            conn(conn) {
                return new UnixConn(
                    new NetAddr('unix', '@'),
                    new NetAddr('unix', addr.address),
                    conn,
                )
            }
        }, tls)
    }
}

function listenTCP(opts: ListenOptions, v6?: boolean): TcpListener {
    try {
        const tls = opts.tls ? deps.create_server_tls(opts.tls) : undefined

        const backlog = opts.backlog ?? 5
        if (!Number.isSafeInteger(backlog) || backlog < 1) {
            throw new TcpError(`listen backlog invalid: ${opts.backlog}`)
        }
        const [host, sport] = splitHostPort(opts.address)
        let address = opts.address
        const port = parseInt(sport)
        if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
            throw new TcpError(`listen port invalid: ${opts.address}`)
        }
        let ip: IP | undefined
        if (host != "") {
            ip = IP.parse(host)
            if (!ip) {
                throw new TcpError(`listen address invalid: ${opts.address}`)
            }
        }

        if (ip) {
            if (v6 === undefined) {
                if (ip.isV4) {
                    v6 = false
                }
            } else {
                if (v6) {
                    if (!ip.isV6) {
                        throw new TcpError(`listen network restriction address must be ipv6: ${opts.address}`)
                    }
                    v6 = true
                } else {
                    if (!ip.isV4) {
                        throw new TcpError(`listen network restriction address must be ipv4: ${opts.address}`)
                    }
                    v6 = false
                }
            }
        }

        const l = deps.tcp_listen({
            ip: ip?.toString(),
            port: port,
            v6: v6,
            backlog: backlog,
            sync: opts.sync ? true : false,
            tls: tls,
        })
        if (host == "") {
            if (v6 === undefined) {
                address = `[::]${address}`
            } else if (v6) {
                address = `[::]${address}`
            } else {
                address = `0.0.0.0${address}`
            }
        }
        try {
            return new TcpListener(new NetAddr('tcp', address), l, tls ? true : false)
        } catch (e) {
            deps.tcp_listen_close(l)
            throw e
        }
    } catch (e) {
        throwTcpError(e)
    }
}
function listenUnix(opts: ListenOptions): UnixListener {
    try {
        const tls = opts.tls ? deps.create_server_tls(opts.tls) : undefined

        const address = opts.address
        const l = deps.unix_listen({
            address: address,
            backlog: opts.backlog ?? 5,
            sync: opts.sync ?? false,
            tls: tls,
        })
        try {
            return new UnixListener(new NetAddr('unix', address), l, tls ? true : false)
        } catch (e) {
            deps.tcp_listen_close(l)
            throw e
        }
    } catch (e) {
        throwUnixError(e)
    }
}
type DialCallback = (c?: BaseTcpConn, e?: any) => void
interface TcpDialIPOptions {
    sync: boolean
    Error: typeof NetError

    ip: string,
    port?: number
    v6: boolean
    signal?: AbortSignal
    cb?: DialCallback

    c?: deps.TcpConn
    tls?: TlsConfig
}
function tcp_dial_ip(opts: TcpDialIPOptions) {
    let onabort: ((reason: any) => void) | undefined
    const signal = opts.signal
    try {
        if (signal) {
            onabort = (reason) => {
                const cb = opts.cb
                if (cb) {
                    opts.cb = undefined
                    const c = opts.c
                    if (c) {
                        opts.c = undefined
                        deps.tcp_conn_close(c)
                    }
                    cb(undefined, reason)
                }
            }
            signal.addEventListener(onabort)
        }
        let tls: undefined | deps.Tls
        if (opts.tls) {
            tls = deps.create_tls(opts.tls)
        }
        if (opts.port === undefined) {
            opts.c = deps.unix_conect({
                name: opts.ip,
                tls: tls?.p,
            })
        } else {
            opts.c = deps.tcp_conect({
                ip: opts.ip,
                port: opts.port,
                v6: opts.v6,
                tls: tls?.p,
            })
        }
        opts.c.cbe = (what, err) => {
            const cb = opts.cb
            if (!cb) {
                const c = opts.c
                if (c) {
                    opts.c = undefined
                    deps.tcp_conn_close(c)
                }
                return
            }
            const c = opts.c!
            opts.c = undefined
            if (what & deps.BEV_EVENT_TIMEOUT) {
                opts.cb = undefined
                if (onabort) {
                    signal!.removeEventListener(onabort)
                }

                deps.tcp_conn_close(c)

                const e = new opts.Error("connect timeout")
                e.connect = true
                e.timeout = true

                cb(undefined, e)
                return
            } else if (err) {
                opts.cb = undefined
                if (onabort) {
                    signal!.removeEventListener(onabort)
                }

                deps.tcp_conn_close(c)

                if (err === deps.ETIMEDOUT) {
                    const e = new opts.Error("connect timeout")
                    e.connect = true
                    e.timeout = true

                    cb(undefined, e)
                } else {
                    const e = new opts.Error(deps.socket_error(err))
                    e.connect = true
                    cb(undefined, e)
                }
                return
            } else {
                opts.cb = undefined
                if (onabort) {
                    signal!.removeEventListener(onabort)
                }

                let conn: undefined | TcpConn
                try {
                    if (opts.port === undefined) {
                        conn = new UnixConn(new NetAddr('unix', opts.ip),
                            new NetAddr('unix', '@'),
                            c,
                        )
                    } else {
                        let [ip, port] = deps.tcp_conn_localAddr(c)
                        if (ip.startsWith('::ffff:')) {
                            ip = ip.substring(7)
                        }
                        conn = new TcpConn(new NetAddr('tcp', joinHostPort(opts.ip, opts.port)),
                            new NetAddr('tcp', joinHostPort(ip, port)),
                            c,
                        )
                    }
                } catch (e) {
                    deps.tcp_conn_close(c)
                    cb(undefined, e)
                    return
                }
                cb(conn)
                return
            }
        }
    } catch (e) {
        const cb = opts.cb
        opts.cb = undefined
        const c = opts.c
        if (c) {
            opts.c = undefined
            deps.tcp_conn_close(c)
        }
        if (onabort) {
            signal!.removeEventListener(onabort)
        }
        if (typeof e === "string") {
            if (opts.sync) {
                throw new opts.Error(e)
            } else {
                cb!(undefined, new opts.Error(e))
            }
        } else {
            if (opts.sync) {
                throw e
            } else {
                cb!(undefined, e)
            }
        }
    }
}
function tcp_dial_host(opts: {
    sync: boolean
    resolver: Resolver,
    v6: boolean,
    name: string,
    port: number,
    signal?: AbortSignal,
    cb?: DialCallback,
    tls?: TlsConfig,
}) {
    try {
        const signal = opts.signal
        let onabort: undefined | ((resaon: any) => void)
        if (signal) {
            onabort = (resaon) => {
                const cb = opts.cb
                if (cb) {
                    opts.cb = undefined
                    cb(undefined, resaon)
                }
            }
            signal.addEventListener(onabort)
        }
        opts.resolver.resolve(opts, (ip, e) => {
            const cb = opts.cb
            if (!cb) {
                return
            }
            opts.cb = undefined
            if (onabort) {
                if (signal!.aborted) {
                    cb(undefined, signal!.reason)
                    return
                }
                signal!.removeEventListener(onabort)
            }
            if (!ip) {
                cb(undefined, e)
                return
            } else if (!ip.ip) {
                cb(undefined, new TcpError(`unknow host: ${opts.name}`))
                return
            }
            tcp_dial_ip({
                sync: false,
                Error: TcpError,
                ip: ip.ip[0],
                port: opts.port,
                v6: opts.v6,
                cb: cb,
                tls: opts.tls,
            })
        })
    } catch (e) {
        if (opts.sync) {
            opts.cb = undefined
            throw e
        }
        const cb = opts.cb!
        opts.cb = undefined
        cb(undefined, e)
    }
}
function tcp_dial_name(opts: {
    v6?: boolean,
    name: string,
    port: number,
    signal?: AbortSignal,
    cb?: DialCallback,
    tls?: TlsConfig,
}) {
    let v6 = opts.v6
    if (v6 === undefined) {
        if (isSupportV6()) {
            if (isSupportV4()) {
                let abort: AbortController
                let resolver: Resolver
                try {
                    abort = new AbortController()
                    resolver = Resolver.getDefault()
                } catch (e) {
                    throw e
                }
                let onabort: undefined | ((reason: any) => void)
                try {
                    if (opts.signal) {
                        onabort = (reason: any) => {
                            abort.abort(reason)
                        }
                        opts.signal.addEventListener(onabort)
                    }
                    let first = true
                    let err: any
                    const oncb: DialCallback = (c, e) => {
                        const cb = opts.cb
                        if (!cb) {
                            if (c) {
                                c.close()
                            }
                            return
                        } else if (abort.signal.aborted) {
                            opts.cb = undefined
                            if (c) {
                                c.close()
                            }
                            cb(undefined, abort.signal.reason)
                            return
                        } else if (!c) {
                            if (first) {
                                first = false
                                err = e
                                return
                            }
                        }
                        opts.cb = undefined
                        if (onabort) {
                            opts.signal!.removeEventListener(onabort)
                        }
                        if (c) {
                            abort.abort()
                            cb(c)
                        } else {
                            cb(undefined, err)
                        }
                    }
                    tcp_dial_host({
                        sync: false,
                        resolver: resolver,
                        v6: false,
                        name: opts.name,
                        port: opts.port,
                        signal: opts.signal,
                        cb: oncb,
                        tls: opts.tls,
                    })
                    tcp_dial_host({
                        sync: false,
                        resolver: resolver,
                        v6: true,
                        name: opts.name,
                        port: opts.port,
                        signal: opts.signal,
                        cb: oncb,
                        tls: opts.tls,
                    })
                } catch (e) {
                    opts.cb = undefined
                    if (onabort) {
                        opts.signal!.removeEventListener(onabort)
                    }
                    abort.abort(e)
                    throw e
                }
                return
            }
            v6 = true
        } else {
            v6 = false
        }
    }
    tcp_dial_host({
        sync: true,
        resolver: Resolver.getDefault(),
        v6: v6,
        name: opts.name,
        port: opts.port,
        signal: opts.signal,
        cb: opts.cb,
        tls: opts.tls,
    })
}
function _tcp_dial(opts: DialOptions, host: string, ipv: IP | undefined, port: number, cb: DialCallback, v6?: boolean) {
    let ip: string | undefined
    if (host == "") {
        if (v6 === undefined) {
            if (isSupportV4()) {
                v6 = false
                ip = '127.0.0.1'
            } else {
                v6 = true
                ip = '::1'
            }
        } else if (v6) {
            v6 = true
            ip = '::1'
        } else {
            v6 = false
            ip = '127.0.0.1'
        }
    } else {
        const v = ipv
        if (!v) {
            tcp_dial_name({
                v6: v6,
                name: host,
                port: port,
                signal: opts.signal,
                cb: cb,
                tls: opts.tls,
            })
            return
        }
        if (v6 === undefined) {
            v6 = v.isV6
        } else {
            if (v6) {
                if (!v.isV6) {
                    throw new TcpError(`dial network restriction address must be ipv6: ${opts.address}`)
                }
                v6 = true
            } else {
                if (!v.isV4) {
                    throw new TcpError(`dial network restriction address must be ipv4: ${opts.address}`)
                }
                v6 = false
            }
        }
        ip = v.toString()
    }
    tcp_dial_ip({
        sync: true,
        Error: TcpError,

        ip: ip,
        port: port,
        v6: v6,
        signal: opts.signal,
        cb: cb,
        tls: opts.tls,
    })
}
function tcp_dial(opts: DialOptions, cb: DialCallback, v6?: boolean) {
    const [host, sport] = splitHostPort(opts.address)
    const port = parseInt(sport)
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
        throw new TcpError(`dial port invalid: ${opts.address}`)
    }
    let ip: IP | undefined
    let hostname: string | undefined
    if (host != "") {
        ip = IP.parse(host)
        if (!ip) {
            hostname = host
        }
    }
    if (opts.tls) {
        const tlsConfig = opts.tls
        if (typeof tlsConfig.serverName !== "string") {
            tlsConfig.serverName = hostname
        }
    }
    _tcp_dial(opts, host, ip, port, cb, v6)
}

function unix_dial(opts: DialOptions, o: TcpDialIPOptions) {
    if (opts.tls) {
        const tlsConfig = opts.tls
        const serverName = tlsConfig.serverName
        if (typeof tlsConfig.serverName !== "string") {
            tlsConfig.serverName = o.ip
        }
        o.tls = tlsConfig
    }
    tcp_dial_ip(o)
}


/**
 * Create a listening service
 */
export function listen(opts: ListenOptions): Listener {
    switch (opts.network) {
        case 'tcp':
            return listenTCP(opts)
        case 'tcp4':
            return listenTCP(opts, false)
        case 'tcp6':
            return listenTCP(opts, true)
        case 'unix':
            return listenUnix(opts)
        default:
            throw new NetError(`unknow network: ${opts.network}`);
    }
}
export interface DialOptions {
    /**
     * name of the network (for example, "tcp", "tcp4", "tcp6", "unix")
     */
    network: string
    /**
     * string form of address (for example, "192.0.2.1:25", "[2001:db8::1]:80")
     */
    address: string

    /**
     * A signal that can be used to cancel dialing
     */
    signal?: AbortSignal

    /**
     * If set will use tls connection
     */
    tls?: TlsConfig
}
/**
 * tls 1.2
 */
export const Tls12 = 303
/**
 * tls 1.3
 */
export const Tls13 = 304
export interface TlsConfig extends deps.TlsConfig {
    serverName?: string
}
/**
 * Dial a listener to create a connection for bidirectional communication
 */
export function dial(a: any, b: any) {
    const args = parseArgs<DialOptions, DialCallback>('dial', a, b)
    const opts = args.opts!
    if (opts.signal) {
        opts.signal.throwIfAborted()
    }
    switch (opts.network) {
        case 'tcp':
        case 'tcp4':
        case 'tcp6':
        case 'unix':
            break
        default:
            throw new NetError(`unknow network: ${opts.network}`);
    }
    return callReturn(_dial, args)
}
export function _dial(opts: DialOptions, cb: DialCallback) {
    switch (opts.network) {
        case 'tcp':
            tcp_dial(opts, cb)
            break
        case 'tcp4':
            tcp_dial(opts, cb, false)
            break
        case 'tcp6':
            tcp_dial(opts, cb, true)
            break
        case 'unix':
            unix_dial(opts, {
                sync: true,
                Error: UnixError,
                ip: opts.address,
                signal: opts.signal,
                v6: false,
                cb: cb,
            })
            break
        default:
            throw new NetError(`unknow network: ${opts.network}`);
    }
}
export class UdpError extends NetError {
    constructor(message: string) {
        super(message);
        (this as any).name = "UdpError"
    }
}
function throwUdpError(e: any): never {
    if (typeof e === "string") {
        throw new UdpError(e)
    }
    throw e
}
export class UdpAddr implements Addr {
    addr_?: deps.UdpAddr
    readonly network = 'udp'
    get address(): string {
        const addr = this.addr_
        if (!addr) {
            return '<undefined>'
        }
        const s = addr.s
        if (s) {
            return s
        }
        return deps.udp_addr_s(addr)
    }
    toString(): string {
        return this.address
    }
    constructor(ip?: string, port?: number) {
        if (ip && port) {
            const addr = deps.udp_addr(ip, port)
            this.addr_ = addr
        }
    }
    copyFrom(o: UdpAddr) {
        if (o.addr_) {
            if (this.addr_) {
                deps.udp_addr_copy(this.addr_, o.addr_)
            } else {
                const addr = isSupportV6() ? deps.udp_addr('0.0.0.0', 80) : deps.udp_addr('::', 80)
                deps.udp_addr_copy(addr, o.addr_)
                this.addr_ = addr
            }
        } else {
            this.addr_ = undefined
        }
    }
}

class BaseUdpConn {
    constructor(public conn?: deps.UdpConn) {
    }
    private localAddr_?: UdpAddr
    localAddr(): UdpAddr {
        let addr = this.localAddr_
        if (addr) {
            if (addr.addr_) {
                return addr
            }
        } else {
            addr = new UdpAddr()
            this.localAddr_ = addr
        }
        const conn = this.conn
        if (conn) {
            const [ip, port] = deps.udp_localAddr(conn)
            if (ip && port) {
                addr.addr_ = deps.udp_addr(ip, port)
            }
        }
        return addr
    }
}

export interface UdpCreateOptions {
    /**
     * @default 'udp'
     */
    network?: 'udp' | 'udp4' | 'udp6'
}
/**
 * For reading ready udp data
 * @remarks
 * UDP is not a stream but a frame, which means you can only call read once per callback
 */
export interface UdpReadable {
    /**
     * Read as much data as possible into dst, returning the actual bytes read
     * @returns the actual read data length
     */
    read(dst: Uint8Array, remote?: UdpAddr): number
    /**
     * whether it is readable
     */
    canRed(): boolean
}
class udpReadable implements UdpReadable {
    constructor(private c_?: BaseUdpConn) { }
    /**
     * Read data from udp
     * @param dst 
     * @param remote This is the outgoing parameter, it is populated with which address the data came from
     * @returns actual number of bytes read
     */
    read(dst: Uint8Array, remote?: UdpAddr): number {
        const conn = this.c_
        if (!conn) {
            throw new UdpError(`UdpReadable can only read once`)
        }
        if (this.closed_) {
            throw new UdpError(`UdpReadable has expired, it is only valid in callback function onReadable`)
        }
        const c = conn.conn
        if (!c) {
            throw new UdpError(`conn already closed`)
        }
        try {
            if (remote === undefined || remote === null) {
                this.c_ = undefined
                return deps.udp_read({
                    c: c,
                    dst: dst,
                })
            } else if (remote instanceof UdpAddr) {
                const addr = remote.addr_
                if (addr) {
                    this.c_ = undefined
                    remote.addr_ = undefined
                    const n = deps.udp_read({
                        c: c,
                        dst: dst,
                        addr: addr,
                    })
                    remote.addr_ = addr
                    return n
                } else {
                    this.c_ = undefined
                    const opts: deps.UdpReadOptions = {
                        c: c,
                        dst: dst,
                        out: true,
                    }
                    const n = deps.udp_read(opts)
                    remote.addr_ = opts.addr
                    return n
                }
            } else {
                throw new UdpError("remote must be a UdpAddr")
            }
        } catch (e) {
            throwUdpError(e)
        }
    }
    canRed(): boolean {
        return this.c_ && !this.closed_ ? true : false
    }
    private closed_ = false
    _close() {
        this.closed_ = true
    }
}
export type OnUdpReadableCallback = (this: UdpConn, r: UdpReadable) => void
export interface UdpListenOptions {
    /**
     * @default 'udp'
     */
    network?: 'udp' | 'udp4' | 'udp6'
    /**
     * string form of address (for example, "192.0.2.1:25", "[2001:db8::1]:80")
     */
    address: string
}
export interface UdpDialHostOptions extends UdpListenOptions {
    /**
     * A signal that can be used to cancel dialing
     */
    signal?: AbortSignal
}
function parseUdpOptions(tag: string, opts: UdpListenOptions): deps.UdpListenOptions {
    let v6: undefined | boolean
    switch (opts.network ?? 'udp') {
        case 'udp':
            break
        case 'udp4':
            v6 = false
            break
        case 'udp6':
            v6 = true
            break
        default:
            throw new UdpError(`unknow network: ${opts.network}`)
    }
    const [host, sport] = splitHostPort(opts.address)
    const port = parseInt(sport)
    if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
        throw new TcpError(`${tag} port invalid: ${opts.address}`)
    }
    let ip: IP | undefined
    if (host != "") {
        ip = IP.parse(host)
        if (!ip) {
            throw new UdpError(`${tag} address invalid: ${opts.address}`)
        }
    }

    if (ip) {
        if (v6 === undefined) {
            if (ip.isV4) {
                v6 = false
            }
        } else {
            if (v6) {
                if (!ip.isV6) {
                    throw new UdpError(`${tag} network restriction address must be ipv6: ${opts.address}`)
                }
                v6 = true
            } else {
                if (!ip.isV4) {
                    throw new TcpError(`${tag} network restriction address must be ipv4: ${opts.address}`)
                }
                v6 = false
            }
        }
    }
    return {
        ip: ip?.toString(),
        port: port,
        v6: v6,
    }
}
function udp_dial_ip(opts: {
    sync: boolean
    ip?: string
    port: number
    v6?: boolean
    cb: (c?: UdpConn, e?: any) => void
}) {
    let c: deps.UdpConn
    try {
        c = deps.udp_dial({
            ip: opts.ip,
            port: opts.port,
            v6: opts.v6,
        })
    } catch (e) {
        if (typeof e === "string") {
            if (opts.sync) {
                throw new UdpError(e)
            } else {
                const cb = opts.cb
                cb(undefined, new UdpError(e))
            }
        } else {
            if (opts.sync) {
                throw e
            } else {
                const cb = opts.cb
                cb(undefined, e)
            }
        }
        return
    }
    let conn: UdpConn
    try {
        const remoteAddr = new UdpAddr()
        remoteAddr.addr_ = c.addr
        conn = UdpConn.attach(c, remoteAddr)
    } catch (e) {
        deps.udp_close(c)
        if (opts.sync) {
            throw e
        } else {
            const cb = opts.cb
            cb(undefined, e)
        }
        return
    }
    // if (opts.sync) {
    //     setImmediate(() => {
    //         const cb = opts.cb
    //         cb(conn)
    //     })
    // } else {
    //     const cb = opts.cb
    //     cb(conn)
    // }
    const cb = opts.cb
    cb(conn)
}
function udp_dial_host(opts: {
    sync: boolean
    resolver: Resolver
    v6: boolean
    name: string
    port: number
    signal?: AbortSignal
    cb?: (c?: UdpConn, e?: any) => void
}) {
    try {
        const signal = opts.signal
        let onabort: undefined | ((resaon: any) => void)
        if (signal) {
            onabort = (resaon) => {
                const cb = opts.cb
                if (cb) {
                    opts.cb = undefined
                    cb(undefined, resaon)
                }
            }
            signal.addEventListener(onabort)
        }
        opts.resolver.resolve(opts, (ip, e) => {
            const cb = opts.cb
            if (!cb) {
                return
            }
            opts.cb = undefined
            if (onabort) {
                if (signal!.aborted) {
                    cb(undefined, signal!.reason)
                    return
                }
                signal!.removeEventListener(onabort)
            }
            if (!ip) {
                cb(undefined, e)
                return
            } else if (!ip.ip) {
                cb(undefined, new UdpError(`unknow host: ${opts.name}`))
                return
            }

            udp_dial_ip({
                sync: false,
                ip: ip.ip[0],
                port: opts.port,
                v6: opts.v6,
                cb: cb,
            })
        })
    } catch (e) {
        if (opts.sync) {
            opts.cb = undefined
            throw e
        }
        const cb = opts.cb!
        opts.cb = undefined
        cb(undefined, e)
    }
}
function udp_dial(opts: {
    name: string
    port: number
    v6?: boolean
    signal?: AbortSignal
    cb?: (c?: UdpConn, e?: any) => void
}) {
    let v6 = opts.v6
    if (v6 === undefined) {
        if (isSupportV6()) {
            if (isSupportV4()) {
                let abort: AbortController
                let resolver: Resolver
                try {
                    abort = new AbortController()
                    resolver = Resolver.getDefault()
                } catch (e) {
                    throw e
                }
                let onabort: undefined | ((reason: any) => void)
                try {
                    if (opts.signal) {
                        onabort = (reason: any) => {
                            abort.abort(reason)
                        }
                        opts.signal.addEventListener(onabort)
                    }
                    let first = true
                    let err: any
                    const oncb: (c?: UdpConn | undefined, e?: any) => void = (c, e) => {
                        const cb = opts.cb
                        if (!cb) {
                            if (c) {
                                c.close()
                            }
                            return
                        } else if (abort.signal.aborted) {
                            opts.cb = undefined
                            if (c) {
                                c.close()
                            }
                            cb(undefined, abort.signal.reason)
                            return
                        } else if (!c) {
                            if (first) {
                                first = false
                                err = e
                                return
                            }
                        }
                        opts.cb = undefined
                        if (onabort) {
                            opts.signal!.removeEventListener(onabort)
                        }
                        if (c) {
                            abort.abort()
                            cb(c)
                        } else {
                            cb(undefined, err)
                        }
                    }
                    udp_dial_host({
                        sync: false,
                        resolver: resolver,
                        v6: false,
                        name: opts.name,
                        port: opts.port,
                        signal: opts.signal,
                        cb: oncb,
                    })
                    udp_dial_host({
                        sync: false,
                        resolver: resolver,
                        v6: true,
                        name: opts.name,
                        port: opts.port,
                        signal: opts.signal,
                        cb: oncb,
                    })
                } catch (e) {
                    opts.cb = undefined
                    if (onabort) {
                        opts.signal!.removeEventListener(onabort)
                    }
                    abort.abort(e)
                    throw e
                }
                return
            }
            v6 = true
        } else {
            v6 = false
        }
    }
    udp_dial_host({
        sync: true,
        resolver: Resolver.getDefault(),
        v6: v6,
        name: opts.name,
        port: opts.port,
        signal: opts.signal,
        cb: opts.cb,
    })
}

export class UdpConn {
    /**
     * Create a udp socket
     */
    static create(opts?: UdpCreateOptions): UdpConn {
        const network = opts?.network ?? 'udp'
        let v6: undefined | boolean
        if (network === 'udp4') {
            v6 = false
        } else if (network === 'udp6') {
            v6 = true
        } else if (network !== 'udp') {
            throw new UdpError(`unknow network: ${network}`)
        }
        try {
            const conn = deps.udp_create({
                v6: v6,
            })
            try {
                return new UdpConn(conn, new UdpAddr())
            } catch (e) {
                deps.udp_close(conn)
                throw e
            }
        } catch (e) {
            throwTcpError(e)
        }
    }
    /**
     * Listen for udp at the specified address
     * @remarks
     * 
     * Like create() then bind()
     */
    static listen(opts: UdpListenOptions): UdpConn {
        const o = parseUdpOptions('listen', opts)
        let c: deps.UdpConn | undefined
        try {
            c = deps.udp_listen(o)
            return new UdpConn(c, new UdpAddr())
        } catch (e) {
            if (c) {
                deps.udp_close(c)
            }
            throwUdpError(e)
        }
    }
    /**
     * Connect to udp server
     * @remarks
     * 
     * Like create() then connect()
     */
    static dial(opts: UdpListenOptions): UdpConn {
        const o = parseUdpOptions('dial', opts)
        let c: deps.UdpConn | undefined
        try {
            const remoteAddr = new UdpAddr()
            c = deps.udp_dial(o)
            remoteAddr.addr_ = c.addr
            return new UdpConn(c, remoteAddr)
        } catch (e) {
            if (c) {
                deps.udp_close(c)
            }
            throwUdpError(e)
        }
    }
    /**
     * Connect to udp server
     * @remarks
     * 
     * similar to abc but supports using domain names as addresses
     */
    static dialHost(a: any, b: any) {
        const args = parseArgs<UdpDialHostOptions, (c?: UdpConn, e?: any) => void>('dialHost', a, b)
        if (args.co) {
            return coReturn(args.co, UdpConn._dialHost, args.opts!)
        } else if (args.cb) {
            let sync = true
            UdpConn._dialHost(args.opts!, (c, e) => {
                if (sync) {
                    setImmediate(() => {
                        args.cb!(c, e)
                    })
                } else {
                    args.cb!(c, e)
                }
            })
            sync = false
        } else {
            return new Promise((resolve, reject) => {
                UdpConn._dialHost(args.opts!, (c, e) => {
                    if (c) {
                        resolve(c)
                    } else {
                        reject(e)
                    }
                })
            })
        }
    }
    private static _dialHost(opts: UdpDialHostOptions, cb?: (c?: UdpConn, e?: any) => void): void {
        if (typeof cb !== "function") {
            throw new UdpError("cb must be a function")
        }
        const network = opts.network ?? 'udp'
        let v6: undefined | boolean
        switch (network) {
            case 'udp':
                break;
            case 'udp4':
                v6 = false
                break;
            case 'udp6':
                v6 = true
                break;
            default:
                throw new UdpError(`unknow network: ${opts.network}`)
        }
        const [host, sport] = splitHostPort(opts.address)
        const port = parseInt(sport)
        if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
            throw new TcpError(`dial port invalid: ${opts.address}`)
        }
        const signal = opts.signal
        if (signal) {
            signal.throwIfAborted()
        }

        let ip: IP | undefined
        if (host != "") {
            ip = IP.parse(host)
            if (!ip) {
                udp_dial({
                    name: host,
                    port: port,
                    v6: v6,
                    signal: opts.signal,
                    cb: cb,
                })
                return
            }
        }
        if (ip) {
            if (v6 === undefined) {
                if (ip.isV4) {
                    v6 = false
                }
            } else {
                if (v6) {
                    if (!ip.isV6) {
                        throw new UdpError(`dial network restriction address must be ipv6: ${opts.address}`)
                    }
                    v6 = true
                } else {
                    if (!ip.isV4) {
                        throw new TcpError(`dial network restriction address must be ipv4: ${opts.address}`)
                    }
                    v6 = false
                }
            }
        }
        udp_dial_ip({
            sync: true,
            ip: ip?.toString(),
            port: port,
            v6: v6,
            cb: cb,
        })
    }
    /**
     * Create a udp that can only communicate with the specified target
     * @param remoteAddr 
     */
    connect(remoteAddr: UdpAddr): void {
        if (remoteAddr instanceof UdpAddr) {
            const addr = remoteAddr.addr_
            if (addr) {
                const c = this._get()
                try {
                    this.remoteAddr.addr_ = deps.udp_connect(c, addr)
                } catch (e) {
                    throwUdpError(e)
                }
            } else {
                throw new UdpError(`remoteAddr invalid`)
            }
        } else {
            throw new UdpError(`remoteAddr must be a UdpAddr`)
        }
    }
    /**
     * bind socket to local address
     */
    bind(localAddr: UdpAddr): void {
        if (localAddr instanceof UdpAddr) {
            if (this.localAddr.addr_) {
                throw new UdpError(`UdpAddr already be on ${this.localAddr}`)
            }
            const addr = localAddr.addr_
            const c = this._get()
            if (addr) {
                try {
                    this.localAddr.addr_ = deps.udp_bind(c, addr)
                } catch (e) {
                    throwUdpError(e)
                }
            } else {
                throw new UdpError(`localAddr invalid`)
            }
        } else {
            throw new UdpError(`localAddr must be a UdpAddr`)
        }

    }

    get localAddr(): UdpAddr {
        return this.c_.localAddr()
    }
    private c_: BaseUdpConn
    static attach(conn: deps.UdpConn, remoteAddr: UdpAddr): UdpConn {
        return new UdpConn(conn, remoteAddr)
    }
    private constructor(conn: deps.UdpConn, readonly remoteAddr: UdpAddr) {
        this.c_ = new BaseUdpConn(conn)
        this.md_ = conn.md
        conn.cb = () => {
            this._cb()
        }
    }
    /**
     * Returns whether the connection has been closed
     */
    get isClosed(): boolean {
        return this.c_.conn ? false : true
    }
    /**
     * Close the connection and release resources
     */
    close(): void {
        const conn = this.c_.conn
        if (conn) {
            this.c_.conn = undefined
            deps.udp_close(conn)
        }
    }
    private _get(): deps.UdpConn {
        const c = this.c_.conn
        if (!c) {
            throw new UdpError(`conn already closed`)
        }
        return c
    }
    /**
     * After calling connect, you can only use write to write data
     * 
     * @param data data to write
     */
    write(data: string | Uint8Array | ArrayBuffer): number {
        const addr = this.remoteAddr.addr_
        if (!addr) {
            throw new UdpError("write: destination address required")
        }

        const c = this._get()
        try {
            return deps.udp_write(c, data, addr)
        } catch (e) {
            throwUdpError(e)
        }
    }
    /**
     * Before calling connect, you can only use writeTo to write data
     * 
     * @param data data to write
     * @param remoteAddr write target address
     */
    writeTo(data: string | Uint8Array | ArrayBuffer, remoteAddr: UdpAddr): number {
        if (!(remoteAddr instanceof UdpAddr)) {
            throw new UdpError("write: destination address must a UdpAddr")
        }
        const addr = remoteAddr.addr_
        if (!addr) {
            throw new UdpError("write: destination address required")
        }
        const c = this._get()
        try {
            return deps.udp_write(c, data, addr)
        } catch (e) {
            throwUdpError(e)
        }
    }
    private md_: deps.ConnMetadata
    /**
     * Write buffer size
     */
    get maxWriteBytes(): number {
        return this.md_.mw
    }
    set maxWriteBytes(v: number) {
        if (!Number.isSafeInteger(v)) {
            throw new UdpError("maxWriteBytes must be a safe integer")
        } else if (v < 0) {
            v = 0
        }
        if (v != this.md_.mw) {
            this.md_.mw = v
        }
    }
    private _buffer(): Uint8Array {
        let b = this.buffer
        if (b && b.length > 0) {
            return b
        }
        b = new Uint8Array(1024 * 32)
        this.buffer = b
        return b
    }
    buffer?: Uint8Array
    private _cb() {
        const onReadable = this.onReadableBind_
        if (onReadable) {
            const r = new udpReadable(this.c_)
            onReadable(r)
            if (!r.canRed()) {
                r._close()
                return
            }
            r._close()
            if (this.isClosed) {
                return
            }
        }

        const onMessage = this.onMessageBind_
        if (onMessage) {
            const r = new udpReadable(this.c_)
            let b: Uint8Array
            let n: number
            try {
                b = this._buffer()
                n = r.read(b)
            } catch (e) {
                console.log(`udp read: ${e}`)
                return
            }
            switch (n) {
                case 0:
                    break
                case b.length:
                    onMessage(b)
                    break
                default:
                    onMessage(b.length == n ? b : b.subarray(0, n))
                    break
            }
        }
    }
    private onReadable_?: OnUdpReadableCallback
    private onReadableBind_?: (r: UdpReadable) => void
    /**
     * Callback when a message is received. If set to undefined, it will stop receiving data. 
     */
    get onReadable(): OnUdpReadableCallback | undefined {
        return this.onReadable_
    }
    set onReadable(f: OnUdpReadableCallback | undefined) {
        if (f === undefined || f === null) {
            if (!this.onReadable_) {
                return
            }
            const c = this.c_.conn
            if (c && !this.onMessage_) {
                deps.udp_conn_cb(c, false)
            }
            this.onReadable_ = undefined
            this.onReadableBind_ = undefined
        } else {
            if (f === this.onReadable_) {
                return
            }
            if (typeof f !== "function") {
                throw new UdpError("onReadable must be a function")
            }
            const c = this.c_.conn
            const bind = f.bind(this)
            if (c && !this.onMessage_) {
                deps.udp_conn_cb(c, true)
            }
            this.onReadable_ = f
            this.onReadableBind_ = bind
        }
    }

    private onMessage_?: OnMessageCallback<UdpConn>
    private onMessageBind_?: (data: Uint8Array) => void
    /**
     * Callback when a message is received. If set to undefined, it will stop receiving data. 
     */
    get onMessage(): OnMessageCallback<UdpConn> | undefined {
        return this.onMessage_
    }
    set onMessage(f: OnMessageCallback<UdpConn> | undefined) {
        if (f === undefined || f === null) {
            if (!this.onMessage_) {
                return
            }
            const c = this.c_.conn
            if (c && !this.onReadable_) {
                deps.udp_conn_cb(c, false)
            }
            this.onMessageBind_ = undefined
            this.onMessage_ = undefined
        } else {
            if (f === this.onMessage_) {
                return
            }
            if (typeof f !== "function") {
                throw new UdpError("onMessage must be a function")
            }
            const c = this.c_.conn
            const bind = f.bind(this)
            if (c && !this.onReadable_) {
                deps.udp_conn_cb(c, true)
            }
            this.onMessage_ = f
            this.onMessageBind_ = bind
        }
    }
}


class FixedBuffer<T> {
    length = 0
    offset = 0
    constructor(readonly buf: Array<T>) {

    }
    full() {
        return this.buf.length == this.length
    }
    push(v: T) {
        const cap = this.buf.length
        const len = this.length
        const offset = this.offset
        if (cap == len) {
            this.buf[(offset + len) % cap] = v
            this.offset = (offset + 1) % cap
        } else {
            this.buf[(offset + len) % cap] = v
            this.length++
        }
    }
    pop(): T | undefined {
        if (this.length) {
            const offset = this.offset
            const cap = this.buf.length
            const v = this.buf[offset]
            this.offset = (offset + 1) % cap
            this.length--
            return v
        }
    }
}
interface UdpRead {
    data: Uint8Array
    addr?: UdpAddr
}
export class UdpConnReader {
    private buf_: FixedBuffer<UdpRead>
    private addr_?: FixedBuffer<UdpAddr>
    constructor(readonly conn: UdpConn, n?: number, addr?: boolean) {
        if (!(conn instanceof UdpConn)) {
            throw new Error("conn must be a UdpConn")
        } else if (Number.isSafeInteger(n)) {
            if (n! < 1) {
                n = 32
            } else if (n! > 1024) {
                n = 1024
            }
        } else {
            n = 32
        }
        this.buf_ = new FixedBuffer(new Array<UdpRead>(n!))
        if (addr) {
            this.addr_ = new FixedBuffer(new Array<UdpAddr>(n!))
        }
        this._read()
    }
    private _read() {
        const conn = this.conn
        conn.onMessage = undefined
        const addr = this.addr_
        conn.onReadable = (r) => {
            let b: Uint8Array | undefined
            let remote: UdpAddr | undefined
            try {
                b = this.conn.buffer
                if (!b || b.length < 1) {
                    b = new Uint8Array(1024 * 32)
                    this.conn.buffer = b
                }
                if (addr) {
                    remote = addr.pop()
                    if (!remote) {
                        remote = new UdpAddr()
                    }
                }
            } catch (e) {
                if (remote) {
                    addr!.push(remote)
                }
                const cb = this.cb_
                if (cb) {
                    this.cb_ = undefined
                    cb(undefined, e)
                    return
                } else {
                    console.log(`UdpConnReader: ${e}`)
                    return
                }
            }
            let n: number
            try {
                n = r.read(b, remote)
            } catch (e) {
                if (remote) {
                    addr!.push(remote)
                }
                const cb = this.cb_
                if (cb) {
                    this.cb_ = undefined
                    cb()
                } else {
                    console.log(`UdpConnReader: ${e}`)
                }
                return
            }
            switch (n) {
                case 0:
                    {
                        if (remote) {
                            addr!.push(remote)
                        }
                        const cb = this.cb_
                        if (cb) {
                            this.cb_ = undefined
                            cb()
                        }
                    }
                    break
                case b.length:
                    this._onMessage(b, remote)
                    break
                default:
                    this._onMessage(b.length == n ? b : b.subarray(0, n), remote)
                    break
            }
        }
    }
    private _onMessage(msg: Uint8Array, addr?: UdpAddr) {
        let v: Uint8Array
        try {
            if (msg.length) {
                v = new Uint8Array(msg.length)
                deps.copy(v, msg)
            } else {
                v = msg
            }
        } catch (e) {
            console.log(`UdpConnReader: ${e}`)
            return
        }
        const cb = this.cb_
        if (cb) {
            this.cb_ = undefined
            cb({
                data: v,
                addr: addr,
            })
            return
        }
        const buf = this.buf_
        buf.push({
            data: v,
            addr: addr,
        })
        if (buf.full()) {
            this.conn.onReadable = undefined
        }
    }
    private cb_?: (data?: UdpRead, e?: any) => void
    read(a: any, b: any) {
        if (this.conn.isClosed) {
            throw new UdpError("conn already closed")
        } else if (this.cb_) {
            throw new UdpError("read busy")
        }
        const args = parseOptionalArgs<UdpAddr, (msg?: Uint8Array, e?: any) => void>('UdpConnReader', a, b)
        const addr = args.opts
        if (args.co) {
            const v = this.buf_.pop()
            if (v) {
                if (!this.conn.onReadable) {
                    this._read()
                }
                if (addr && v.addr) {
                    addr.copyFrom(v.addr)
                    this.addr_!.push(v.addr)
                }
                return v.data
            }
            const v1 = args.co.yield<UdpRead>((notify) => {
                this.cb_ = (v, e) => {
                    if (e === undefined) {
                        notify.value(v!)
                    } else {
                        notify.error(e)
                    }
                }
            })
            if (addr && v1.addr) {
                addr.copyFrom(v1.addr)
                this.addr_!.push(v1.addr)
            }
            return v1.data
        } else if (args.cb) {
            const cb = args.cb
            const v = this.buf_.pop()
            if (v) {
                if (!this.conn.onReadable) {
                    this._read()
                }
                if (addr && v.addr) {
                    addr.copyFrom(v.addr)
                    this.addr_!.push(v.addr)
                }
                cb(v.data)
                return
            }
            this.cb_ = (v, e) => {
                if (e === undefined) {
                    if (addr && v?.addr) {
                        try {
                            addr.copyFrom(v!.addr)
                            this.addr_!.push(v.addr)
                        } catch (e) {
                            cb(undefined, e)
                            return
                        }
                    }
                    cb(v!.data)
                } else {
                    cb(undefined, e)
                }
            }
        } else {
            return new Promise<Uint8Array | undefined>((resolve, reject) => {
                const v = this.buf_.pop()
                if (v) {
                    if (!this.conn.onMessage) {
                        this._read()
                    }
                    if (addr && v.addr) {
                        addr.copyFrom(v.addr)
                        this.addr_!.push(v.addr)
                    }
                    resolve(v.data)
                    return
                }
                this.cb_ = (v, e) => {
                    if (e === undefined) {
                        if (addr && v?.addr) {
                            try {
                                addr.copyFrom(v.addr)
                                this.addr_!.push(v.addr)
                            } catch (e) {
                                reject(e)
                                return
                            }
                        }
                        resolve(v!.data)
                    } else {
                        reject(e)
                    }
                }
            })
        }
    }
    close() {
        this.conn.close()
        const cb = this.cb_
        if (cb) {
            this.cb_ = undefined
            const e = new UdpError("conn already closed")
            cb(undefined, e)
        }
    }
    write(data: string | Uint8Array | ArrayBuffer) {
        return this.conn.write(data)
    }
    writeTo(data: string | Uint8Array | ArrayBuffer, remoteAddr: UdpAddr) {
        return this.conn.writeTo(data, remoteAddr)
    }
}

class LoopBuffer {
    len = 0
    offset = 0
    constructor(readonly buf: Uint8Array) { }
    avaliable() {
        return this.buf.length - this.len
    }
    write(): number {
        return (this.offset + this.len) % this.buf.length
    }

    read(dst: Uint8Array): number {
        let data_len = dst.length
        if (data_len) {
            const buf = this.buf
            const cap = buf.length
            const len = this.len

            data_len = len < data_len ? len : data_len
            const i = this.offset
            const max = cap - i
            if (max < data_len) {
                deps.copy(dst, buf.subarray(i, i + max))
                deps.copy(dst.subarray(max), buf.subarray(0, data_len - max))
            }
            else {
                deps.copy(dst, buf.subarray(i, i + data_len))
            }
            if (data_len == len) {
                this.len = 0
                this.offset = 0
            }
            else {
                this.len -= data_len
                this.offset += data_len
                this.offset %= cap
            }
            return data_len
        }
        return 0;
    }
}
interface ReadBytes {
    cb: (n?: number, e?: any) => void
    dst: Uint8Array
}
interface WriteBytes {
    cb: (n?: number, e?: any) => void
    data: string | Uint8Array | ArrayBuffer
}
export class TcpConnReaderWriter {
    private buf_: LoopBuffer
    constructor(readonly conn: BaseTcpConn, buf?: Uint8Array) {
        if (!(conn instanceof BaseTcpConn)) {
            throw new Error("conn must be a BaseTcpConn")
        }
        if (buf === null || buf === undefined) {
            buf = new Uint8Array(1024 * 32)
        } else if (buf instanceof Uint8Array) {
            if (buf.length < 128) {
                throw new Error("buf.length < 128")
            }
        } else {
            throw new Error("buf must be a Uint8Array")
        }
        this.buf_ = new LoopBuffer(buf)
        conn.onWritable = undefined
        this._read()

        this.onError_ = conn.onError
        conn.onError = (e) => {
            const onError: any = this.onError_
            if (onError) {
                onError(e)
            }
            const r = this.read_
            if (r) {
                this.read_ = undefined
                const cb = r.cb
                if (typeof e === "object" && e.eof && e.read) {
                    cb(0)
                    return
                }
                cb(undefined, e)
            }
            const w = this.write_
            if (w) {
                this.write_ = undefined
                const cb = w.cb
                cb(undefined, e)
            }
        }
    }
    private onError_?: (this: Conn, e: any) => void
    close() {
        this.conn.close()
        const r = this.read_
        const w = this.write_
        if (r || w) {
            this.read_ = undefined
            this.write_ = undefined
            const e = new TcpError("conn already closed")
            if (r) {
                const cb = r.cb
                cb(undefined, e)
            }
            if (w) {
                const cb = w.cb
                cb(undefined, e)
            }
        }
        const onError = this.onError_
        if (onError) {
            this.onError_ = onError
        }
    }
    private _write(w: WriteBytes) {
        const conn = this.conn
        conn.onWritable = () => {
            const w = this.write_
            if (w) {
                this.write_ = undefined
                let n: number
                const cb = w.cb
                try {
                    n = conn.write(w.data)!
                } catch (e) {
                    cb(undefined, e)
                    return
                }
                cb(n)
            }
            conn.onWritable = undefined
        }
        this.write_ = w
    }
    private read_?: ReadBytes
    private _read() {
        const conn = this.conn
        const buf = this.buf_
        const b = buf.buf
        const cap = b.length
        conn.onMessage = undefined
        conn.onReadable = (r) => {
            if (buf.len) {
                buf.offset = 0
                buf.len = r.read(b)
            } else {
                let begin: number
                let end: number
                while (r.length) {
                    begin = (buf.offset + buf.len) % cap
                    end = begin + cap - buf.len
                    if (end > cap) {
                        end = cap
                    }
                    buf.len += r.read(b.subarray(begin, end))
                }
            }
            const read = this.read_
            if (read) {
                this.read_ = undefined
                const n = buf.read(read.dst)
                const cb = read.cb
                cb(n)
            }
            if (buf.len == cap) {
                conn.onReadable = undefined
            }
        }
    }
    read(a: any, b: any) {
        if (this.conn.isClosed) {
            throw new TcpError("conn already closed")
        } else if (this.read_) {
            throw new TcpError("read busy")
        }
        const args = parseArgs<Uint8Array, (n?: number, e?: any) => void>('TcpConnReaderWriter.read', a, b)
        const dst = args.opts!
        const buf = this.buf_
        if (args.co) {
            if (buf.len) {
                const n = buf.read(dst)
                if (n) {
                    this._read()
                }
                return n
            }
            return args.co.yield((notify) => {
                this.read_ = {
                    dst: dst,
                    cb: (n, e) => {
                        if (e === undefined) {
                            notify.value(n)
                        } else {
                            notify.error(e)
                        }
                    },
                }
            })
        } else if (args.cb) {
            const cb = args.cb
            if (buf.len) {
                const n = buf.read(dst)
                if (n) {
                    this._read()
                }
                cb(n)
                return
            }
            this.read_ = {
                dst: dst,
                cb: cb,
            }
        } else {
            return new Promise((resolve, reject) => {
                if (buf.len) {
                    const n = buf.read(dst)
                    if (n) {
                        this._read()
                    }
                    resolve(n)
                    return
                }
                this.read_ = {
                    dst: dst,
                    cb: (n, e) => {
                        if (e === undefined) {
                            resolve(n)
                        } else {
                            reject(e)
                        }
                    },
                }
            })
        }
    }
    private write_?: WriteBytes
    write(a: any, b: any) {
        const args = parseArgs<string | Uint8Array | ArrayBuffer, (n?: number, e?: any) => void>('TcpConnReaderWriter.write', a, b)
        const conn = this.conn
        if (conn.isClosed) {
            throw new TcpError("conn already closed")
        } else if (this.write_) {
            throw new TcpError("write busy")
        }
        const data = args.opts!
        const n = conn.write(data)
        if (args.co) {
            if (n === undefined) {
                return args.co.yield((notify) => {
                    this._write({
                        data: data,
                        cb: (n, e) => {
                            if (e === undefined) {
                                notify.value(n)
                            } else {
                                notify.error(e)
                            }
                        },
                    })
                })
            }
            return n
        } else if (args.cb) {
            const cb = args.cb
            if (n === undefined) {
                this._write({
                    data: data,
                    cb: cb,
                })
            } else {
                cb(n)
            }
        } else {
            if (n === undefined) {
                return new Promise((resolve, reject) => {
                    this._write({
                        data: data,
                        cb: (n, e) => {
                            if (e === undefined) {
                                resolve(n)
                            } else {
                                reject(e)
                            }
                        },
                    })
                })
            }
            return Promise.resolve(n)
        }
    }
}
export function isSupportV6(): boolean {
    let ok = deps._ipv6
    if (ok === undefined) {
        ok = deps.support_ipv6()
        deps._ipv6 = ok
    }
    return ok
}
export function isSupportV4(): boolean {
    let ok = deps._ipv4
    if (ok === undefined) {
        ok = deps.support_ipv4()
        deps._ipv4 = ok
    }
    return ok
}
let _threshold = 0
export function mbedtlsDebug(level?: number) {
    if (level === undefined || level === null) {
        return _threshold
    }

    if (Number.isSafeInteger(level) && level < 5 && level > 0) {
        if (_threshold != level) {
            deps.mbedtls_debug(level)
            _threshold = level
        }
    } else {
        throw new Error("threshold must be an integer from 0 to 4")
    }
}
const asyncOptions: deps.AsyncOptions = {}
const asyncPostOptions: deps.AsyncOptions = { post: true }
let rootCertificate: undefined | string
let certificates: undefined | Array<(s?: string, e?: any) => void>
function loadCertificate(opts: deps.AsyncOptions, cb: (s?: string, e?: any) => void) {
    if (certificates) {
        certificates.push(cb)
    } else {
        const arrs = [cb]
        deps.load_certificate(opts, (s, e) => {
            if (arrs === certificates) {
                if (e === undefined) {
                    rootCertificate = s
                }
            }
            for (let i = 0; i < arrs.length; i++) {
                arrs[i](s, e)
            }
        })
        certificates = arrs
    }
}
function getCertificate(a: any, b: any) {
    const args = parseOptionalArgs<deps.AsyncOptions, (s?: string, e?: any) => void>('getCertificate', a, b)
    const opts = args.opts?.post ? asyncPostOptions : asyncOptions
    if (args.co) {
        if (rootCertificate === undefined || rootCertificate === null) {
            const s = args.co.yield((notify) => {
                loadCertificate(opts, (s, e) => {
                    if (e === undefined) {
                        notify.value(s)
                    } else {
                        notify.error(e)
                    }
                })
            })
            return s
        }
        return rootCertificate
    } else if (args.cb) {
        if (rootCertificate === undefined || rootCertificate === null) {
            loadCertificate(opts, args.cb)
        } else {
            const cb = args.cb
            cb(rootCertificate)
        }
    } else if (a === undefined || a === null) {
        if (rootCertificate === undefined || rootCertificate === null) {
            return new Promise((resolve, reject) => {
                loadCertificate(opts, (s, e) => {
                    if (e === undefined) {
                        resolve(s)
                    } else {
                        reject(e)
                    }
                })
            })
        }
        return Promise.resolve(rootCertificate)
    }
}
/**
 * The root certificate used by the script
 */
export class RootCertificate {
    private constructor() { }
    /**
     * Replace the root certificate used by the script
     * @param v 
     */
    static set(v: string | undefined): void {
        if (typeof v === "string") {
            rootCertificate = v
        } else {
            rootCertificate = undefined
        }
    }
    static getSync(): string {
        if (rootCertificate === undefined || rootCertificate === null) {
            rootCertificate = deps.load_certificate()
        }
        return rootCertificate
    }
    static get(a: any, b: any) {
        return getCertificate(a, b)
    }
}

export function module_destroy() {
    if (Resolver.hasDefault()) {
        Resolver.getDefault().close()
    }
}


