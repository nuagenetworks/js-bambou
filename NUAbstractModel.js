import NUAttribute from './NUAttribute';
import NUObject from './NUObject';

const doValidate = (validator, entity, attrObj, formValues, operation) => {
    const validationError = validator.validate(entity, attrObj, formValues, operation);
    if (validationError) {
        entity.validationErrors.set(validator.name, validationError);
    }
}
/*
  This class models the base Entity
*/
export default class NUAbstractModel extends NUObject {

    constructor() {
        super();
        this._validationErrors = new Map();
        this._validators = new Map();
        this.registerAttributeValidators();
    }

    /*
        Populates individual properties of 'this' Entity object from the JSON object received
    */
    buildFromJSON(JSONObject) {
        const attributeDescriptors = this.constructor.attributeDescriptors;
        Object.entries(attributeDescriptors).forEach(([localName, attributeObj]) => {
            if (attributeObj.remoteName in JSONObject) {
                const value = JSONObject[attributeObj.remoteName];
                if (attributeObj.attributeType === NUAttribute.ATTR_TYPE_INTEGER || attributeObj.attributeType === NUAttribute.ATTR_TYPE_FLOAT) {
                    this[localName] = (!value && value !== 0) ? null : isNaN(value) ? value : Number(value);
                } else if (attributeObj.attributeType === NUAttribute.ATTR_TYPE_OBJECT && attributeObj.subType && attributeObj.subType !== NUAttribute.ATTR_TYPE_JSON && value) {
                    //if subType is ATTR_TYPE_JSON, NUEntity instance not applicable
                    const subtypeEntity = new attributeObj.subType();
                    this[localName] = subtypeEntity.buildFromJSON(value);
                } else if (attributeObj.attributeType === NUAttribute.ATTR_TYPE_LIST && attributeObj.subType && typeof attributeObj.subType !== 'string') {
                    this[localName] = value ? value.map(item => {
                        if (attributeObj.subType === NUAttribute.ATTR_TYPE_JSON) {
                            //list of JSON objects
                            return item;
                        } else {
                            const subtypeEntity = new attributeObj.subType();
                            return subtypeEntity.buildFromJSON(item);
                        }
                    }) : null;
                } else {
                    this[localName] = value;
                }
            }
        });
        return this;
    }

    /*
        Return JSON representation of 'this' object
    */
    buildJSON() {
        return JSON.stringify(this.toObject());
    }

    toString() {
        return this.buildJSON();
    }

    toObject(props = {}) {
        const {isInspect = false} = props;
        const attributeDescriptors = this.constructor.attributeDescriptors;
        const obj =  {};
        Object.entries(attributeDescriptors).forEach(([localName, attributeObj]) => {
            if (isInspect && attributeObj.isInternal) {
                return;
            }
            let value = this[localName];
            if (value) {
                if (attributeObj.attributeType === NUAttribute.ATTR_TYPE_OBJECT && attributeObj.subType) {
                    value = value.toObject();
                } else if (attributeObj.attributeType === NUAttribute.ATTR_TYPE_ENUM && typeof value === 'object') {
                    value = value.name;
                } else if (attributeObj.attributeType === NUAttribute.ATTR_TYPE_LIST && attributeObj.subType && typeof attributeObj.subType !== 'string') {
                    value = value.map(item => item.toObject())
                }
            }
            obj[attributeObj.remoteName] = value;
        });
        return obj;
    }

    /*
        Register each NUAttribute as validator
    */
    registerAttributeValidators() {
        Object.values(this.constructor.attributeDescriptors).forEach((attributeObj) => {
            this._validators.set(attributeObj.name, attributeObj);
        });
    }

    /*
        Register custom validator
    */
    registerValidator(...args) {
        if (args.length === 2 && args[1]) {
            //if the second argument is true, the new validator will be appended to the list of existing validators
            const currentValidator = this._validators.get(args[0].name) || [];
            if (Array.isArray(currentValidator)) {
                this._validators.set(args[0].name, [...currentValidator, args[0]]);
            } else {
                this._validators.set(args[0].name, [currentValidator, args[0]]);
            }
        } else {
            this._validators.set(args[0].name, args[0]);
        }
    }

    isValid(formValues, operation) {
        this.validationErrors.clear();
        this.checkErrors(formValues, operation);
        return (this.validationErrors.size === 0);
    }

    checkErrors(formValues, operation) {
        const entity = this;
        entity._validators.forEach((validator, attributeName) => {
            const attrObj = this.constructor.attributeDescriptors[attributeName];
            if (Array.isArray((validator))) {
                validator.forEach(validatorItem => {
                    doValidate(validatorItem, entity, attrObj, formValues, operation);
                })
            } else {
                doValidate(validator, entity, attrObj, formValues, operation);
            }
        });
    }

    getDefaults() {
        return Object.entries(this).reduce((acc, [key, value]) => {
            return (value && key !== '_validationErrors' && key !== '_validators')
                ? { ...acc, [key.substring(1)]: value } : acc;
        }, {});
    }
}
