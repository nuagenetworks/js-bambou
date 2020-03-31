import NUObject from './NUObject';
import NUAttributeValidationError from './NUAttributeValidationError';
import NUException from './NUException';
import { getLogger } from "./Logger";

const dataTypeMismatchError = (attrObj, attrValue, validateSubType) => (
    new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
            'Invalid data type',
            `Data type should be ${validateSubType ? attrObj.subType : attrObj.attributeType}`)
);

/*
  This class models an attribute object
*/
export default class NUAttribute extends NUObject {
    static ATTR_TYPE_BOOLEAN = 'boolean';
    static ATTR_TYPE_ENUM = 'enum';
    static ATTR_TYPE_FLOAT = 'float';
    static ATTR_TYPE_INTEGER = 'integer';
    static ATTR_TYPE_LIST = 'list';
    static ATTR_TYPE_LONG = 'long';
    static ATTR_TYPE_STRING = 'string';
    static ATTR_TYPE_OBJECT = 'object';
    static ATTR_TYPE_TIMESTAMP = 'long';

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
            description: obj.description,
            displayName: (!obj.displayName) ? obj.localName : obj.displayName,
            hasChoices: !(obj.choices === null),
            isEmail: !!obj.isEmail,
            isIdentifier: !!obj.isIdentifier,
            isLogin: !!obj.isLogin,
            isPassword: !!obj.isPassword,
            isCreateOnly: !!obj.isCreateOnly,
            isReadOnly: !!obj.isReadOnly,
            isEditable: !(!!obj.isCreateOnly || !!obj.isReadOnly),
            isRequired: !!obj.isRequired,
            isUnique: !!obj.isUnique,
            name: obj.localName,
            maxLength: obj.maxLength || -1,
            minLength: obj.minLength || -1,
            remoteName: remName,
            subType: obj.subType,
            userlabel: obj.userlabel,
            isInternal: obj.isInternal,
            minValue: obj.minValue,
            maxValue: obj.maxValue
        });
    }
    

    isValueSet(attrValue) {
        return ((this.attributeType === NUAttribute.ATTR_TYPE_STRING && attrValue) ||
            (this.attributeType !== NUAttribute.ATTR_TYPE_STRING && attrValue !== undefined && attrValue !== null));
    }

    /*
        Invoked from NUEntity.
        'this' would correspond to the NUEntity object being validated.
        NUAttribute object on which the validation needs to be executed is passed as args[0].
    */
    validate(entity, attrObj, formValues) {
        
        if (attrObj) {
            const attrValue =  entity && entity[attrObj.name];
            //if STRING use !attrValue to check if value provided. For all other attribute types use !undefined and !null
            if (attrObj.isRequired && !attrObj.isValueSet(attrValue)) {
                return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                    'Invalid input', 'This value is mandatory');
            }

            if (attrValue !== undefined && attrValue !== null) {
                //if value provided
                switch (attrObj.attributeType) {
                    case NUAttribute.ATTR_TYPE_STRING:
                        return attrObj.validateStringValue(attrValue, attrObj);

                    case NUAttribute.ATTR_TYPE_ENUM:
                        return attrObj.validateEnumValue(attrValue, attrObj);

                    case NUAttribute.ATTR_TYPE_LIST:
                        return attrObj.validateListValues(attrValue, attrObj);

                    case NUAttribute.ATTR_TYPE_OBJECT:
                        return attrObj.validateObjectValue(attrValue, attrObj);

                    case NUAttribute.ATTR_TYPE_INTEGER:
                    case NUAttribute.ATTR_TYPE_FLOAT:
                    case NUAttribute.ATTR_TYPE_LONG:
                    case NUAttribute.ATTR_TYPE_TIMESTAMP:
                        return attrObj.validateNumberValue(attrValue, attrObj);

                    default:
                }
            }
        }
        return null;
    }

    validateListValues(listValues, attrObj) {
        if (typeof listValues !== 'object') {
            return dataTypeMismatchError(attrObj, listValues);
        }
        for (const listElementValue of listValues) {
            let err = false;
            if (typeof listElementValue === 'object') {
                //validate type list of embedded objects
                if (attrObj.subType && attrObj.subType.getClassName) {
                    if (listElementValue.getClassName && listElementValue.getClassName() !== attrObj.subType.getClassName()) {
                        return dataTypeMismatchError(attrObj, listElementValue, true)
                    }
                } else {
                    getLogger().warn(`Invalid subType for attribute: ${attrObj.name}, subType: ${attrObj.subType}`);
                }
            }

            switch (attrObj.subType) {
                case NUAttribute.ATTR_TYPE_STRING:
                    err = attrObj.validateStringValue(listElementValue, attrObj, true);
                    if (err) return err;
                    break;

                case NUAttribute.ATTR_TYPE_ENUM:
                    err = attrObj.validateEnumValue(listElementValue, attrObj, true);
                    if (err) return err;
                    break;

                case NUAttribute.ATTR_TYPE_INTEGER:
                case NUAttribute.ATTR_TYPE_FLOAT:
                    err = attrObj.validateNumberValue(listElementValue, attrObj, true);
                    if (err) return err;
                    break;

                default:
            }
        }
        return null;
    }
    
    validateStringValue(attrValue, attrObj, validateSubType) {
        if (typeof attrValue !== (validateSubType ? attrObj.subType : attrObj.attributeType)) {
            return dataTypeMismatchError(attrObj, attrValue, validateSubType);
        }
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

    validateEnumValue(attrValue, attrObj, validateSubType) {
        if (attrObj.choices) {
            var choiceValues = attrObj.choices.map(function(choice) { return choice.name; });
            if (choiceValues.indexOf(attrValue) === -1) {
                return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                    'Invalid input',
                    `Allowed values are ${choiceValues}, but value provided is ${attrValue}`);
            }
        }
        return null;
    }

    validateObjectValue(attrValue, attrObj) {
        if (attrObj.subType) {
            if (!attrValue instanceof attrObj.subType) {
                return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                    'Invalid subType',
                    `Expected subType is ${attrObj.subType.getClassName()}`);
            }
        }
        return null;
    }

    validateNumberValue(attrValue, attrObj, validateSubType) {
        const expectedType = validateSubType ? attrObj.subType : attrObj.attributeType;
        if (isNaN(attrValue) || (expectedType === NUAttribute.ATTR_TYPE_INTEGER && (attrValue % 1 !== 0))) {
            return dataTypeMismatchError(attrObj, attrValue, validateSubType);
        }
        if (!isNaN(attrObj.minValue) && attrValue < attrObj.minValue) {
            return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                'Invalid value',
                `Minimum accepted value is ${attrObj.minValue}`);
        }
        if (!isNaN(attrObj.maxValue) && attrValue > attrObj.maxValue) {
            return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                'Invalid value',
                `Maximum accepted value is ${attrObj.maxValue}`);
        }
    }
}
