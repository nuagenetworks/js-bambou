
/*
  This class holds a mapping of 'resourceName of NUEntity' to 'corresponding NUEntity class'
*/
export default class ServiceClassRegistry {

    static RESTResourceNameClassMap = new Map();
    static RESTNameClassMap = new Map();

    static register(EntityClass) {
        if (EntityClass !== null) {
            ServiceClassRegistry.RESTResourceNameClassMap.set(new EntityClass().resourceName, EntityClass);
            ServiceClassRegistry.RESTNameClassMap.set(new EntityClass().RESTName, EntityClass);
        }
    }

    static entityClassForResourceName(RESTResourceName) {
        if (RESTResourceName !== null) {
            return ServiceClassRegistry.RESTResourceNameClassMap.get(RESTResourceName);
        }
        return null;
    }

    static entityClassForRESTName(RESTName) {
        if (RESTName !== null) {
            return ServiceClassRegistry.RESTNameClassMap.get(RESTName);
        }
        return null;
    }
}
