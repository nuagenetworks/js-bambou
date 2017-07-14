
/*
  This class holds a mapping of 'RESTName of NUEntity' to 'corresponding NUEntity class'
*/
export default class ServiceClassRegistry {

    static RESTNameClassMap = new Map();

    static register(EntityClass) {
        if (EntityClass !== null) {
            ServiceClassRegistry.RESTNameClassMap.set(new EntityClass().RESTName, EntityClass);
        }
    }

    static entityClassForRESTName(RESTName) {
        if (RESTName !== null) {
            return ServiceClassRegistry.RESTNameClassMap.get(RESTName);
        }
        return null;
    }

}
