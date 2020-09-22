import { Enum } from 'enumify';

class UserRole extends Enum {

    _hasRole(role) {
        return this === role;
    }

    hasRoot() {
        return this._hasRole(UserRole.CSPROOT);
    }

    hasAuditAdmin() {
        return this._hasRole(UserRole.AUDITADMIN);
    }

    hasAdmin() {
        return this._hasRole(UserRole.ORGADMIN);
    }

    hasAdminOperator () {
        return this._hasRole(UserRole.ADMINOPERATOR);
    }

    hasNetworkDesigner() {
        return this._hasRole(UserRole.ORGNETWORKDESIGNER);
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
}
UserRole.initEnum([
    'SYSTEM',
    'JMS',
    'CSPROOT',
    'CMS',
    'CSPOPERATOR',
    'AUDITADMIN',
    'ORGADMIN',
    'ORGNETWORKDESIGNER',
    'SECURITYADMINISTRATOR',
    'ADMINOPERATOR',
    'ORGUSER',
    'USER',
    'UNKNOWN'
]);

export default UserRole;
