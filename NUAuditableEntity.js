import NUAttribute from './NUAttribute';

/*
  This class models AuditableEntity
*/
export default class NUAuditableEntity extends NUEntity {
    static attributeDescriptors = {
        creationDate: new NUAttribute({
            localName: 'creationDate',
            attributeType: NUAttribute.ATTR_TYPE_TIMESTAMP,
            isReadOnly: true,
            isEditable: false,
            canSearch: true,}),
        lastUpdatedBy: new NUAttribute({
            localName: 'lastUpdatedBy',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isEditable: false }),
        lastUpdatedDate: new NUAttribute({
            localName: 'lastUpdatedDate',
            attributeType: NUAttribute.ATTR_TYPE_TIMESTAMP,
            isReadOnly: true,
            isEditable: false,
            canSearch: true,}),
        owner: new NUAttribute({
            localName: 'owner',
            attributeType: NUAttribute.ATTR_TYPE_STRING,
            isEditable: false })
    };

    constructor() {
        super();
        this.defineProperties({
            creationDate: undefined,
            lastUpdatedBy: undefined,
            lastUpdatedDate: undefined,
            owner: undefined
        });
    }

    isOwnedByUser(user) {
        return user && this.owner === user.ID;
    }
}
