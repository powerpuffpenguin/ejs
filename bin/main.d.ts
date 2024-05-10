namespace ejs {
    export const os: string
    export const arch: string
    export const version: string
    export const args: Array<string>
    export interface ErrorOptions {
        cause?: unknown;
    }
    /**
     * extends globalThis.Error, with a cause attribute recording the cause of the error, usually a number error code
     */
    export class Error extends globalThis.Error {
        constructor(message?: string, options?: ErrorOptions)
        cause?: unknown
    }

    /**
     * os error returned by c api
     */
    export class OsError extends Error {
        constructor(readonly errno: number, message?: string)
        get errnoString(): string
    }
    /**
     * es5 compatibility function code generated by tsc. 
     */
    export function __values(...a: Array<any>): any
    /**
     * es5 compatibility function code generated by tsc. 
     */
    export function __extends(...a: Array<any>): any
    /**
     * es5 compatibility function code generated by tsc. 
     */
    export function __awaiter(...a: Array<any>): any
    /**
     * es5 compatibility function code generated by tsc. 
     */
    export function __generator(...a: Array<any>): any
    /**
     * es5 compatibility function code generated by tsc. 
     */
    export function __read(...a: Array<any>): any
    /**
     * es5 compatibility function code generated by tsc. 
     */
    export function __spreadArray(...a: Array<any>): any

    /**
     * exit process
     */
    export function exit(code: number): never
    /**
     * Compare bytes for equality
     */
    export function equal(a: string | ArrayBufferLike, b: string | ArrayBufferLike): boolean

    export namespace Os {
        export const ENOENT: number
        export const ETIMEDOUT: number
    }
}

declare module "ejs/net" {
    export const IPv4len = 4;
    export const IPv6len = 16;
    export class AddrError extends ejs.Error {
        constructor(readonly addr: string, message: string)
    }
    /**
     * An IPMask is a bitmask that can be used to manipulate IP addresses for IP addressing and routing.
     */
    export class IPMask {
        constructor(readonly mask: Uint8Array)
        /**
         * returns the IP mask (in 4-byte form) of the IPv4 mask a.b.c.d.
         */
        static v4(a: number, b: number, c: number, d: number): IPMask
        /**
         * returns an IPMask consisting of 'ones' 1 bits followed by 0s up to a total length of 'bits' bits.
         */
        static cidr(ones: number, bits: number): IPMask | undefined
        /**
         * mask bytes length
         */
        readonly length: number

        toString(): string

        /**
         * returns the number of leading ones and total bits in the mask.
         * @remarks
         * If the mask is not in the canonical form--ones followed by zeros--then returns [0,0]
         * @returns [ones:number, bits:number]
         */
        size(): [number, number]
    }
    /**
     * An IP is a single IP address. Accept either 4-byte (IPv4) or 16-byte (IPv6) Uint8Array as input.
     */
    export class IP {
        constructor(readonly ip: Uint8Array);
        /**
         * returns the IP address (in 16-byte form) of the IPv4 address a.b.c.d.
         */
        static v4(a: number, b: number, c: number, d: number): IP

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
         * parses s as an IP address, returning the result.
         * @remarks
         * The string s can be in IPv4 dotted decimal ("192.0.2.1"), IPv6 ("2001:db8::68"), or IPv4-mapped IPv6 ("::ffff:192.0.2.1") form.
         * If s is not a valid textual representation of an IP address, parse returns nil.
         */
        static parse(s: string): IP | undefined

        readonly length: number
        /**
         * returns the default IP mask for the IP address ip.
         * @remarks
         * Only IPv4 addresses have default masks; DefaultMask returns undefined if ip is not a valid IPv4 address.
         */
        defaultMask(): IPMask | undefined
        /**
         * reports whether ip and o are the same IP address. An IPv4 address and that same address in IPv6 form are considered to be equal.
         */
        equal(o: IP): boolean

        /**
         * reports whether ip is a global unicast address.
         * @remarks
         * The identification of global unicast addresses uses address type
         * identification as defined in RFC 1122, RFC 4632 and RFC 4291 with
         * the exception of IPv4 directed broadcast addresses.
         * It returns true even if ip is in IPv4 private address space or
         * local IPv6 unicast address space.
         */
        readonly isGlobalUnicast: boolean
        /**
         * reports whether ip is an interface-local multicast address.
         */
        readonly isInterfaceLocalMulticast: boolean
        /**
         * reports whether ip is a link-local multicast address.
         */
        readonly isLinkLocalMulticast: boolean
        /**
         * reports whether ip is a link-local unicast address.
         */
        readonly isLinkLocalUnicast: boolean
        /**
         * reports whether ip is a loopback address.
         */
        readonly isLoopback: boolean
        /**
         * reports whether ip is a multicast address.
         */
        readonly isMulticast: boolean
        /**
         * reports whether ip is a private address, according to RFC 1918 (IPv4 addresses) and RFC 4193 (IPv6 addresses).
         */
        readonly isPrivate: boolean
        /**
         * reports whether ip is an unspecified address, either the IPv4 address "0.0.0.0" or the IPv6 address "::".
         */
        readonly isUnspecified: boolean
        /**
         * If ip is an IPv4 or IPv6 address, returns true.
         */
        readonly isValid: boolean
        /**
         * If ip is an IPv4 address, returns true.
         */
        readonly isV4: boolean
        /**
         * If ip is an IPv6 address, returns true.
         */
        readonly isV6: boolean
        /**
         * converts the IPv4 address ip to a 4-byte representation.
         * @remarks
         * If ip is not an IPv4 address, To4 returns nil.
         */
        to4(): IP | undefined

        /**
         * converts the IP address ip to a 16-byte representation.
         * @remarks
         * If ip is not an IP address (it is the wrong length), to16 returns undefined.
         */
        to16(): IP | undefined

        /**
         * returns the string form of the IP address ip.
         * @remarks 
         * It returns one of 4 forms:
         *   - "<undefined>", if ip has length 0
         *   - dotted decimal ("192.0.2.1"), if ip is an IPv4 or IP4-mapped IPv6 address
         *   - IPv6 ("2001:db8::1"), if ip is a valid IPv6 address
         *   - the hexadecimal form of ip, without punctuation, if no other cases apply
         */
        toString(): string

        /**
         * returns the result of masking the IP address ip with mask.
         */
        mask(mask: IPMask): IP | undefined
    }
    /**
     * An IPNet represents an IP network.
     */
    export class IPNet {
        constructor(readonly ip: IP, readonly mask: IPMask)
        readonly network: string
        /**
         * reports whether the network includes ip.
         */
        contains(ip: IP): boolean
        /**
         * returns the CIDR notation of n like "192.0.2.0/24" or "2001:db8::/48" as defined in RFC 4632 and RFC 4291.
         * 
         * @remarks
         * If the mask is not in the canonical form, it returns the string which consists of an IP address, followed by a slash character and a mask expressed as hexadecimal form with no punctuation like "198.51.100.0/c000ff00".
         */
        toString(): string
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
    export function parseCIDR(s: string): [IP, IPNet] | undefined

    /**
     * combines host and port into a network address of the
     * form "host:port". If host contains a colon, as found in literal
     * IPv6 addresses, then JoinHostPort returns "[host]:port".
     */
    export function joinHostPort(host: string, port: string | number): string
    /**
     * @throws AddrError
     * 
     * SplitHostPort splits a network address of the form "host:port",
     * "host%zone:port", "[host]:port" or "[host%zone]:port" into host or
     * host%zone and port.
     * 
     *  A literal IPv6 address in hostport must be enclosed in square
     * brackets, as in "[::1]:80", "[::1%lo0]:80".
     * 
     */
    export function splitHostPort(hostport: string): [string, string]

    export class NetError extends ejs.Error {
        constructor(message: string);
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
    export interface Addr {
        /**
         * name of the network (for example, "tcp", "udp")
         */
        network: string
        /**
         * string form of address (for example, "192.0.2.1:25", "[2001:db8::1]:80")
         */
        address: string
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
         * @remarks
         * This function either writes all the data or none of the bytes.
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
        onMessage?: (this: Conn, data: Uint8Array) => void
    }
    export interface Listener {
        readonly addr: Addr
        readonly isClosed: boolean
        close(): void
        onAccept?: (this: Listener, c: Conn) => void
        onError?: (this: Listener, e: any) => void
    }
    export class TcpError extends NetError { }
    export interface Readable {
        readonly length: number
        read(dst: Uint8Array): number
        copy(dst: Uint8Array): number
        drain(n: number): void
    }
    export class TcpConn implements Conn {
        private constructor() { }
        readonly remoteAddr: Addr
        readonly localAddr: Addr

        /**
         * Returns whether the connection has been closed
         */
        readonly isClosed: boolean
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
        onError?: (this: TcpConn, e: any) => void
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
        onWritable?: (this: TcpConn) => void
        /**
         * Write buffer size
         */
        maxWriteBytes: number
        /**
         * Callback when a message is received. If set to undefined, it will stop receiving data.
         * @remarks
         * The data passed in the callback is only valid in the callback function. If you want to continue to access it after the callback ends, you should create a copy of it in the callback.
         */
        onMessage?: (this: TcpConn, data: Uint8Array) => void

        /**
         * Read buffer
         * @remarks
         * If not set, a buffer of size 32k will be automatically created when reading.
         */
        buffer?: Uint8Array
        /**
         * Callback when there is data to read
         */
        onReadable?: (this: TcpConn, r: Readable) => void
    }
    export class TcpListener implements Listener {
        private constructor() { }
        readonly addr: Addr
        close(): void
        onAccept?: (this: TcpListener, c: TcpConn) => void
        onError?: (this: TcpListener, e: any) => void
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
    /**
     * Create a listening service
     */
    export function listen(opts: ListenOptions): Listener
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
         * The number of milliseconds for connection timeout. If it is less than or equal to 0, it will never timeout.
         * @remarks
         * Even if it is set to 0, the operating system will also return an error when it cannot connect to the socket for a period of time.
         */
        timeout?: number
    }
    /**
     * Dial a listener to create a connection for bidirectional communication
     */
    export function dial(opts: DialOptions, cb: (conn?: Conn, e?: any) => void): void

    export type AbortListener = (this: AbortSignal, reason: any) => any
    /** 
     * A signal object that allows you to communicate with a request and abort it if required via an AbortController object.
     */
    export class AbortSignal {
        private aborted_ = false
        /** 
         * Returns true if this AbortSignal's AbortController has signaled to abort,
         * and false otherwise. 
         */
        readonly aborted(): boolean
        readonly reason(): any
        addEventListener(listener: AbortListener): void
        removeEventListener(listener: AbortListener): void
        /** Throws this AbortSignal's abort reason, if its AbortController has
       * signaled to abort; otherwise, does nothing. */
        throwIfAborted(): void
    }
    /**
     * A controller object that allows you to abort one or more requests as and when desired.
     */
    export class AbortController {
        /** 
         * Returns the AbortSignal object associated with this object. 
         */
        readonly signal: AbortSignal
        /** 
         * Invoking this method will set this object's AbortSignal's aborted flag and
         * signal to any observers that the associated activity is to be aborted. 
         */
        abort(reason?: any): void
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
    export interface ResolveOptions {
        /**
         * Name to be queried
         */
        name: string
        /**
         * If true, query ipv6, else query ipv4
         */
        v6?: boolean
    }
    /**
     * Used to resolve domain names supporting A or AAAA
     */
    export class Resolver {
        static setDefault(v?: Resolver)
        static getDefault(): Resolver
        static hasDefault(): boolean

        constructor(opts: deps.ResolverOptions = { system: true })
        readonly isClosed: boolean
        close(): void
        /**
         * Query the A/AAAA record of a domain name
         * @param opts Query options
         * @param cb Query result callback
         */
        resolve(opts: ResolveOptions, cb: (ip?: Array<string>, e?: any) => void): void
    }
}