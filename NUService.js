import NUObject from './NUObject';
import NURESTConnection from './NURESTConnection';
import ServiceClassRegistry from './ServiceClassRegistry';

const CUSTOM_HEADER_PATCH_TYPE = 'X-Nuage-PatchType';

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
          headerClientType:'X-Nuage-ClientType'
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
                headerClientType: headers.headerClientType,
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

    removeCustomHeader(customHeader) {
        delete this.customHeaders[customHeader];
    }

    computeHeaders(page, filter, orderBy, filterType = 'predicate', pageSize = null, clientType = 'UI') {
        const headers = {};
        headers[this.headerAuthorization] = this.getAuthorization();
        headers['Content-Type'] = 'application/json';
        headers[this.headerClientType] = clientType;

        Object.entries(this.customHeaders).forEach(([key, value]) => {
            headers[key] = value;
        });

        // optional headers
        if (Number.isInteger(page)) {
            headers[this.headerPage] = page;
            headers[this.headerPageSize] = pageSize || this.pageSize;
        }

        if (filter) {
            headers[this.headerFilter] = filter;
            headers[this.headerFilterType] = filterType;
        }

        if (orderBy) {
            headers[this.headerOrderBy] = orderBy;
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
    login(rootEntity, cancelToken) {
        this.userName = rootEntity.userName;
        this.password = rootEntity.password;
        const connObj =  this._connection;
        return this.invokeRequest({
            verb: 'GET',
            requestURL: this.buildURL(rootEntity),
            headers: this.computeHeaders(),
            cancelToken
        }).then((response) => {
            if (!response.authFailure) {
                this.APIKey = response.data[0].APIKey;
                rootEntity.buildFromJSON(response.data[0]);
                return rootEntity;
            }
            connObj.interceptor.fail(response);
            return Promise.reject(response);
        });
    }

    updatePassword(entity, cancelToken) {
        this.userName = entity.userName;
        this.password = entity.password;
        
        let requestPayLoad = entity.buildJSON();
        requestPayLoad = JSON.parse(requestPayLoad,'');
        delete requestPayLoad['APIKeyExpiry'];
        requestPayLoad.password = entity.newPassword;
        requestPayLoad.passwordConfirm = entity.newPassword;
        requestPayLoad = JSON.stringify(requestPayLoad);
        
        return this.invokeRequest({
            verb: 'PUT',
            requestURL: this.buildURL(entity),
            headers: this.computeHeaders(),
            requestData: requestPayLoad,
            cancelToken
        });
    }

    /*
      Issues a GET request, processes JSONObject response,
      and builds corresponding NUEntity object
    */
    fetch(entity, cancelToken) {
        return this.invokeRequest({
            verb: 'GET',
            requestURL: this.buildURL(entity),
            headers: this.computeHeaders(),
            cancelToken
        }).then((response) => {
            entity.buildFromJSON(response.data[0]);
            return entity;
        });
    }

    /*
    *  Fetching stats for a specific entity.
    *  Stats APIs have query parameters that can be passed
    */
    fetchStats(statsResourceName, parentEntity, queryStringParams, cancelToken) {
        const queryString = Object.entries(queryStringParams).map( ([key, value]) => (`${key}=${value}`)).join('&');
        const requestURL = `${this.buildURL(null, statsResourceName, parentEntity)}/?${queryString}`
        return this.invokeRequest({
            verb: 'GET',
            requestURL,
            headers: this.computeHeaders(),
            cancelToken
        }).then((response) => {
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
    fetchAll({
        resourceName,
        parentEntity,
        page = 0,
        filter = null,
        orderBy = null,
        filterType = undefined,
        light = false,
        cancelToken
    }) {
        const EntityClass = ServiceClassRegistry.entityClassForResourceName(resourceName);
        let requestURL = this.buildURL(null, resourceName, parentEntity);
        if (light) {
            requestURL = `${requestURL}/?light`;
        }

        return this.invokeRequest({
            verb: 'GET',
            requestURL,
            headers: this.computeHeaders(page, filter, orderBy, filterType),
            cancelToken
        }).then((response) => {
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
    update(entity, cancelToken) {
        return this.invokeRequest({
            verb: 'PUT',
            requestURL: this.buildURL(entity),
            headers: this.computeHeaders(),
            requestData: entity.buildJSON(),
            cancelToken
        });
    }

    /*
      Issues a PUT request on the entity to update that entity's associatedEntities on server
    */
    updateAssociatedEntities(entity, cancelToken) {
        if (entity && entity.associatedEntitiesResourceName) {
            return this.invokeRequest({
                verb: 'PUT',
                requestURL: this.buildURL(null, entity.associatedEntitiesResourceName, entity),
                headers: this.computeHeaders(),
                requestData: entity.associatedEntities.length ? entity.buildJSON() : '[]',
                cancelToken
            });
        }
        else {
          return Promise.reject("Associated entities and associated entity resource is required");
        }
    }

    /*
      Issues a POST request for the entity passed
    */
    create(entity, parentEntity, cancelToken) {
        return this.invokeRequest({
            verb: 'POST',
            requestURL: this.buildURL(entity, null, parentEntity),
            headers: this.computeHeaders(),
            requestData: entity.buildJSON(),
            cancelToken
        }).then((response) => {
            entity.buildFromJSON(response.data[0]);
            return entity;
        });
    }

    /*
      Issues a DELETE request on the entity
    */
    delete(entity, cancelToken) {
        return this.invokeRequest({
            verb: 'DELETE',
            requestURL: this.buildURL(entity),
            headers: this.computeHeaders(),
            cancelToken
        });
    }

    /*
      Issues a HEAD request, processes response, and resolves the count of entities
    */
    count({
        resourceName,
        parentEntity,
        page,
        filter,
        orderBy,
        filterType,
        cancelToken
    }) {
        return this.invokeRequest({
            verb: 'HEAD',
            requestURL: this.buildURL(null, resourceName, parentEntity),
            headers: this.computeHeaders(page, filter, orderBy, filterType),
            cancelToken
        }).then(response => {
            const count = Number(response.headers[this.headerCount.toLowerCase()]);
            return count || 0;
        });
    }

    addAssociatedEntities(entity, cancelToken) {
        if (entity && entity.associatedEntitiesResourceName) {
            const service = this.withHeaders([{header: CUSTOM_HEADER_PATCH_TYPE, value: 'add'}])
            return service.invokeRequest({
                verb: 'PATCH',
                requestURL: service.buildURL(null, entity.associatedEntitiesResourceName, entity),
                headers: service.computeHeaders(),
                requestData: entity.associatedEntities.length ? entity.buildJSON() : '[]',
                cancelToken
            });
        }
        else {
            return Promise.reject("Associated entities and associated entity resource is required");
        }
    }

    removeAssociatedEntities(entity, cancelToken) {
        if (entity && entity.associatedEntitiesResourceName) {
            const service = this.withHeaders([{header: CUSTOM_HEADER_PATCH_TYPE, value: 'remove'}])
            return service.invokeRequest({
                verb: 'PATCH',
                requestURL: service.buildURL(null, entity.associatedEntitiesResourceName, entity),
                headers: service.computeHeaders(),
                requestData: entity.associatedEntities.length ? entity.buildJSON() : '[]',
                cancelToken
            });
        }
        else {
            return Promise.reject("Associated entities and associated entity resource is required");
        }
    }

    /*
        Invokes applicable method on NURESTConnection
    */
    invokeRequest({verb, requestURL, headers, requestData, ignoreRequestIdle = false, cancelToken}) {
        this._connection.ignoreRequestIdle = ignoreRequestIdle;

        if (verb === 'GET') {
            return this._connection.makeGETRequest(requestURL, headers, cancelToken);
        } else if (verb === 'PUT') {
            return this._connection.makePUTRequest(requestURL, headers, requestData, cancelToken);
        } else if (verb === 'POST') {
            return this._connection.makePOSTRequest(requestURL, headers, requestData, cancelToken);
        } else if (verb === 'DELETE') {
            return this._connection.makeDELETERequest(requestURL, headers, cancelToken);
        } else if (verb === 'HEAD') {
            return this._connection.makeHEADRequest(requestURL, headers, cancelToken);
        } else if (verb === 'PATCH') {
            return this._connection.makePATCHRequest(requestURL, headers, requestData, cancelToken);
        }
        return null;
    }

    /**
     * Create a copy of NUService
     */
    clone() {
        let newService = new NUService({rootURL: this.rootURL});
        newService =  Object.assign(newService, this);
        newService._customHeaders = {...this._customHeaders};
        return newService;
    }

    withHeaders(customHeaders) {
        const svc = this.clone();
        if (Array.isArray(customHeaders)) {
            customHeaders.forEach(hdr => (svc.addCustomHeader(hdr.header, hdr.value)))
        }

        return svc;
    }
}
