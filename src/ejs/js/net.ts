declare namespace __duk {
    class Error {
        constructor(message?: string)
    }
    class OsError extends Error { }

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

    export class TCPConn {
        readonly __id = "TCPConn"
    }
    export class TCPListener {
        readonly __id = "TCPListener"
        cb?: (c: TCPConn, remoteIP: string, remotePort: number, localIP: string, localPort: number) => void
        err?: (e: any) => void
    }
    export interface TCPListenerOptions {
        ip?: string
        v6?: boolean
        port: number
        backlog: number
    }
    export function tcp_listen(opts: TCPListenerOptions): TCPListener
    export function tcp_listen_close(l: TCPListener): void
    export function tcp_listen_cb(l: TCPListener, enable: boolean): void
    export function tcp_listen_err(l: TCPListener, enable: boolean): void
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
export interface ListenOptions extends Addr {
    /**
     * @default 5
     */
    backlog?: number
}
export class TcpError extends __duk.Error {
    constructor(message: string) {
        super(message);
        (this as any).name = "TcpError"
    }
}
/**
 * Conn is a generic stream-oriented network connection.
 */
export interface Conn {
}
export type OnAcceptCallback = (l: Listener, c: Conn) => void
export type onErrorCallback = (e: any) => void
export interface Listener {
    readonly addr: Addr
    close(): void
    onAccept?: OnAcceptCallback
    onError?: onErrorCallback
}
export class TCPListener implements Listener {
    private l_?: deps.TCPListener
    constructor(readonly addr: Addr, l: deps.TCPListener) {
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
    private onError_?: onErrorCallback
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
    set onError(f: onErrorCallback | undefined) {
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
    get onError(): onErrorCallback | undefined {
        return this.onError_
    }
    private _onAccept(conn: deps.TCPConn, remoteIP: string, remotePort: number, localIP: string, localPort: number) {
        if (remoteIP.startsWith('::ffff:')) {
            remoteIP = remoteIP.substring(7)
        }
        if (localIP.startsWith('::ffff:')) {
            localIP = localIP.substring(7)
        }
        const remoteAddr = new NetAddr('tcp', joinHostPort(remoteIP, remotePort))
        const localAddr = new NetAddr('tcp', joinHostPort(localIP, localPort))

        console.log("_onAccept", conn, localAddr, remoteAddr)
    }
    private _onError(e: any) {
        const cb = this.onError_
        if (cb) {
            cb(e)
        }
    }
}
function listenTCP(opts: ListenOptions, v6?: boolean): Listener {
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
            return new TCPListener(new NetAddr('tcp', address), l)
        } catch (e) {
            deps.tcp_listen_close(l)
            throw e
        }
    } catch (e) {
        if (e instanceof __duk.OsError) {
            throw e;
        } else if (e instanceof Error) {
            throw new TcpError(e.message);
        }
        throw e;
    }
}
export function listen(opts: ListenOptions): Listener {
    switch (opts.network) {
        case 'tcp':
            return listenTCP(opts)
        case 'tcp4':
            return listenTCP(opts, false)
        case 'tcp6':
            return listenTCP(opts, true)
        default:
            throw new Error(`unknow network: ${opts.network}`);
    }
}