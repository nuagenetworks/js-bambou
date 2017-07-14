export default class NUObject {
    defineProperties(obj) {
        Object.keys(obj).forEach((key) => {
            const _name = `_${key}`;
            const value = obj[key];

            this[_name] = value;

            Object.defineProperty(this, key, {
                get: () => this[_name],
                set: (val) => { this[_name] = val; },
                configurable: true,
            });
        });
    }

}
