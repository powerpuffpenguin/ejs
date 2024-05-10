declare namespace __duk {
    class Error {
        constructor(message?: string)
    }
    class OsError extends Error { }
    namespace Os {
        const ETIMEDOUT: number
    }
}
declare namespace deps {
    export function eq(a: Uint8Array, b: Uint8Array): boolean
    export function hex_string(b: Uint8Array): string
    export function ip_string(ip: Uint8Array): string
    export function parse_ip(s: string): Uint8Array | undefined
    export function ip_4in6(ip: Uint8Array): boolean
    export function ip_equal(a: Uint8Array, b: Uint8Array): boolean
    export function ip_mask(mask: Uint8Array, ip: Uint8Array): Uint8Array | undefined
    export function networkNumberAndMask(ip: Uint8Array, mask: Uint8Array): [Uint8Array, Uint8Array] | undefined
    export function cidr_mask(ones: number, bits: number): Uint8Array | undefined
    export function mask_size(mask: Uint8Array): [number, number]
    export function ipnet_contains(net_ip: Uint8Array, mask: Uint8Array, ip: Uint8Array): boolean
    export function ipnet_string(net_ip: Uint8Array, mask: Uint8Array): string
    export function parse_cidr(s: string): { ip: Uint8Array, mask: Uint8Array } | undefined

    export class evbuffer {
        readonly __id = "evbuffer"
    }
    export function evbuffer_len(b: evbuffer): number
    export function evbuffer_read(b: evbuffer, dst: Uint8Array): number
    export function evbuffer_copy(b: evbuffer, dst: Uint8Array, skip?: number): number
    export function evbuffer_drain(b: evbuffer, n: number): void

    export const BEV_EVENT_CONNECTED: number
    export const BEV_EVENT_WRITING: number
    export const BEV_EVENT_READING: number
    export const BEV_EVENT_TIMEOUT: number
    export const BEV_EVENT_EOF: number
    export const BEV_EVENT_ERROR: number

    export function socket_error_str(): string
    export function socket_error(): number
    export function connect_error_str(p: unknown): string
    export interface TcpConnMetadata {
        /**
         * max write bytes
         */
        mw: number
    }
    export class TcpConn {
        readonly __id = "TcpConn"
        busy?: boolean
        cbw: () => void
        cbr: (b: evbuffer) => void
        cbe?: (what: number) => void
        md: TcpConnMetadata
        p: unknown
    }
    export class TcpListener {
        readonly __id = "TcpListener"
        cb?: (c: TcpConn, remoteIP: string, remotePort: number, localIP: string, localPort: number) => void
        err?: (e: any) => void
    }
    export interface TcpListenerOptions {
        ip?: string
        v6?: boolean
        port: number
        backlog: number
    }
    export function tcp_listen(opts: TcpListenerOptions): TcpListener
    export function tcp_listen_close(l: TcpListener): void
    export function tcp_listen_cb(l: TcpListener, enable: boolean): void
    export function tcp_listen_err(l: TcpListener, enable: boolean): void
    export function tcp_conn_stash(c: TcpConn, put: boolean): void
    export function tcp_conn_close(c: TcpConn): void
    export function tcp_conn_write(c: TcpConn, data: string | Uint8Array | ArrayBuffer): number | undefined
    export function tcp_conn_cb(c: TcpConn, enable: boolean): void
    export function tcp_conn_localAddr(c: TcpConn): [string, number]
    export interface TcpConnectOptions {
        ip: string
        v6: boolean
        port: number
    }
    export function tcp_conect(opts: TcpConnectOptions): TcpConn

    export class Resolve {
        readonly __id = "Resolve"
    }
    export class Resolver {
        readonly __id = "Resolver"
    }
    export interface ResolverOptions {
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
    export function resolver_new(opts: ResolverOptions): Resolver
    export function resolver_free(r: Resolver): void
    export interface ResolverIPOptions {
        r: Resolver
        name: string
        v6: boolean
        cb: (ip: Array<string>, result: number, msg: string) => void
    }
    export function resolver_ip(opts: ResolverIPOptions): Resolve
    export function resolver_ip_cancel(r: Resolve): void
}

export class AddrError extends __duk.Error {
    constructor(readonly addr: string, message: string) {
        super(message);
        (this as any).name = "AddrError"
    }
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
export interface ListenOptions {
    /**
     * name of the network (for example, "tcp", "udp")
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
    onMessage?: OnMessageCallback
}
export interface Readable {
    readonly length: number
    read(dst: Uint8Array): number
    copy(dst: Uint8Array): number
    drain(n: number): void
}
class evbufferReadable implements Readable {
    constructor(readonly b: deps.evbuffer) { }
    get length(): number {
        return deps.evbuffer_len(this.b)
    }
    read(dst: Uint8Array): number {
        return deps.evbuffer_read(this.b, dst)
    }
    copy(dst: Uint8Array, skip?: number): number {
        return deps.evbuffer_copy(this.b, dst, skip)
    }
    drain(n: number) {
        deps.evbuffer_drain(this.b, n)
    }
}
export type OnReadableCallback = (this: Conn, r: Readable) => void
export type OnMessageCallback = (this: Conn, data: Uint8Array) => void
export class TcpConn implements Conn {
    private c_?: deps.TcpConn
    private md_: deps.TcpConnMetadata
    constructor(readonly remoteAddr: Addr, readonly localAddr: Addr, conn: deps.TcpConn) {
        this.c_ = conn
        this.md_ = conn.md
        conn.cbw = () => {
            const f = this.onWritable
            if (f) {
                f.bind(this)()
            }
        }
        conn.cbr = (r) => {
            this._cbr(r)
        }
        conn.cbe = (what) => {
            const f = this.onError
            let e: TcpError
            if (what & deps.BEV_EVENT_WRITING) {
                if (what & deps.BEV_EVENT_EOF) {
                    if (f) {
                        e = new TcpError("write eof")
                        e.write = true
                        e.eof = true
                    }
                } else if (what & deps.BEV_EVENT_TIMEOUT) {
                    if (f) {
                        e = new TcpError("write timeout")
                        e.write = true
                        e.timeout = true
                    }
                } else if (what & deps.BEV_EVENT_ERROR) {
                    if (f) {
                        if (deps.socket_error() === __duk.Os.ETIMEDOUT) {
                            e = new TcpError("write timeout")
                        } else {
                            e = new TcpError(deps.socket_error_str())
                        }
                        e.write = true
                    }
                } else {
                    return
                }
            } else if (what & deps.BEV_EVENT_READING) {
                if (what & deps.BEV_EVENT_EOF) {
                    if (f) {
                        e = new TcpError("read eof")
                        e.read = true
                        e.eof = true
                    }
                } else if (what & deps.BEV_EVENT_TIMEOUT) {
                    if (f) {
                        e = new TcpError("read timeout")
                        e.read = true
                        e.timeout = true
                    }
                } else if (what & deps.BEV_EVENT_ERROR) {
                    if (f) {
                        if (deps.socket_error() === __duk.Os.ETIMEDOUT) {
                            e = new TcpError("read timeout")
                        } else {
                            e = new TcpError(deps.socket_error_str())
                        }
                        e.read = true
                    }
                } else {
                    return
                }
            } else {
                return
            }

            if (f) {
                f.bind(this)(e!)
            }
            this.close()
        }
    }
    onError?: (this: Conn, e: any) => void
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
            throw new TcpError(`conn already closed`)
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
            throwTcpError(e)
        }
    }
    /**
     * Callback whenever the write buffer changes from unwritable to writable
     */
    onWritable?: (this: Conn) => void
    /**
     * Write buffer size
     */
    get maxWriteBytes(): number {
        return this.md_.mw
    }
    set maxWriteBytes(v: number) {
        if (!Number.isSafeInteger(v)) {
            throw new TcpError("maxWriteBytes must be a safe integer")
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
        const onReadable = this.onReadable
        if (onReadable) {
            onReadable.bind(this)(new evbufferReadable(r))
        }

        const onMessage = this.onMessage_
        if (onMessage) {
            const b = this._buffer()
            const n = deps.evbuffer_read(r, b)
            switch (n) {
                case 0:
                    break
                case b.length:
                    onMessage.bind(this)(b)
                    break
                default:
                    onMessage.bind(this)(b.length == n ? b : b.subarray(0, n))
                    break
            }
        }
    }
    private onReadable_?: OnReadableCallback
    /**
     * Callback when a message is received. If set to undefined, it will stop receiving data. 
     */
    get onReadable(): OnReadableCallback | undefined {
        return this.onReadable_
    }
    set onReadable(f: OnReadableCallback | undefined) {
        if (f === undefined || f === null) {
            if (!this.onReadable_) {
                return
            }
            const c = this.c_
            if (c && !this.onMessage_) {
                deps.tcp_conn_cb(c, false)
            }
            this.onReadable_ = undefined
        } else {
            if (f === this.onReadable_) {
                return
            }
            if (typeof f !== "function") {
                throw new TcpError("onReadable must be a function")
            }
            const c = this.c_
            if (c && !this.onMessage_) {
                deps.tcp_conn_cb(c, true)
            }
            this.onReadable_ = f
        }
    }

    private onMessage_?: OnMessageCallback
    /**
     * Callback when a message is received. If set to undefined, it will stop receiving data. 
     */
    get onMessage(): OnMessageCallback | undefined {
        return this.onMessage_
    }
    set onMessage(f: OnMessageCallback | undefined) {
        if (f === undefined || f === null) {
            if (!this.onMessage_) {
                return
            }
            const c = this.c_
            if (c && !this.onReadable_) {
                deps.tcp_conn_cb(c, false)
            }
            this.onMessage_ = undefined
        } else {
            if (f === this.onMessage_) {
                return
            }
            if (typeof f !== "function") {
                throw new TcpError("onMessage must be a function")
            }
            const c = this.c_
            if (c && !this.onReadable_) {
                deps.tcp_conn_cb(c, true)
            }
            this.onMessage_ = f
        }
    }
}
export type OnAcceptCallback = (this: Listener, c: Conn) => void
export type onErrorCallback<T> = (this: T, e: any) => void
export interface Listener {
    readonly addr: Addr
    close(): void
    onAccept?: OnAcceptCallback
    onError?: onErrorCallback<Listener>
}
export class TcpListener implements Listener {
    private l_?: deps.TcpListener
    constructor(readonly addr: Addr, l: deps.TcpListener) {
        l.cb = (c, remoteIP, remotePort, localIP, localPort) => {
            this._onAccept(c, remoteIP, remotePort, localIP, localPort)
        }
        l.err = (e) => {
            this._onError(e)
        }
        this.l_ = l
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
    private onError_?: onErrorCallback<Listener>
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
        } else {
            if (f === this.onAccept_) {
                return
            }
            if (typeof f !== "function") {
                throw new TcpError("onAccept must be a function")
            }
            const l = this.l_
            if (l) {
                deps.tcp_listen_cb(l, true)
            }
            this.onAccept_ = f
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
        } else {
            if (f === this.onError_) {
                return
            }
            if (typeof f !== "function") {
                throw new TcpError("onError must be a function")
            }
            const l = this.l_
            if (l) {
                deps.tcp_listen_err(l, true)
            }
            this.onError_ = f
        }
    }
    get onAccept(): OnAcceptCallback | undefined {
        return this.onAccept_
    }
    get onError(): onErrorCallback<Listener> | undefined {
        return this.onError_
    }
    private _onAccept(conn: deps.TcpConn, remoteIP: string, remotePort: number, localIP: string, localPort: number) {
        const onAccept = this.onAccept_
        if (!onAccept) {
            deps.tcp_conn_stash(conn, false)
            return
        }
        let c: TcpConn
        try {
            if (remoteIP.startsWith('::ffff:')) {
                remoteIP = remoteIP.substring(7)
            }
            if (localIP.startsWith('::ffff:')) {
                localIP = localIP.substring(7)
            }
            c = new TcpConn(
                new NetAddr('tcp', joinHostPort(remoteIP, remotePort)),
                new NetAddr('tcp', joinHostPort(localIP, localPort)),
                conn,
            )
        } catch (e) {
            deps.tcp_conn_stash(conn, false)
            throw e
        }
        deps.tcp_conn_stash(conn, true)
        onAccept.bind(this)(c)
    }
    private _onError(e: any) {
        const cb = this.onError_
        if (cb) {
            cb.bind(this)(e)
        }
    }
}
function listenTCP(opts: ListenOptions, v6?: boolean): TcpListener {
    try {
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
            backlog: backlog
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
            return new TcpListener(new NetAddr('tcp', address), l)
        } catch (e) {
            deps.tcp_listen_close(l)
            throw e
        }
    } catch (e) {
        throwTcpError(e)
    }
}
type DialCallback = (c?: Conn, e?: any) => void

class TcpDialer {
    c_?: deps.TcpConn
    // r0_?: Resolve
    // r1_?: Resolve
    cb_?: DialCallback
    onabort_?: AbortListener
    constructor(readonly opts: DialOptions, cb: DialCallback) {
        this.cb_ = cb
    }
    dial(v6?: boolean) {
        const opts = this.opts
        const [host, sport] = splitHostPort(opts.address)
        const port = parseInt(sport)
        if (!Number.isSafeInteger(port) || port < 1 || port > 65535) {
            throw new TcpError(`dial port invalid: ${opts.address}`)
        }
        let ip: string | undefined
        if (host == "") {
            if (v6 === undefined) {
                v6 = false
                ip = `127.0.0.1`
            } else if (v6) {
                v6 = true
                ip = `::1`
            } else {
                v6 = false
                ip = `127.0.0.1`
            }
        } else {
            const v = IP.parse(host)
            if (!v) {
                try {
                    Resolver.getDefault().resolve({
                        name: host,
                        v6: v6,
                        signal: opts.signal,
                    }, (ip, e, ipv6) => {
                        const cb = this.cb_
                        if (!cb) {
                            return
                        }
                        if (!ip) {
                            this.cb_ = undefined
                            this._closeSignal()
                            cb(undefined, e)
                            return
                        } else if (ip.length === 0) {
                            this.cb_ = undefined
                            this._closeSignal()
                            cb(undefined, new TcpError(`unknow host: ${host}`))
                            return
                        }
                        this._connect({
                            ip: ip[0],
                            port: port,
                            v6: ipv6!,
                        })
                    })
                } catch (e) {
                    throw e
                }
                this._signal()
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
        this._connect({
            ip: ip,
            port: port,
            v6: v6,
        })
        this._signal()
    }
    private _signal() {
        const signal = this.opts.signal
        if (signal) {
            this.onabort_ = (reason) => {
                const cb = this.cb_
                if (!cb) {
                    return
                }
                this.cb_ = undefined

                const c = this.c_
                if (c) {
                    this.c_ = undefined
                    deps.tcp_conn_close(c)
                }

                cb(undefined, reason)
            }
            signal.addEventListener(this.onabort_)
        }
    }
    private _closeSignal() {
        const signal = this.opts.signal
        if (signal) {
            const onabort = this.onabort_
            if (onabort) {
                this.onabort_ = undefined
                signal.removeEventListener(onabort)
            }
        }
    }

    private _connect(opts: deps.TcpConnectOptions) {
        const c = deps.tcp_conect(opts)
        this.c_ = c
        c.cbe = (what) => {
            const cb = this.cb_
            if (!cb) {
                const c = this.c_
                if (c) {
                    this.c_ = undefined
                    deps.tcp_conn_close(c)
                }
                return
            }
            this.cb_ = undefined

            this._closeSignal()

            if (what & deps.BEV_EVENT_TIMEOUT) {
                deps.tcp_conn_close(c)

                const e = new TcpError("connect timeout")
                e.connect = true
                e.timeout = true

                cb(undefined, e)
            } else if (what & deps.BEV_EVENT_ERROR) {
                deps.tcp_conn_close(c)

                if (deps.socket_error() === __duk.Os.ETIMEDOUT) {
                    const e = new TcpError("connect timeout")
                    e.connect = true
                    e.timeout = true

                    cb(undefined, e)
                } else {
                    deps.tcp_conn_close(c)

                    const e = new TcpError(deps.socket_error_str())
                    e.connect = true
                    cb(undefined, e)
                }
            } else {
                let conn: undefined | TcpConn
                try {
                    let [ip, port] = deps.tcp_conn_localAddr(c)
                    if (ip.startsWith('::ffff:')) {
                        ip = ip.substring(7)
                    }
                    conn = new TcpConn(new NetAddr('tcp', joinHostPort(opts.ip, opts.port)),
                        new NetAddr('tcp', joinHostPort(ip, port)),
                        c,
                    )
                } catch (e) {
                    deps.tcp_conn_close(c)
                    throw e
                }
                cb(conn)
                return
            }
        }
    }
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
        default:
            throw new NetError(`unknow network: ${opts.network}`);
    }
}
export interface DialOptions {
    /**
     * name of the network (for example, "tcp", "udp")
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
}
/**
 * Dial a listener to create a connection for bidirectional communication
 */
export function dial(opts: DialOptions, cb: DialCallback) {
    if (typeof cb !== "function") {
        throw new Error(`cb must be a function`)
    }
    if (opts.signal) {
        opts.signal.throwIfAborted()
    }
    switch (opts.network) {
        case 'tcp':
            new TcpDialer(opts, cb).dial()
            break
        case 'tcp4':
            new TcpDialer(opts, cb).dial(false)
            break
        case 'tcp6':
            new TcpDialer(opts, cb).dial(true)
            break
        default:
            throw new NetError(`unknow network: ${opts.network}`);
    }
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
    cb?: (ip?: Array<string>, e?: any, ipv6?: boolean) => void

    v4?: deps.Resolve
    v6?: deps.Resolve
    err?: ResolverError
    ip?: Array<string>
    constructor(readonly r: deps.Resolver, readonly opts: ResolveOptions, cb?: (ip?: Array<string>, e?: any, ipv6?: boolean) => void) {
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
            const onip = (ipv6: boolean, ip: Array<string>, result: number, msg: string) => {
                const cb = this.cb
                if (!cb) {
                    return
                }
                if (ipv6) {
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

                    err = new ResolverError(msg)
                    this.err = err
                    if (result == 69) {
                        err.cancel = true
                    }
                    err.result = result

                    if (this.ip) { // 2 request end
                        this.cb = undefined
                        this._cancel()
                        if (onAbort) {
                            signal!.removeEventListener(onAbort)
                        }
                        cb(undefined, err)
                    }
                    return
                } else if (ip.length == 0) {
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
                    this.ip = ip
                    return
                }

                this.cb = undefined
                this._cancel()
                if (onAbort) {
                    signal!.removeEventListener(onAbort)
                }
                cb(ip, undefined, ipv6)
            }
            this.v4 = deps.resolver_ip({
                r: r,
                name: opts.name,
                v6: false,
                cb: (ip, result, msg) => {
                    onip(false, ip, result, msg)
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

    resolve(opts: ResolveOptions, cb: (this: Resolver, ip?: Array<string>, e?: any, ipv6?: boolean) => void): void {
        const r = this.r_
        if (!r) {
            throw new ResolverError("Resolver already closed")
        }
        if (typeof cb !== "function") {
            throw new ResolverError("cb must be an function")
        }
        if (typeof opts.name !== "string" || opts.name == "") {
            throw new ResolverError("resolve name invalid")
        }
        if (opts.v6 === undefined || opts.v6 === null) {
            new Resolve4or6(r, opts, cb.bind(this)).resolve()
        } else {
            this._resolve(r, opts.v6 ? true : false, opts, cb.bind(this))
        }
    }
    private _resolve(r: deps.Resolver, v6: boolean, opts: ResolveOptions, cb?: (ip?: Array<string>, e?: any, ipv6?: boolean) => void): void {
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
                cb: (ip, result, msg) => {
                    const f = cb
                    if (!f) {
                        return
                    }
                    cb = undefined
                    if (signal) {
                        signal.removeEventListener(onAbort!)
                    }

                    if (result) {
                        const e = new ResolverError(msg)
                        if (result == 69) {
                            e.cancel = true
                        }
                        e.result = result
                        f(undefined, e)
                    } else {
                        f(ip, undefined, v6)
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

export function module_destroy() {
    if (Resolver.hasDefault()) {
        Resolver.getDefault().close()
    }
}
