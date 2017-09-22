import NUObject from './NUObject';
import NUAttributeValidationError from './NUAttributeValidationError';
import NUException from './NUException';


/*
  This class models an attribute object
*/
export default class NUAttribute extends NUObject {
    static ATTR_TYPE_BOOLEAN = 'boolean';
    static ATTR_TYPE_ENUM = 'enum';
    static ATTR_TYPE_NUMBER = 'number';
    static ATTR_TYPE_STRING = 'string';

    constructor(obj) {
        super();
        if (!obj.localName || !obj.attributeType) {
            throw new NUException(`Invalid localName and/or attributeType localName: ${obj.localName}, attributeType: ${obj.attributeType}`);
        }

        const remName = (!obj.remoteName) ? obj.localName : obj.remoteName;

        this.defineProperties({
            attributeType: obj.attributeType,
            canOrder: !!obj.canOrder,
            canSearch: !!obj.canSearch,
            choices: obj.choices || null,
            displayName: (!obj.displayName) ? obj.localName : obj.displayName,
            hasChoices: !(obj.choices === null),
            isEditable: (!obj.isEditable) ? true : obj.isEditable,
            isEmail: !!obj.isEmail,
            isIdentifier: !!obj.isIdentifier,
            isLogin: !!obj.isLogin,
            isPassword: !!obj.isPassword,
            isReadOnly: !!obj.isReadOnly,
            isRequired: !!obj.isRequired,
            isUnique: !!obj.isUnique,
            name: obj.localName,
            maxLength: obj.maxLength || -1,
            minLength: obj.minLength || -1,
            remoteName: remName,
            userlabel: obj.userlabel,
        });
    }

    /*
        Invoked from NUEntity.
        'this' would correspond to the NUEntity object being validated.
        NUAttribute object on which the validation needs to be executed is passed as args[0].
    */
    validate(...args) {
        const attrObj = args[0];
        const attrValue = this[attrObj.name];
        if (attrObj.isRequired && !attrValue) {
            return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                'Invalid input', 'This value is mandatory');
        }

        if (attrValue) {
            if (
                attrObj.attributeType !== NUAttribute.ATTR_TYPE_ENUM &&
                typeof attrValue !== attrObj.attributeType
            ) {
                return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                    'Invalid data type',
                    `Data type should be ${attrObj.attributeType}, but is ${typeof attrValue}`);
            }
            if (attrObj.attributeType === NUAttribute.ATTR_TYPE_STRING) {
                return attrObj.validateStringValue(attrValue, attrObj);
            } else if (attrObj.attributeType === NUAttribute.ATTR_TYPE_ENUM) {
                return attrObj.validateEnumValue(attrValue, attrObj);
            }
        }
        return null;
    }

    validateStringValue(attrValue, attrObj) {
        if (attrObj.minLength > -1 && attrValue.length < attrObj.minLength) {
            return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                'Invalid length',
                `Minimum length should be ${attrObj.minLength}, but is ${attrValue.length}`);
        }

        if (attrObj.maxLength > -1 && attrValue.length > attrObj.maxLength) {
            return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                'Invalid length',
                `Maximum length should be ${attrObj.maxLength}, but is ${attrValue.length}`);
        }
        return null;
    }

    validateEnumValue(attrValue, attrObj) {
        if (attrObj.choices && attrObj.choices.indexOf(attrValue) === -1) {
            return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                'Invalid input',
                `Allowed values are ${attrObj.choices}, but value provided is ${attrValue}`);
        }
        return null;
    }
}
