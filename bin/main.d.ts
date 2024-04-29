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

    export namespace Os {
        export const ENOENT: number
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
}