declare namespace deps {
    type SubarrayFunction = (b: Uint8Array, begin?: number, end?: number) => Uint8Array

    function base(path: string | Uint8Array, subarray: SubarrayFunction): string | Uint8Array
    function clean(path: string | Uint8Array, subarray: SubarrayFunction): string | Uint8Array
    function dir(path: string | Uint8Array, subarray: SubarrayFunction): string | Uint8Array
    function ext(path: string | Uint8Array, subarray: SubarrayFunction): string | Uint8Array
    function isAbs(path: string | Uint8Array): boolean
    function join(elem: Array<string | Uint8Array>): string
    function join(elem: Array<string | Uint8Array>, toBuffer: boolean): Uint8Array
    function split(path: string | Uint8Array, subarray: SubarrayFunction): [/*dir*/ string, /*file*/ string] | [/*dir*/ Uint8Array, /*file*/ Uint8Array]
    function match(pattern: string | Uint8Array, name: string | Uint8Array): number
}
/**
 * Indicates a pattern was malformed.
 */
export class BadPatternError extends Error {
    constructor(options?: ErrorOptions) {
        super(undefined, options)
        // restore prototype chain   
        const proto = new.target.prototype
        if (Object.setPrototypeOf) {
            Object.setPrototypeOf(this, proto)
        }
        else {
            (this as any).__proto__ = proto
        }
        this.name = "BadPatternError"
        this.message = "syntax error in pattern"
    }
}
function subarray(b: Uint8Array, begin?: number, end?: number): Uint8Array {
    return b.subarray(begin, end)
}
/**
 * Returns the last element of path. Trailing slashes are removed before extracting the last element. 
 * If the path is empty, base returns ".". If the path consists entirely of slashes, base returns "/".
 */
export function base(path: string | Uint8Array): string | Uint8Array {
    return deps.base(path, subarray)
}
/**
 * Returns the shortest path name equivalent to path
 * by purely lexical processing. It applies the following rules
 * iteratively until no further processing can be done:
 * 
 * 1. Replace multiple slashes with a single slash.
 * 2. Eliminate each . path name element (the current directory).
 * 3. Eliminate each inner .. path name element (the parent directory)
 *     along with the non-.. element that precedes it.
 * 4. Eliminate .. elements that begin a rooted path:
 *     that is, replace "/.." by "/" at the beginning of a path.
 * 
 * The returned path ends in a slash only if it is the root "/".
 * 
 * If the result of this process is an empty string, clean
 * returns the string ".".
 * 
 * See also Rob Pike, “Lexical File Names in Plan 9 or Getting Dot-Dot Right,”
 * https://9p.io/sys/doc/lexnames.html
 */
export function clean(path: string | Uint8Array): string | Uint8Array {
    return deps.clean(path, subarray)
}
/**
 * Returns all but the last element of path, typically the path's directory.
 * After dropping the final element using Split, the path is Cleaned and trailing
 * slashes are removed.
 * If the path is empty, dir returns ".".
 * If the path consists entirely of slashes followed by non-slash bytes, dir
 * returns a single slash. In any other case, the returned path does not end in a slash.
 */
export function dir(path: string | Uint8Array): string | Uint8Array {
    return deps.dir(path, subarray)
}
/**
 * Returns the file name extension used by path.
 * The extension is the suffix beginning at the final dot
 * in the final slash-separated element of path;
 * it is empty if there is no dot.
 */
export function ext(path: string | Uint8Array): string | Uint8Array {
    return deps.ext(path, subarray)
}
/**
 * Reports whether the path is absolute.
 */
export function isAbs(path: string | Uint8Array): boolean {
    return deps.isAbs(path)
}
/**
 *  Joins any number of path elements into a single path, separating them with slashes. 
 * Empty elements are ignored. The result is Cleaned. However, 
 * if the argument list is empty or all its elements are empty, 
 * join returns an empty string.
 */
export function join(...elem: Array<string | Uint8Array>): string {
    return deps.join(elem)
}
/**
 *  Joins any number of path elements into a single path, separating them with slashes. 
 * Empty elements are ignored. The result is Cleaned. However, 
 * if the argument list is empty or all its elements are empty, 
 * joinBuffer returns an empty string.
 */
export function joinBuffer(...elem: Array<string | Uint8Array>): Uint8Array {
    return deps.join(elem, true)
}

/**
 * Splits path immediately following the final slash, separating it into a directory and file name component. 
 * If there is no slash in path, split returns an empty dir and file set to path. 
 * The returned values have the property that path = dir+file.
 */
export function split(path: string | Uint8Array): [/*dir*/ string, /*file*/ string] | [/*dir*/ Uint8Array, /*file*/ Uint8Array] {
    return deps.split(path, subarray)
}
/**
 *  Match reports whether name matches the shell pattern.
 * The pattern syntax is:
 *
 *	pattern:
 *		{ term }
 *	term:
 *		'*'         matches any sequence of non-/ characters
 *		'?'         matches any single non-/ character
 *		'[' [ '^' ] { character-range } ']'
 *		            character class (must be non-empty)
 *		c           matches character c (c != '*', '?', '\\', '[')
 *		'\\' c      matches character c
 *
 *	character-range:
 *		c           matches character c (c != '\\', '-', ']')
 *		'\\' c      matches character c
 *		lo '-' hi   matches character c for lo <= c <= hi
 *
 * Match requires pattern to match all of name, not just a substring.
 * The only possible returned error is ErrBadPattern, when pattern
 * is malformed.
 */
export function match(pattern: string | Uint8Array, name: string | Uint8Array): boolean {
    switch (deps.match(pattern, name)) {
        case 0:
            return true
        case 1:
            return false
    }
    throw new BadPatternError()
}