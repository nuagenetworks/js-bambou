import NUAttribute from './NUAttribute';
import NUEntity from './NUEntity';
import NURootEntity from './NURootEntity';
import NUService from './NUService';
import ServiceClassRegistry from './ServiceClassRegistry';

jest.mock('./NURESTConnection');

class RESTUser extends NURootEntity {
    static attributeDescriptors = {
        ...NURootEntity.attributeDescriptors,
        attr1: new NUAttribute({ localName: 'attr1', attributeType: NUAttribute.ATTR_TYPE_STRING }),
        attr2: new NUAttribute({ localName: 'attr2', remoteName: 'ATTR2', attributeType: NUAttribute.ATTR_TYPE_STRING }),
    }

    constructor() {
        super();
        this.defineProperties({
            attr1: null,
            attr2: null,
        });
    }

    get RESTName() {
        return 'me';
    }

    get resourceName() {
        return this.RESTName;
    }
}

class Parent extends NUEntity {
    static attributeDescriptors = {
        ...NUEntity.attributeDescriptors,
        parentAttr1: new NUAttribute({ localName: 'parentAttr1', remoteName: 'parentATTR1', attributeType: NUAttribute.ATTR_TYPE_STRING }),
    }

    constructor() {
        super();
        this.defineProperties({
            parentAttr1: null,
        });
    }

    get RESTName() {
        return 'parententity';
    }

    get resourceName() {
        return 'parententities';
    }
}

class Child extends NUEntity {
    static attributeDescriptors = {
        ...NUEntity.attributeDescriptors,
        attr1: new NUAttribute({ localName: 'attr1', remoteName: 'ATTR1', attributeType: NUAttribute.ATTR_TYPE_STRING }),
        attr2: new NUAttribute({ localName: 'attr2', attributeType: NUAttribute.ATTR_TYPE_STRING }),
        attr3: new NUAttribute({ localName: 'attr3', remoteName: 'ATTR3', attributeType: NUAttribute.ATTR_TYPE_ENUM, isRequired: true, choices: ['A', 'B', 'C'] }),
        attr4: new NUAttribute({ localName: 'attr4', attributeType: NUAttribute.ATTR_TYPE_STRING, minLength: 3, maxLength: 6 }),
    }
    constructor() {
        super();
        this.defineProperties({
            attr1: null,
            attr2: null,
        });
    }

    get RESTName() {
        return 'childentity';
    }

    get resourceName() {
        return 'childentities';
    }
}

ServiceClassRegistry.register(Parent);
ServiceClassRegistry.register(Child);

const VSDService = new NUService(
    'https://135.227.177.144:8443/nuage/api/v4_0',
    headers = {
        headerAuthorization: 'Authorization',
        headerPage: 'Page',
        headerPageSize: 'PageSize',
        headerFilter: 'Filter',
        headerFilterType: 'FilterType',
        headerOrderBy: 'OrderBy',
        headerCount: 'Count',
        headerMessage:'Message'
});
VSDService.addCustomHeader('X-Nuage-Organization', 'csp');
VSDService.addCustomHeader('Content-type', 'application/json');
VSDService.pageSize = 3;

// test login
it('login', () => {
    const userEntity = new RESTUser();
    userEntity.userName = 'csproot';
    userEntity.password = 'csproot';

    return VSDService.fetch(userEntity).then((response) => {
        expect(response.attr1).toEqual('abcd');
        expect(response.attr2).toEqual('efgh');
        expect(response.APIKey).toEqual('396bbbe7-3aae-424a-9d4b-5d2202ce6a4c');
    });
});

// test fetch
it('fetch', () => {
    const child = new Child();
    child.ID = 'xyz123';
    return VSDService.fetch(child).then((response) => {
        expect(response.ID).toEqual('def123');
        expect(response.attr1).toEqual('AC0098777');
        expect(response.attr2).toEqual('1485301116777');
    });
});

// test fetchall
it('fetchall', () => {
    const parent = new Parent();
    parent.ID = 'd8cf28fa-e6d5-4779-8229-e45192ef763b';
    return VSDService.fetchAll(new Child().resourceName, parent).then((response) => {
        expect(response.data[1].ID).toEqual('xyz456');
        expect(response.data[1].attr1).toEqual('AC0098766');
        expect(response.data[1].attr2).toEqual('1485302226000');
    });
});

// test fetchall by page, filter, and orderBy
it('fetchall by page, filter, and orderBy', () => {
    const parent = new Parent();
    parent.ID = 'd8cf28fa-e6d5-4779-8229-e45192ef763b';
    return VSDService.fetchAll(new Child().resourceName, parent, 3, 'value < 100', 'value ASC').then((response) => {
        expect(response.data[2].ID).toEqual('aad333');
        expect(response.data[2].attr1).toEqual('AAC098333');
        expect(response.data[2].attr2).toEqual('1485303336333');
        expect(response.headers.count).toEqual(20);
        expect(response.headers.filter).toEqual('value < 100');
        expect(response.headers.orderBy).toEqual('value ASC');
        expect(response.headers.page).toEqual(3);
        expect(response.headers.pageSize).toEqual(3);
    });
});

// test update
it('update', () => {
    const child = new Child();
    child.ID = 'xyz123';
    child.attr1 = 'TEST123';
    return VSDService.update(child).then((response) => {
        expect(response.data).toEqual('');
    });
});

// test create
it('create', () => {
    const parent = new Parent();
    parent.ID = 'd8cf28fa-e6d5-4779-8229-e45192ef763b';

    const child = new Child();
    child.ID = 'emp789';
    return VSDService.create(child, parent).then((response) => {
        expect(response.ID).toEqual('emp789');
        expect(response.attr1).toEqual('AC00EMP789');
        expect(response.attr2).toEqual('1481113336000');
    });
});

// test delete
it('delete', () => {
    const child = new Child();
    child.ID = 'xyz123';
    return VSDService.delete(child).then((response) => {
        expect(response.data).toEqual('');
    });
});

// test count
it('count', () => {
    const parent = new Parent();
    parent.ID = 'parent123';
    return VSDService.count(new Child().resourceName, parent, null, 'value < 123').then((response) => {
        expect(response).toEqual(30);
    });
});
