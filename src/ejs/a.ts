export class Err extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options)
        this.cause = options?.cause
    }
    get x() {
        return this.cause
    }
    toString() {
        return JSON.stringify({
            message: this.message,
            cause: this.cause,
        })
    }
}
class MyErr extends Err {
    /**
     *
     */
    constructor(readonly errno: any, message?: string) {
        super(message, { cause: errno });

    }
    get xx() { return '1' }
}
