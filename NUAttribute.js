import NUObject from './NUObject';
import NUAttributeValidationError from './NUAttributeValidationError';
import NUException from './NUException';


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
        });
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
            if (attrObj.isRequired && ((attrObj.attributeType === NUAttribute.ATTR_TYPE_STRING && !attrValue) ||
                (attrObj.attributeType !== NUAttribute.ATTR_TYPE_STRING && (attrValue === undefined || attrValue === null)))) {
                return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                    'Invalid input', 'This value is mandatory');
            }

            if (attrValue) {
                var dataTypeMismatch = false;
                if (attrObj.attributeType === NUAttribute.ATTR_TYPE_INTEGER || attrObj.attributeType === NUAttribute.ATTR_TYPE_FLOAT || attrObj.attributeType === NUAttribute.ATTR_TYPE_LONG || attrObj.attributeType === NUAttribute.ATTR_TYPE_TIMESTAMP) {
                    dataTypeMismatch = (typeof attrValue !== 'number');
                } else if (attrObj.attributeType === NUAttribute.ATTR_TYPE_LIST) {
                    dataTypeMismatch = (typeof attrValue !== 'object');
                } else if (attrObj.attributeType !== NUAttribute.ATTR_TYPE_ENUM && typeof attrValue !== attrObj.attributeType) {
                    dataTypeMismatch = true;
                }
                if (dataTypeMismatch) {
                    return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                        'Invalid data type',
                        `Data type should be ${attrObj.attributeType}, but is ${typeof attrValue}`);
                }
                if (attrObj.attributeType === NUAttribute.ATTR_TYPE_STRING) {
                    return attrObj.validateStringValue(attrValue, attrObj);
                } else if (attrObj.attributeType === NUAttribute.ATTR_TYPE_ENUM) {
                    return attrObj.validateEnumValue(attrValue, attrObj);
                } else if (attrObj.attributeType === NUAttribute.ATTR_TYPE_LIST) {
                    return attrObj.validateListValues(attrValue, attrObj);
                }
                else if (attrObj.attributeType === NUAttribute.ATTR_TYPE_OBJECT) {
                    return attrObj.validateObjectValue(attrValue, attrObj);
                }
            }
        }
        return null;
    }

    validateListValues(listValues, attrObj) {
        for (var i = 0; i < listValues.length; i++) {
            var listElementValue = listValues[i],
                dataTypeMismatch = false;        
            if (attrObj.subType === NUAttribute.ATTR_TYPE_INTEGER || attrObj.subType === NUAttribute.ATTR_TYPE_FLOAT) {
                dataTypeMismatch = (typeof listElementValue !== 'number');
            } else if (attrObj.subType !== NUAttribute.ATTR_TYPE_ENUM && typeof listElementValue === 'object' && !(listElementValue instanceof attrObj.subType)) {
                dataTypeMismatch = true;
            }
            if (dataTypeMismatch){
                return new NUAttributeValidationError(attrObj.localName, attrObj.remoteName,
                    'Invalid data type',
                    `Data type should be ${attrObj.subType}, but is ${typeof listElementValue}`);
            }
            if (attrObj.subType === NUAttribute.ATTR_TYPE_STRING) {
                let err = attrObj.validateStringValue(listElementValue, attrObj);
                if (err) {
                    return err;
                }
            } else if (attrObj.subType === NUAttribute.ATTR_TYPE_ENUM) {
                let err = attrObj.validateEnumValue(listElementValue, attrObj);
                if (err) {
                    return err;
                }
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
}
