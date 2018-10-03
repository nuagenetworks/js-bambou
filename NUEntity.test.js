import NUAttribute from './NUAttribute';
import NUEntity from './NUEntity';
import NUValidator from './NUValidator';
import { Enum } from 'enumify';

class NUAddressRangeIPTypeEnum extends Enum {}
NUAddressRangeIPTypeEnum.initEnum(['DUALSTACK', 'IPV4', 'IPV6']);
    
class CustomValidator1 extends NUValidator {
    validate(entity, attrObj, formValues) {
        const { attr5, attr4 } = formValues;
        if (attr5 && !attr4) {
            return 'attr4 must be set when attr5 is true';
        }
        return undefined;
    }
}

class CustomValidator2 extends NUValidator {
    validate(entity, attrObj, formValues) {
        const { attr3, attr5 } = formValues;
        if (attr5 && attr3 !== 'DUALSTACK') {
            return 'attr3 must be DUALSTACK when attr5 is true';
        }
        return undefined;
    }
}

class MyEntity extends NUEntity {
    static attributeDescriptors = {
        ...NUEntity.attributeDescriptors,
        attr1: new NUAttribute({ localName: 'attr1', remoteName: 'ATTR1', attributeType: NUAttribute.ATTR_TYPE_STRING, isCreateOnly: true }),
        attr2: new NUAttribute({ localName: 'attr2', attributeType: NUAttribute.ATTR_TYPE_STRING }),
        attr3: new NUAttribute({ localName: 'attr3', remoteName: 'ATTR3', attributeType: NUAttribute.ATTR_TYPE_ENUM, isRequired: true, choices: [NUAddressRangeIPTypeEnum.DUALSTACK, NUAddressRangeIPTypeEnum.IPV4, NUAddressRangeIPTypeEnum.IPV6] }),
        attr4: new NUAttribute({ localName: 'attr4', attributeType: NUAttribute.ATTR_TYPE_STRING, minLength: 3, maxLength: 6 }),
        attr5: new NUAttribute({ localName: 'attr5', attributeType: NUAttribute.ATTR_TYPE_BOOLEAN }),
        attr6: new NUAttribute({ localName: 'attr6', attributeType: NUAttribute.ATTR_TYPE_INTEGER }),
        attr7: new NUAttribute({ localName: 'attr7', attributeType: NUAttribute.ATTR_TYPE_FLOAT }),
        attr8: new NUAttribute({ localName: 'attr8', attributeType: NUAttribute.ATTR_TYPE_LIST, subType: NUAttribute.ATTR_TYPE_ENUM, choices: [NUAddressRangeIPTypeEnum.DUALSTACK, NUAddressRangeIPTypeEnum.IPV4, NUAddressRangeIPTypeEnum.IPV6] }),
        attr9: new NUAttribute({ localName: 'attr9', attributeType: NUAttribute.ATTR_TYPE_LIST, subType: NUAttribute.ATTR_TYPE_FLOAT }),
        attr11: new NUAttribute({ localName: 'attr11', attributeType: NUAttribute.ATTR_TYPE_STRING, isReadOnly:true }),
    }
    constructor() {
        super();
        this.defineProperties({
            attr1: null,
            attr2: null,
        });
        this.registerValidator(new CustomValidator1('customValidator1'));
        this.registerValidator(new CustomValidator2('customValidator2'));
    }

    get RESTName() {
        return 'childentity';
    }
}

// test validate mandatory attribute, choice, min length, max length
it('attribute validations', () => {
    const myEntity = new MyEntity();
    myEntity.ID = 'xyz123';
    let isValid = myEntity.isValid(myEntity);
    const errors = myEntity.validationErrors;
    expect(isValid).toEqual(false);
    expect(errors.get('attr3').description).toEqual('This value is mandatory');
    myEntity.attr3 = 'IPV7';
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(false);
    expect(errors.get('attr3').description).toEqual('Allowed values are DUALSTACK,IPV4,IPV6, but value provided is IPV7');
    myEntity.attr3 = 'IPV6';
    isValid = myEntity.isValid(myEntity);
    expect(errors.get('attr3')).toEqual(undefined);
    expect(isValid).toEqual(true);
    myEntity.attr4 = 'ab';
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(false);
    expect(errors.get('attr4').description).toEqual('Minimum length should be 3, but is 2');
    myEntity.attr4 = 'abcdefgh';
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(false);
    expect(errors.get('attr4').description).toEqual('Maximum length should be 6, but is 8');
    myEntity.attr4 = 123;
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(false);
    expect(errors.get('attr4').description).toEqual('Data type should be string, but is number');
    myEntity.attr4 = 'abcdef';
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(true);
    expect(errors.get('attr4')).toEqual(undefined);
    
    myEntity.attr8 = [1, 2, 3];
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(false);
    expect(errors.get('attr8').description).toEqual('Allowed values are DUALSTACK,IPV4,IPV6, but value provided is 1');
    myEntity.attr8 = [NUAddressRangeIPTypeEnum.DUALSTACK.name , NUAddressRangeIPTypeEnum.IPV4.name];
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(true);
    expect(errors.get('attr8')).toEqual(undefined);

    myEntity.attr9 = ["abc", "def"];
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(false);
    expect(errors.get('attr9').description).toEqual('Data type should be float, but is string');
    myEntity.attr9 = [1, 2.22, 3.56, 4];
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(true);
    expect(errors.get('attr9')).toEqual(undefined);
    expect(isValid).toEqual(true);
});


it('custom validations', () => {
    const myEntity = new MyEntity();
    myEntity.ID = 'xyz123';
    myEntity.attr3 = 'IPV4';
    myEntity.attr7 = 123.45;
    let isValid = myEntity.isValid({});
    myEntity.attr5 = true;
    isValid = myEntity.isValid(myEntity);
    const errors = myEntity.validationErrors;
    expect(isValid).toEqual(false);
    expect(errors.get('customValidator1')).toEqual('attr4 must be set when attr5 is true');
    expect(errors.get('customValidator2')).toEqual('attr3 must be DUALSTACK when attr5 is true');
    myEntity.attr4 = 'value4';
    myEntity.attr3 = 'DUALSTACK';
    isValid = myEntity.isValid(myEntity);
    expect(isValid).toEqual(true);
    expect(myEntity.constructor.attributeDescriptors.attr1.isCreateOnly).toEqual(true);
    expect(myEntity.constructor.attributeDescriptors.attr1.isEditable).toEqual(false);
    expect(myEntity.constructor.attributeDescriptors.attr2.isEditable).toEqual(true);
    expect(myEntity.constructor.attributeDescriptors.attr11.isReadOnly).toEqual(true);
    expect(myEntity.constructor.attributeDescriptors.attr11.isEditable).toEqual(false);
});
