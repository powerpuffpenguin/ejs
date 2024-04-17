export class Err extends Error {
    constructor(message?: string, options?: ErrorOptions) {
        super(message, options)
        this.cause = options?.cause
    }
    get message() {
        return "abc"
    }
    toString() {
        return JSON.stringify({
            message: this.message,
            cause: this.cause,
        })
    }
}