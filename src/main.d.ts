namespace globalThis {
    function setImmediate(cb: (...arguments: Array<any>) => void, ...arguments: Array<any>): number
    function clearImmediate(cb: (...arguments: Array<any>) => void, ...arguments: Array<any>): number
}
/**
 * Some tools for synchronization in asynchronous code
 */
declare module "ejs/sync" {
    /**
     * Context used for the coroutine to give up the CPU
     */
    export interface YieldContext {
        /**
         * After calling function f, release the cpu so that other coroutines can run
         * @remarks
         * Usually f should be an asynchronous function, you can use coroutines to wait for the asynchronous function to complete
         */
        yield<T>(f: (notify: ResumeContext<T>) => void): T
    }

    /**
     * The context used to wake up the coroutine
     * @remarks
     * You can only call the member function once to wake up the waiting coroutine. Multiple calls will throw an exception.
     */
    export interface ResumeContext<T> {
        /**
         * Wake up the coroutine and return the value v for it
         */
        value(v: T): void
        /**
         * Wake up the coroutine and throw an exception.  
         * The exception can be caught by try catch in the coroutine
         */
        error(e?: any): void
        /**
         * Wake up the coroutine and call the function resume.  
         * The return value of resume is used as the coroutine return value.  
         * The exception thrown by resume can be caught by the coroutine.
         */
        next(resume: () => T): void
    }

    export class Coroutine {
        constructor(f: (co: YieldContext) => void)
        readonly state: 'none' | 'run' | 'yield' | 'finish'
        /**
         * run coroutine
         */
        run(): void
        /**
         * Callback after the coroutine finish
         */
        onFinish?: () => void
    }
    /**
     * new Coroutine(f).run()
     */
    export function go(f: (co: YieldContext) => void): void

    export function isYieldContext(co: any): co is YieldContext
    export type CallbackVoid = (e?: any) => void
    export type CallbackReturn<T> = (value?: T, e?: any) => void
    export type InterfaceVoid<Options> = (opts: Options, cb: CallbackVoid) => void
    export type InterfaceReturn<Options, Result> = (opts: Options, cb: CallbackReturn<Result>) => void
    export type CallbackMap<Input, Output> = (v: Input) => Output
    export interface Args<Options, CB> {
        co?: YieldContext
        cb?: CB
        opts?: Options
    }
    /**
     * Used to parse function parameters with the following signatures
     * (co: YieldContext, opts: Options) => any
     * (opts: Options) => Promise<any>
     * (opts: Options, cb: (...) => void) => Promise<any>
     * @param tag The function name to display when parsing fails
     */
    export function parseArgs<Options, CB>(tag: string, a: any, b: any): Args<Options, CB>
    /**
     * Used to parse function parameters with the following signatures
     * (co: YieldContext, opts?: Options) => any
     * (opts?: Options) => Promise<any>
     * (opts: Options, cb: (...) => void) => Promise<any>
     * (cb: (...) => void) => Promise<any>
     * @param tag The function name to display when parsing fails
     */
    export function parseOptionalArgs<Options, CB>(tag: string, a: any, b: any): Args<Options, CB>

    /**
     * Using a coroutine to call an asynchronous interface with no return value
     * 
     * @param co Coroutine context
     * @param f Asynchronous interface to be called
     * @param opts Interface parameters
     * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
     */
    export function coVoid<Options>(co: YieldContext,
        f: InterfaceVoid<Options>, opts: Options,
        ce?: CallbackMap<any, any>,
    ): void
    /**
     * Calling asynchronous interface
     * 
     * @param cb Callback notification
     * @param f Asynchronous interface to be called
     * @param opts Interface parameters
     * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
     */
    export function cbVoid<Options>(cb: CallbackVoid,
        f: InterfaceVoid<Options>, opts: Options,
        ce?: CallbackMap<any, any>,
    ): void
    /**
     * Convert asynchronous functions to Promise calling mode.  
     * Abbreviation for: new Promise((resolve,reject)=> cbVoid(...))
     * 
     * @param f Asynchronous interface to be called
     * @param opts Interface parameters
     * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
     */
    export function asyncVoid<Options>(f: InterfaceVoid<Options>, opts: Options,
        ce?: CallbackMap<any, any>,
    ): Promise<void>
    /**
     * Automatically adapt the asynchronous function to call based on Args
     */
    export function callVoid<Options>(
        f: InterfaceVoid<Options>,
        args: Args<Options, CallbackVoid>,
        ce?: CallbackMap<any, any>,
    ): void | Promise<void>

    /**
     * Use coroutines to call asynchronous interfaces with return values
     * @param co Coroutine context
     * @param f Asynchronous interface to be called
     * @param opts Interface parameters
     * @param cv When the asynchronous function succeeds, this function is called to wrap the return value
     * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
     */
    export function coReturn<Options, Result>(co: YieldContext,
        f: InterfaceReturn<Options, any>, opts: Options,
        cv?: CallbackMap<any, Result>, ce?: CallbackMap<any, any>,
    ): Result
    /**
     * Calling asynchronous interface
     * 
     * @param cb Callback notification
     * @param f Asynchronous interface to be called
     * @param opts Interface parameters
     * @param cv When the asynchronous function succeeds, this function is called to wrap the return value
     * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
     */
    export function cbReturn<Options, Result>(cb: CallbackReturn<any>,
        f: InterfaceReturn<Options, any>, opts: Options,
        cv?: CallbackMap<any, Result>, ce?: CallbackMap<any, any>,
    ): void
    /**
     * Convert asynchronous functions to Promise calling mode.  
     * Abbreviation for: new Promise((resolve,reject)=> coReturn(...))
     * 
     * @param f Asynchronous interface to be called
     * @param opts Interface parameters
     * @param cv When the asynchronous function succeeds, this function is called to wrap the return value
     * @param ce If an error occurs, an error callback is used to wrap the error information for the caller
     */
    export function asyncReturn<Options, Result>(f: InterfaceReturn<Options, any>, opts: Options,
        cv?: CallbackMap<any, Result>, ce?: CallbackMap<any, any>,
    ): Promise<Result>
    /**
     * Automatically adapt the asynchronous function to call based on Args
     */
    export function callReturn<Options, Result>(
        f: InterfaceReturn<Options, any>,
        args: Args<Options, CallbackVoid>,
        cv?: CallbackMap<any, Result>, ce?: CallbackMap<any, any>,
    ): Result | Promise<Result> | void
}
declare module "ejs/net" {
    import { YieldContext } from "ejs/sync"
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
        readonly network: string
        /**
         * string form of address (for example, "192.0.2.1:25", "[2001:db8::1]:80")
         */
        readonly address: string
    }

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

    export class ResolverError extends NetError { }
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
        resolve(opts: ResolveOptions, cb: (result?: ResolveResult, e?: any) => void): void
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
        onAccept?: (this: Listener, c: BaseTcpConn) => void
        onError?: (this: Listener, e: any) => void
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
    export class BaseTcpConn implements Conn {
        private constructor() { }
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
        onError?: (this: BaseTcpConn, e: any) => void
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
        onWritable?: (this: BaseTcpConn) => void
        /**
         * Write buffer size
         */
        maxWriteBytes: number
        /**
         * Callback when a message is received. If set to undefined, it will stop receiving data.
         * @remarks
         * The data passed in the callback is only valid in the callback function. If you want to continue to access it after the callback ends, you should create a copy of it in the callback.
         */
        onMessage?: (this: BaseTcpConn, data: Uint8Array) => void

        /**
         * Read buffer
         * @remarks
         * If not set, a buffer of size 32k will be automatically created when reading.
         */
        buffer?: Uint8Array
        /**
         * Callback when there is data to read
         */
        onReadable?: (this: BaseTcpConn, r: Readable) => void
    }
    export class BaseTcpListener implements Listener {
        private constructor() { }
        readonly addr: Addr
        close(): void
        readonly isClosed: boolean
        onAccept?: (this: BaseTcpListener, c: TcpConn) => void
        onError?: (this: BaseTcpListener, e: any) => void
        native(): any
        tls?: any
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
    }
    /**
     * Create a listening service
     */
    export function listen(opts: ListenOptions): Listener

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
    }
    /**
     * Dial a listener to create a connection for bidirectional communication
     */
    export function dial(opts: DialOptions, cb: (conn?: BaseTcpConn, e?: any) => void): void
}
/**
 * URL processing module ported from golang standard library
 */
declare module "ejs/net/url" {
    export class EscapeError extends Error {
        constructor(message: string, opts?: any)
    }
    export class InvalidHostError extends Error {
        constructor(message: string, opts?: any)
    }
    /**
     * queryUnescape does the inverse transformation of queryEscape,
     * converting each 3-byte encoded substring of the form "%AB" into the
     * hex-decoded byte 0xAB.
     * It returns an error if any % is not followed by two hexadecimal
     * digits.
     * @throws EscapeError OsErrror Errror
     */
    export function queryUnescape(s: string): string
    /**
     * pathUnescape does the inverse transformation of pathEscape,
     * converting each 3-byte encoded substring of the form "%AB" into the
     * hex-decoded byte 0xAB. It returns an error if any % is not followed
     * by two hexadecimal digits.
     * 
     * pathUnescape is identical to queryUnescape except that it does not
     * unescape '+' to ' ' (space).
     * @throws EscapeError OsErrror Errror
     */
    export function pathUnescape(s: string): string

    /**
     * escapes the string so it can be safely placed
     * inside a URL query.
     */
    export function queryEscape(s: string): string
    /**
     * escapes the string so it can be safely placed inside a URL path segment,
     * replacing special characters (including /) with %XX sequences as needed.
     */
    export function pathEscape(s: string): string

    /**
     * The Userinfo class is an immutable encapsulation of username and
     * password details for a URL. An existing Userinfo value is guaranteed
     * to have a username set (potentially empty, as allowed by RFC 2396),
     * and optionally a password.
     */
    export class Userinfo {
        constructor(readonly username: string, readonly password?: string | null)
        toString(): string
    }
    /**
     * Values maps a string key to a list of values.
     * It is typically used for query parameters and form values.
     * Unlike in the http.Header map, the keys in a Values map
     * are case-sensitive.
     */
    export class Values {
        /**
         * Parses the URL-encoded query string and returns
         * the values specified for each key.
         * 
         * Query is expected to be a list of key=value settings separated by ampersands.
         * A setting without an equals sign is interpreted as a key set to an empty value.
         * Settings containing a non-URL-encoded semicolon are considered invalid.
         */
        static parse(query: string): Values

        readonly values: Record<string, Array<string> | undefined>
        constructor(values?: Record<string, Array<string> | undefined>)
        /**
         * Gets the first value associated with the given key.
         * If there are no values associated with the key, Get returns
         * undefined. To access multiple values, use the record
         * directly.
         */
        get(key: string): string | undefined
        /**
         * Sets the key to value. It replaces any existing values
         */
        set(key: string, value: any): void
        /**
         * Adds the value to key. It appends to any existing
         * values associated with key.
         */
        add(key: string, value: any): void
        /**
         * Deletes the values associated with key.
         * @param logic If true, just set the property to undefined; if false, delete is called.
         */
        remove(key: string, logic?: boolean): void
        /**
         * checks whether a given key is set
         */
        has(key: string): boolean
        /**
         * encodes the values into “URL encoded” form ("bar=baz&foo=quux") sorted by key.
         */
        encode(): string
    }

    /**
     * A URL represents a parsed URL (technically, a URI reference).
     * 
     * The general form represented is:
     * 
     * [scheme:][//[userinfo@]host][/]path[?query][#fragment]
     * 
     * URLs that do not start with a slash after the scheme are interpreted as:
     * 
     * scheme:opaque[?query][#fragment]
     * 
     * Note that the Path field is stored in decoded form: /%47%6f%2f becomes /Go/.
     * A consequence is that it is impossible to tell which slashes in the Path were
     * slashes in the raw URL and which were %2f. This distinction is rarely important,
     * but when it is, the code should use the escapedPath method, which preserves
     * the original encoding of path.
     * 
     * The rawPath field is an optional field which is only set when the default
     * encoding of path is different from the escaped path. See the escapedPath method
     * for more details.
     * 
     * URL's String method uses the escapedPath method to obtain the path.
     */
    export class URL {

        scheme: string
        /**
         * encoded opaque data
         */
        opaque: string
        /**
         * username and password information
         */
        user?: Userinfo
        /**
         * host or host:port
         */
        host: string
        /**
         * path (relative paths may omit leading slash)
         */
        path: string
        /**
         * encoded path hint (see escapedPath method)
         */
        rawPath: string
        /**
         * do not emit empty host (authority)
         */
        omitHost = false
        /**
         * append a query ('?') even if rawQuery is empty
         */
        forceQuery = false
        /**
         * encoded query values, without '?'
         */
        rawQuery: string
        /**
         * fragment for references, without '#'
         */
        fragment: string
        /**
         *  encoded fragment hint (see EscapedFragment method)
         */
        rawFragment: string
    }
}