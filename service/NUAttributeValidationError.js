import NUObject from './NUObject';

export default class NUAttributeValidationError extends NUObject {
    constructor(localName, remoteName, title, description) {
        super();
        this.defineProperties({ localName, remoteName, title, description });
    }
}
