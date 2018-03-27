import NUAttribute from './NUAttribute';
import NUEntity from './NUEntity';

/*
  This class models the Root Entity object
*/
export default class NURootEntity extends NUEntity {

    static attributeDescriptors = {
        ...NUEntity.attributeDescriptors,
        APIKey: new NUAttribute({
            localName: 'APIKey',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
        APIKeyExpiry: new NUAttribute({
            localName: 'APIKeyExpiry',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
        newPassword: new NUAttribute({
            localName: 'newPassword',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isPassword: true,
        }),
        password: new NUAttribute({
            localName: 'password',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isPassword: true,
            isRequired: true,
        }),
        passwordConfirm: new NUAttribute({
            localName: 'passwordConfirm',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isPassword: true,
        }),
        role: new NUAttribute({
            localName: 'role',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
        userName: new NUAttribute({
            localName: 'userName',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
    }
    constructor() {
        super();
        this.defineProperties({
            APIKey: null,
            APIKeyExpiry: null,
            newPassword: null,
            password: null,
            passwordConfirm: null,
            role: null,
            userName: null,
        });
    }

    get resourceName() {
        return this.RESTName;
    }
}
