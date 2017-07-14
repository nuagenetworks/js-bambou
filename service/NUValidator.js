import NUObject from './NUObject';
import NUException from './NUException';

/*
  This class models a validator
*/
export default class NUValidator extends NUObject {
    constructor(aName) {
        super();
        this.defineProperties({
            name: aName,
            validationError: null,
        });
    }

    validate() {
        throw new NUException('Not implemented');
    }
}
