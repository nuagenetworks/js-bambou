import objectPath from 'object-path';

import NUService from 'service/NUService';
import NURESTUser from 'service/NURESTUser';
import NUTemplateParser from "service/NUTemplateParser";

const ERROR_MESSAGE = `No VSD API endpoint specified`;

export default class VSDService extends NUService {

    constructor() {
        const url = localStorage.getItem('rootURL');
        super(url);
    
        this.url = url;
        this.APIKey = localStorage.getItem('API_KEY');
        this.organization = localStorage.getItem('ORGANIZATION');
        this.userJson = localStorage.getItem('USER_JSON');
    }

    VSDSearchConvertor = (expressions) => {
        let expression = '';

        expressions.forEach(e => {
            if (e.operator) {
                expression += ` ${e.operator} `;
            } else if (e.bracket) {
                expression += `${e.bracket}`;
            } else {
                expression += `${e.element.category} ${e.element.operator} "${e.element.value}"`;
            }
        });

        return expression;
    }

    buildURL = (configuration) => {

        let url = configuration.parentResource;

        if (configuration.hasOwnProperty("parentID"))
            url += "/" + configuration.parentID;

        if (configuration.hasOwnProperty("resource"))
            url += "/" + configuration.resource;

        return url;
    }

    getRequestID = (configuration, context = {}) => {
        const tmpConfiguration = NUTemplateParser.parameterizedConfiguration(configuration, context);
        if (!tmpConfiguration)
            return;
        let URL = this.buildURL(tmpConfiguration.query);

        URL = configuration.id ? `${configuration.vizID}-${configuration.id}-${URL}` : URL;
        if (!tmpConfiguration.query.filter)
            return URL;

        return URL + "-" + tmpConfiguration.query.filter;
    }

    // TODO - refactor later by using existing service
    fetch = (configuration, scroll = false) => {

        if (!this.APIKey || !this.userJson || !this.organization) {
            return Promise.reject(ERROR_MESSAGE);
        }

        const user = new NURESTUser().buildFromJSON(JSON.parse(this.userJson));
        if(user) {
            this.userName = user.userName;
        }

        this.addCustomHeader('X-Nuage-Organization', this.organization);

        const filter = configuration.filter || null,
            page = (configuration && configuration.nextPage) || 0,
            orderBy = configuration.sort || null,
            api = `${this.url}/${this.buildURL(configuration)}`;

        return new Promise((resolve, reject) => {
            this.invokeRequest(
                'GET',
                api,
                this.computeHeaders(page, filter, orderBy),
                undefined,
                true,
            ).then(response => resolve({
                response: response.data,
            })
            ).catch(error => reject(error));
        });
    }

    // Add custom sorting into VSD query
    addSorting = (queryConfiguration, sort) => {
        queryConfiguration.query.sort = `${sort.column} ${sort.order}`
        return queryConfiguration;
    }

    // Add custom searching from searchbox into VSD query
    addSearching = (queryConfiguration, search) => {
        if (search.length) {
            let filter = objectPath.get(queryConfiguration, 'query.filter');
            objectPath.push(queryConfiguration, 'query.filter', (filter ? `(${filter}) AND ` : '') + this.VSDSearchConvertor(search));
        }

        return queryConfiguration;
    }

    getPageSizePath = () => 'query.pageSize';
    
    updatePageSize = (queryConfiguration, pageSize) => {
        objectPath.set(queryConfiguration, this.getPageSizePath(), pageSize);
        return queryConfiguration;
    }
    
    getNextPageQuery = (queryConfiguration, nextPage) => {
        queryConfiguration.query.nextPage = nextPage;
        return queryConfiguration;
    }
}
