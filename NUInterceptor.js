export default class NUInterceptor {
    constructor() {
        this._successCallbacks = [];
        this._errorCallbacks = [];
    }

    onSuccess(cb) {
        this._successCallbacks.push(cb);
    }

    onError(cb) {
        this._errorCallbacks.push(cb);
    }

    success(data) {
        this._successCallbacks.forEach(cb => cb(data));
    }

    fail(data) {
        this._errorCallbacks.forEach(cb => cb(data));
    }
}
