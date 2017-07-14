
export default class NUException extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.stack = (new Error()).stack;
        this.name = this.constructor.name;
    }
}
