import NUAttribute from './NUAttribute';
import NURootEntity from './NURootEntity';
import UserRole from "./UserRole";

const NUPermissionLevelAdmin = 'ORGADMIN';
const NUPermissionLevelAdminOperator = 'ADMINOPERATOR';
const NUPermissionLevelOperator = 'CSPOPERATOR';
const NUPermissionLevelPowerUser = 'ORGNETWORKDESIGNER';
const NUPermissionLevelRoot = 'CSPROOT';
// const NUPermissionLevelSystem = 'CMS';
const NUPermissionLevelUser = 'ORGUSER';
const NUPermissionLevelSecAdmin = 'SECURITYADMINISTRATOR';

export default class NURESTUser extends NURootEntity {

    static attributeDescriptors = {
        ...NURootEntity.attributeDescriptors,
        firstName: new NUAttribute({
            localName: 'firstName',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isRequired: true,
        }),
        lastName: new NUAttribute({
            localName: 'lastName',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isRequired: true,
        }),
        email: new NUAttribute({
            localName: 'email',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isRequired: true,
        }),
        mobileNumber: new NUAttribute({
            localName: 'mobileNumber',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
        enterpriseName: new NUAttribute({
            localName: 'enterpriseName',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
        role: new NUAttribute({
            localName: 'role',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
        avatarData: new NUAttribute({
            localName: 'avatarData',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
        avatarType: new NUAttribute({
            localName: 'avatarType',
            attributeType: NUAttribute.ATTR_TYPE_ENUM,
            choices: ['BASE64', 'COMPUTEDURL', 'URL'],
        }),
        licenseCapabilities: new NUAttribute({
            localName: 'licenseCapabilities',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
        statisticsEnabled: new NUAttribute({
            localName: 'statisticsEnabled',
            attributeType: NUAttribute.ATTR_TYPE_BOOLEAN,
        }),
        elasticSearchUIAddress: new NUAttribute({
            localName: 'elasticSearchUIAddress',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
        flowCollectionEnabled: new NUAttribute({
            localName: 'flowCollectionEnabled',
            attributeType: NUAttribute.ATTR_TYPE_BOOLEAN,
        }),
        enterpriseID: new NUAttribute({
            localName: 'enterpriseID',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
        }),
    }

    constructor() {
        super();
        this.defineProperties({
            firstName: null,
            lastName: null,
            email: null,
            mobileNumber: null,
            enterpriseName: null,
            avatarData: null,
            avatarType: null,
            licenseCapabilities: null,
            statisticsEnabled: null,
            elasticSearchUIAddress: null,
            flowCollectionEnabled: null,
            enterpriseID: null,
        });
    }

    get RESTName() {
        return 'me';
    }

    get roleName() {
        switch (this.role) {
            case NUPermissionLevelRoot:
                return 'data center administrator';
            case NUPermissionLevelOperator:
                return 'data center operator';
            case NUPermissionLevelAdmin:
                return 'administrator of';
            case NUPermissionLevelPowerUser:
                return 'network designer of';
            case NUPermissionLevelUser:
                return 'standard user of';
            case NUPermissionLevelAdminOperator:
                return 'admin operator of';
            case NUPermissionLevelSecAdmin:
                return 'security administrator of';
            default:
                return '';
        }
    }

    get fullName() {
        return `${this.firstName} ${this.lastName}`;
    }

    get displayDescription() {
        switch (this.role) {
            case NUPermissionLevelRoot:
            case NUPermissionLevelOperator:
                return `${this.fullName.toLowerCase()} (${this.userName.toLowerCase()}) - ${this.roleName.toLowerCase()}`;
            default:
                return `${this.fullName.toLowerCase()} (${this.userName.toLowerCase()}) - ${this.roleName.toLowerCase()} ${this.enterpriseName.toLowerCase()}`;
        }
    }

    _getUserRole() {
        return this.role ? UserRole.enumValueOf(this.role) : UserRole.UNKNOWN;
    }

    isCSPRoot() {
        return this._getUserRole().hasRoot();
    }

    isAdmin() {
        return this._getUserRole().hasAdmin();
    }

    isSecurityAdmin() {
        return this._getUserRole().hasSecurityAdmin();
    }

    isNetworkDesigner() {
        return this._getUserRole().hasNetworkDesigner();
    }
    
    isEverybody() {
        return this._getUserRole().hasOrguser();
    }

    isOperator() {
        return this._getUserRole().hasOperator();
    }

    isAdminOperator() {
        return this._getUserRole().hasAdminOperator();
    }
    
    isSystem() {
        return this._getUserRole().hasSystem();
    }
    
    isEncryptionEnabled () {
        return !!this.licenseCapabilities.find(item => item === 'ENCRYPTION_ENABLED');
    }
}
