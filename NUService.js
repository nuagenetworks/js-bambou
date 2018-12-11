import NUObject from './NUObject';
import NURESTConnection from './NURESTConnection';
import ServiceClassRegistry from './ServiceClassRegistry';

const getURLParams = (rootURL) => {
    const url = new URL(rootURL)
    const [ , RESTRoot, RESTResource, APIVersion ] = url.pathname.split('/');
    return { 
        hostname: url.hostname, 
        port: url.port, 
        protocol: url.protocol && url.protocol.substring(0, url.protocol.length -1),
        RESTRoot,
        RESTResource,
        APIVersion
    };
};

/*
  This class implements the specifics of REST operations.
  Methods in NURESTConnection are called to issue HTTP requests,
  and corresponding responses are processed
*/

export default class NUService extends NUObject {
    constructor({
        rootURL,
        protocol,
        hostname,
        port,
        RESTRoot,
        RESTResource,
        APIVersion,
        headers = {
          headerAuthorization: 'Authorization',
          headerPage: 'X-Nuage-Page',
          headerPageSize: 'X-Nuage-PageSize',
          headerFilter: 'X-Nuage-Filter',
          headerFilterType: 'X-Nuage-FilterType',
          headerOrderBy: 'X-Nuage-OrderBy',
          headerCount: 'X-Nuage-Count',
          headerMessage:'X-Nuage-Message',
      }}) {
          super();
          const url =rootURL ? rootURL : `${protocol}://${hostname}${port ? ":" + port : ''}/${RESTRoot}/${RESTResource}${APIVersion ? '/' + APIVersion : ''}`;
          const URLParams =  getURLParams(url);
          this.defineProperties({
                APIKey: null,
                headerAuthorization: headers.headerAuthorization,
                headerCount: headers.headerCount,
                headerFilter: headers.headerFilter,
                headerFilterType: headers.headerFilterType,
                headerMessage: headers.headerMessage,
                headerOrderBy: headers.headerOrderBy,
                headerPage: headers.headerPage,
                headerPageSize: headers.headerPageSize,
                password: null,
                rootURL: url,
                userName: null,
                pageSize: 50,
                protocol: URLParams.protocol,
                hostname: URLParams.hostname,
                port: URLParams.port,
                RESTRoot: URLParams.RESTRoot,
                RESTResource: URLParams.RESTResource,
                APIVersion: URLParams.APIVersion
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

    setRESTConectionTimeout(value) {
        this._connection.RESTConnectionTimeout = value;
    }

    get customHeaders() {
        return this._customHeaders;
    }

    addCustomHeader(customHeader, value) {
        this.customHeaders[customHeader] = value;
    }

    computeHeaders(page, filter, orderBy, filterType = 'predicate', pageSize = null) {
        const headers = new Headers(this.customHeaders);
        headers.set(this.headerAuthorization, this.getAuthorization());
        headers.set('Content-Type', 'application/json');

        Object.entries(this.customHeaders).forEach(([key, value]) => {
            headers.set(key, value);
        });

        // optional headers
        if (Number.isInteger(page)) {
            headers.set(this.headerPage, page);
            headers.set(this.headerPageSize, pageSize || this.pageSize);
        }

        if (filter) {
            headers.set(this.headerFilter, filter);
            headers.set(this.headerFilterType, filterType);
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
                entity.resourceName + (entity.resourceName === 'me' ? '' : ((entity.ID !== null) ? (`/${entity.ID}`) : ''));
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

    updatePassword(entity) {
        this.userName = entity.userName;
        this.password = entity.password;
        
        let requestPayLoad = entity.buildJSON();
        requestPayLoad = JSON.parse(requestPayLoad,'');
        delete requestPayLoad['APIKeyExpiry'];
        requestPayLoad.password = entity.newPassword;
        requestPayLoad.passwordConfirm = entity.newPassword;
        requestPayLoad = JSON.stringify(requestPayLoad);
        this.APIKey = null;
        
        return this.invokeRequest('PUT', this.buildURL(entity), this.computeHeaders(), requestPayLoad);
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
    *  Fetching stats for a specific entity.
    *  Stats APIs have query parameters that can be passed
    */
    fetchStats(statsResourceName, parentEntity, queryStringParams) {
        const queryString = Object.entries(queryStringParams).map( ([key, value]) => (`${key}=${value}`)).join('&');
        const url = `${this.buildURL(null, statsResourceName, parentEntity)}/?${queryString}`
        return this.invokeRequest(
            'GET', url, this.computeHeaders()).then((response) => {
            const EntityClass = ServiceClassRegistry.entityClassForResourceName(statsResourceName);
            if (EntityClass) {
                const statsEntity = new EntityClass();
                statsEntity.buildFromJSON(response.data[0]);
                return statsEntity;
            }
            return response.data[0];
        });
    }

    /*
      Issues a GET request, processes the received Array of JSONObjects response,
      and builds corresponding Array of NUEntity objects
      Returns an object {data: an array of NUEntity objects,
      headers: an object with properties page, pageSize, filter, orderBy, and count}
    */
    fetchAll(RESTResourceName, parentEntity, page = 0, filter = null, orderBy = null, filterType = undefined) {
        const EntityClass = ServiceClassRegistry.entityClassForResourceName(RESTResourceName);
        return this.invokeRequest(
            'GET', this.buildURL(null, RESTResourceName, parentEntity), this.computeHeaders(page, filter, orderBy, filterType)).then((response) => {
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
        headers.filterType = responseHeaders.get(this.headerFilterType);
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
    count(RESTResourceName, parentEntity, page, filter, orderBy, filterType) {
        return this.invokeRequest(
            'HEAD', this.buildURL(null, RESTResourceName, parentEntity), this.computeHeaders(page, filter, orderBy, filterType)).then(
                response => {
                    const count = Number(response.headers[this.headerCount.toLowerCase()]);
                    return count || 0;
                }
            );
    }

    invokeRequest(verb, URL, headers, requestData, ignoreRequestIdle = false) {
        this._connection.ignoreRequestIdle = ignoreRequestIdle;
        return this.invokeRequestOnConnection(verb, URL, headers, requestData);
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
        newService._headerFilterType = this._headerFilterType;
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
