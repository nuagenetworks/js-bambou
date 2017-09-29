import NUAttribute from './NUAttribute';
import NUObject from './NUObject';
import NUException from './NUException';

/*
  This class models the base Entity
*/
export default class NUEntity extends NUObject {
    static attributeDescriptors = {
        creationDate: new NUAttribute({
            localName: 'creationDate',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isReadOnly: true,
            isEditable: false }),
        entityScope: new NUAttribute({
            localName: 'entityScope',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isEditable: false }),
        externalID: new NUAttribute({
            localName: 'externalID',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isEditable: false }),
        ID: new NUAttribute({
            localName: 'ID',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isIdentifier: true }),
        lastUpdatedBy: new NUAttribute({
            localName: 'lastUpdatedBy',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isEditable: false }),
        lastUpdatedDate: new NUAttribute({
            localName: 'lastUpdatedDate',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isReadOnly: true,
            isEditable: false }),
        owner: new NUAttribute({
            localName: 'owner',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isEditable: false }),
        parentID: new NUAttribute({
            localName: 'parentID',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isEditable: false }),
        parentType: new NUAttribute({
            localName: 'parentType',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isEditable: false }),
    }

    static getSearchableAttributes() {
        if (!this.searchableAttributes) {
            this.searchableAttributes = Object
                .entries(this.attributeDescriptors)
                .reduce((acc, attr) => {
                    const [key, value] = attr;
                    if (value.canSearch) return { ...acc, [key]: value };
                    return acc;
                }, {});
        }
        return this.searchableAttributes;
    }

    constructor() {
        super();
        this.defineProperties({
            creationDate: null,
            entityScope: null,
            externalID: null,
            ID: null,
            lastUpdatedBy: null,
            lastUpdatedDate: null,
            owner: null,
            parentID: null,
            parentObject: null,
            parentType: null,
        });
        this._validationErrors = new Map();
        this._validators = new Map();
        this.registerAttributeValidators();
    }

    /*
        To be implemented by specific entity classes
    */
    get RESTName() {
        throw new NUException('Not implemented');
    }

    get validationErrors() {
        return this._validationErrors;
    }

    /*
        Populates individual properties of 'this' Entity object from the JSON object received
    */
    buildFromJSON(JSONObject) {
        const attributeDescriptors = this.constructor.attributeDescriptors;
        Object.entries(attributeDescriptors).forEach(([localName, attributeObj]) => {
            if (attributeObj.remoteName in JSONObject) {
                if (attributeObj.attributeType == NUAttribute.ATTR_TYPE_INTEGER || attributeObj.attributeType == NUAttribute.ATTR_TYPE_FLOAT) {
                    this[localName] = Number(JSONObject[attributeObj.remoteName]);
                }
                else
                {
                    this[localName] = JSONObject[attributeObj.remoteName];
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

    toObject() {
        const obj = {};
        const attributeDescriptors = this.constructor.attributeDescriptors;
        Object.entries(attributeDescriptors).forEach(([localName, attributeObj]) => {
            const value = this[localName];
            obj[attributeObj.remoteName] =
            (value && attributeObj.attributeType === NUAttribute.ATTR_TYPE_ENUM && typeof value === 'object') ?
                value.name : value;
        });
        return obj;
    }

    get resourceName() {
        return this.pluralize(this.RESTName);
    }

    pluralize(aName) {
        let name = aName;
        switch (name.slice(-1)) {
            case 's':
                break;

            case 'y': {
                const endsWith = name.slice(-2);
                if (endsWith === 'ry' || endsWith === 'cy' || endsWith === 'ty' || endsWith === 'ny') {
                    name = name.substr(0, name.length - 1);
                    name += 'ies';
                } else {
                    name += 's';
                }
                break;
            }

            default:
                name += 's';
        }

        return name;
    }

    isValid() {
        this.validationErrors.clear();
        this.checkErrors();
        return (this.validationErrors.size === 0);
    }

    checkErrors() {
        const entity = this;
        entity._validators.forEach((args, validator) => {
            const validationError = validator.validate.apply(entity, args);
            if (validationError) {
                entity.validationErrors.set(validator.name, validationError);
            }
        });
    }

    /*
        Register each NUAttribute as validator
    */
    registerAttributeValidators() {
        Object.values(this.constructor.attributeDescriptors).forEach((attributeObj) => {
            this._validators.set(attributeObj, [attributeObj]);
        });
    }

    /*
        Register custom validator
    */
    registerValidator(...args) {
        this._validators.set(args[0], [].splice.call(args, 1));
    }
}
