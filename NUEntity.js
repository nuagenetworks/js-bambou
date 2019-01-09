import NUAttribute from './NUAttribute';
import NUAbstractModel from './NUAbstractModel';
import NUException from './NUException';

/*
  This class models the base Entity
*/
export default class NUEntity extends NUAbstractModel {
    static attributeDescriptors = {
        creationDate: new NUAttribute({
            localName: 'creationDate',
            attributeType: NUAttribute.ATTR_TYPE_LONG,
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
            attributeType: NUAttribute.ATTR_TYPE_LONG,
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
        associatedEntities: new NUAttribute({
          localName: 'associatedEntities',
          attributeType: NUAttribute.ATTR_TYPE_LIST,
          isEditable: true }),
        associatedEntitiesResourceName: new NUAttribute({
          localName: 'associatedEntitiesResourceName',
          attributeType: NUAttribute.ATTR_TYPE_STRING,
          isEditable: true }),
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

    static getMandatoryAttributes() {
        if (!this.mandatoryAttributes) {
            this.mandatoryAttributes = Object
                .entries(this.attributeDescriptors)
                .reduce((acc, attr) => {
                    const [key, value] = attr;
                    if (value.isRequired) {
                        acc.push(key)
                    };
                    return acc;
                }, []);
        }
        return this.mandatoryAttributes;
    }
    
    static hasMandatoryAttributesSet(JSONObject) {
        for (const attr of this.getMandatoryAttributes()) {
            if (!JSONObject[attr]) {
                return false;
            }
        }
        return true;
    }
    
    constructor() {
        super();
        this.defineProperties({
            creationDate: undefined,
            entityScope: undefined,
            externalID: undefined,
            ID: null,
            lastUpdatedBy: undefined,
            lastUpdatedDate: undefined,
            owner: undefined,
            parentID: undefined,
            parentObject: undefined,
            parentType: undefined,
            associatedEntities: [],
            associatedEntitiesResourceName: undefined,
        });
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

    toObject() {
        const attributeDescriptors = this.constructor.attributeDescriptors;
        const assocEntities = this[attributeDescriptors.associatedEntities.name];
        if (assocEntities && assocEntities.length > 0) {
          return assocEntities.map(item => item.ID);
        } else {
            return super.toObject();
        }
    }

    getDefaults() {
        return Object.entries(this).reduce((acc, [key, value]) => {
            return (value && key !== '_validationErrors' && key !== '_validators' && key !== '_associatedEntities')
                ? { ...acc, [key.substring(1)]: value } : acc;
        }, {});
    }

    isFromTemplate() {
        return this.hasOwnProperty('templateID') && this.templateID;
    }

    isScopeGlobal() {
        return this.entityScope === 'GLOBAL';
    }

    isOwnedByUser(user) {
      return user && this.owner === user.ID;
    }
}
