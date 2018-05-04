import { Enum } from 'enumify';

class UserRole extends Enum {

    _hasRole(role) {
        return this === role;
    }

    hasRoot() {
        return this._hasRole(UserRole.CSPROOT);
    }

    hasAdmin() {
        return this._hasRole(UserRole.ORGADMIN);
    }

    hasAdminOperator () {
        return this._hasRole(UserRole.ADMINOPERATOR);
    }

    hasOperator() {
        return this._hasRole(UserRole.CSPOPERATOR);
    }

    hasSecurityAdmin() {
        return this._hasRole(UserRole.SECURITYADMINISTRATOR);
    }

    hasSystem() {
        return this._hasRole(UserRole.SYSTEM);
    }

    hasOrguser() {
        return this._hasRole(UserRole.ORGUSER);
    }
    
    hasOrgNetworkDesigner() {
        return this._hasRole(UserRole.ORGNETWORKDESIGNER);
    }
}
UserRole.initEnum([
    'SYSTEM',
    'JMS',
    'CSPROOT',
    'CMS',
    'CSPOPERATOR',
    'ORGADMIN',
    'ORGNETWORKDESIGNER',
    'SECURITYADMINISTRATOR',
    'ADMINOPERATOR',
    'ORGUSER',
    'USER',
    'UNKNOWN'
]);

export default UserRole;
