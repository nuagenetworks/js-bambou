import NUObject from './NUObject';
import NURESTConnection from './NURESTConnection';
import NURESTUser from './NURESTUser';
import ServiceClassRegistry from './ServiceClassRegistry';

/*
  This class implements the specifics of REST operations.
  Methods in NURESTConnection are called to issue HTTP requests,
  and corresponding responses are processed
*/

export default class NUService extends NUObject {
    constructor(
        rootURL,
        headerAuthorization = 'Authorization',
        headerPage = 'X-Nuage-Page',
        headerPageSize = 'X-Nuage-PageSize',
        headerFilter = 'X-Nuage-Filter',
        headerOrderBy = 'X-Nuage-OrderBy',
        headerCount = 'X-Nuage-Count',
        headerMessage = 'X-Nuage-Message',
    ) {
        super();
        this.defineProperties({
            APIKey: null,
            headerAuthorization,
            headerCount,
            headerFilter,
            headerMessage,
            headerOrderBy,
            headerPage,
            headerPageSize,
            password: null,
            rootURL,
            userName: null,
            pageSize: 50,
        });
        this._customHeaders = {};
        this._connection = new NURESTConnection();
    }

    get onMultipleChoices() {
        return this._connection.onMultipleChoices;
    }

    set onMultipleChoices(value) {
        this._connection.onMultipleChoices = value;
    }

    setChoice(choice) {
        this._connection.setChoice(choice);
    }

    get interceptor() {
        return this._connection.interceptor;
    }

    set interceptor(value) {
        this._connection.interceptor = value;
    }

    get customHeaders() {
        return this._customHeaders;
    }

    addCustomHeader(customHeader, value) {
        this.customHeaders[customHeader] = value;
    }

    computeHeaders(page, filter, orderBy) {
        const headers = new Headers(this.customHeaders);
        headers.set(this.headerAuthorization, this.getAuthorization());
        headers.set('Content-Type', 'application/json');

        Object.entries(this.customHeaders).forEach(([key, value]) => {
            headers.set(key, value);
        });

        // optional headers
        if (Number.isInteger(page)) {
            headers.set(this.headerPage, page);
            headers.set(this.headerPageSize, this.pageSize);
        }

        if (filter) {
            headers.set(this.headerFilter, filter);
        }

        if (orderBy) {
            headers.set(this.headerOrderBy, orderBy);
        }
        return headers;
    }

    getAuthorization() {
        return `XREST ${btoa(`${this.userName}:${(this.APIKey || this.password)}`)}`;
    }

    buildURL(entity, RESTResourceName, parentEntity) {
        let url = `${this.rootURL}/`;

        if (!entity) {
            const EntityClass = ServiceClassRegistry.entityClassForResourceName(RESTResourceName);
            const resourceName = new EntityClass().resourceName;
            url += (!(parentEntity && parentEntity.ID)) ?
                RESTResourceName :
                `${parentEntity.resourceName}/${parentEntity.ID}/${resourceName}`;
        } else {
            url += ((!parentEntity) ? '' : `${parentEntity.resourceName}/${parentEntity.ID}/`) +
                entity.resourceName + ((entity.ID !== null) ? (`/${entity.ID}`) : '');
        }

        return url;
    }

    /*
      Logs in to VSD, processes the APIKey received in the response,
      and stores the same APIKey for future invocations
    */
    login(rootEntity) {
        this.userName = rootEntity.userName;
        this.password = rootEntity.password;
        const connObj =  this._connection;
        return this.invokeRequest('GET', this.buildURL(rootEntity), this.computeHeaders()).then(
                (response) => {
                    if (!response.authFailure) {
                        this.APIKey = response.data[0].APIKey;
                        rootEntity.buildFromJSON(response.data[0]);
                        return rootEntity;
                    }
                    connObj.interceptor.fail(response);
                    return Promise.reject(response);
                });
    }

    /*
      Issues a GET request, processes JSONObject response,
      and builds corresponding NUEntity object
    */
    fetch(entity) {
        return this.invokeRequest(
            'GET', this.buildURL(entity), this.computeHeaders()).then((response) => {
                entity.buildFromJSON(response.data[0]);
                return entity;
            });
    }

    /*
      Issues a GET request, processes the received Array of JSONObjects response,
      and builds corresponding Array of NUEntity objects
      Returns an object {data: an array of NUEntity objects,
      headers: an object with properties page, pageSize, filter, orderBy, and count}
    */
    fetchAll(RESTResourceName, parentEntity, page = 0, filter = null, orderBy = null) {
        const EntityClass = ServiceClassRegistry.entityClassForResourceName(RESTResourceName);
        return this.invokeRequest(
            'GET', this.buildURL(null, RESTResourceName, parentEntity), this.computeHeaders(page, filter, orderBy)).then((response) => {
                let data = [];

                if (response.data) {
                    data = response.data.map(obj => new EntityClass().buildFromJSON(obj));
                }
                return { data, headers: this.extractResponseHeaders(response.headers) };
            });
    }

    extractResponseHeaders(_responseHeaders) {
        const responseHeaders = new Headers(_responseHeaders);
        const headers = {};
        headers.count = Number(responseHeaders.get(this.headerCount));
        headers.page = Number(responseHeaders.get(this.headerPage));
        headers.pageSize = Number(responseHeaders.get(this.headerPageSize));
        headers.filter = responseHeaders.get(this.headerFilter);
        headers.orderBy = responseHeaders.get(this.headerOrderBy);

        if (responseHeaders[this.headerMessage]) {
            headers.message = responseHeaders[this.headerMessage];
        }
        return headers;
    }

    /*
      Issues a PUT request on the entity to update that entity on server
    */
    update(entity) {
        return this.invokeRequest(
            'PUT', this.buildURL(entity), this.computeHeaders(), entity.buildJSON());
    }

    /*
      Issues a PUT request on the entity to update that entity's associatedEntities on server
    */
    updateAssociatedEntities(entity) {
        if (entity && entity.associatedEntitiesResourceName) {
            return this.invokeRequest(
              'PUT', this.buildURL(null, entity.associatedEntitiesResourceName, entity), this.computeHeaders(), 
              entity.associatedEntities.length ? entity.buildJSON() : '[]');
        }
        else {
          return Promise.reject("Associated entities and associated entity resource is required");
        }
    }

    /*
      Issues a POST request for the entity passed
    */
    create(entity, parentEntity) {
        return this.invokeRequest(
            'POST', this.buildURL(entity, null, parentEntity), this.computeHeaders(), entity.buildJSON()).then((response) => {
                entity.buildFromJSON(response.data[0]);
                return entity;
            });
    }

    /*
      Issues a DELETE request on the entity
    */
    delete(entity) {
        return this.invokeRequest(
            'DELETE', this.buildURL(entity), this.computeHeaders());
    }

    /*
      Issues a HEAD request, processes response, and resolves the count of entities
    */
    count(RESTResourceName, parentEntity, page, filter, orderBy) {
        return this.invokeRequest(
            'HEAD', this.buildURL(null, RESTResourceName, parentEntity), this.computeHeaders(page, filter, orderBy)).then(
                response => Number(response.headers[this.headerCount.toLowerCase()],
            ),
        );
    }

    /*
      Issues request on server. In case of authentication issue, retries once.
    */
    invokeRequest(verb, URL, headers, requestData) {
        const svcObj = this;
        return this.invokeRequestOnConnection(verb, URL, headers, requestData).then(
                (response) => {
                    if (response.authFailure) {
                        if (!svcObj.retry) {
                            svcObj.retry = true;
                            return this.reLogin().then(
                                () => {
                                    svcObj.retry = false;
                                    headers.set(this.headerAuthorization, this.getAuthorization());
                                    return this.invokeRequest(verb, URL, headers, requestData);
                                },
                                () => {
                                    svcObj.retry = false;
                                    const error = { message: 'auth failed' };
                                    return Promise.reject(error);
                                });
                        }
                    }
                    return response;
                });
    }

    /*
      Resets APIKey, and re-attempts login
    */
    reLogin() {
        const user = new NURESTUser();
        user.userName = this.userName;
        user.password = this.password;
        this.APIKey = null;
        return this.login(user);
    }

    /*
      Invokes applicable method on NURESTConnection
    */
    invokeRequestOnConnection(verb, URL, headers, requestData) {
        if (verb === 'GET') {
            return this._connection.makeGETRequest(URL, headers);
        } else if (verb === 'PUT') {
            return this._connection.makePUTRequest(URL, headers, requestData);
        } else if (verb === 'POST') {
            return this._connection.makePOSTRequest(URL, headers, requestData);
        } else if (verb === 'DELETE') {
            return this._connection.makeDELETERequest(URL, headers);
        } else if (verb === 'HEAD') {
            return this._connection.makeHEADRequest(URL, headers);
        }
        return null;
    }

    /**
     * Create a copy of NUService
     */
    clone() {
        const newService = new NUService();
        newService._APIKey = this._APIKey;
        newService._headerAuthorization = this._headerAuthorization;
        newService._headerCount = this._headerCount;
        newService._headerFilter = this._headerFilter;
        newService._headerMessage = this._headerMessage;
        newService._headerOrderBy = this._headerOrderBy;
        newService._headerPage = this._headerPage;
        newService._headerPageSize = this._headerPageSize;
        newService._password = this._password;
        newService._rootURL = this._rootURL;
        newService._userName = this._userName;
        newService._pageSize = this._pageSize;
        newService._customHeaders = this._customHeaders;
        return newService;
    }
}
