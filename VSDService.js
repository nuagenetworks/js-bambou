import objectPath from 'object-path';
import { getLogger } from './Logger';
import NUTemplateParser from "service/NUTemplateParser";

const ERROR_MESSAGE = 'Unable to fetch data';

export default class VSDService {

    constructor(service) {
        this.service = service;
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

    getParentEntity = (configuration) => {
        const parentEntity = { resourceName: configuration.parentResource};
        if (configuration.hasOwnProperty("parentID")) {
            parentEntity.ID = configuration.parentID;
        }

        return parentEntity;
    }

    getEntity = (configuration) => {
        const entity = {
            ID: null
        };

        if (configuration.hasOwnProperty("resource")) {
            entity.resourceName = configuration.resource;
        }

        return entity;
    }

    getRequestID = (configuration, context = {}) => {
        const tmpConfiguration = NUTemplateParser.parameterizedConfiguration(configuration, context);
        if (!tmpConfiguration)
            return;

        let endPoint = tmpConfiguration.query.parentResource;

        if (tmpConfiguration.query.hasOwnProperty("parentID"))
            endPoint += "/" + tmpConfiguration.query.parentID;

        if (tmpConfiguration.query.hasOwnProperty("resource"))
            endPoint += "/" + tmpConfiguration.query.resource;

        endPoint = configuration.id ? `${configuration.vizID}-${configuration.id}-${endPoint}` : endPoint;
        if (!tmpConfiguration.query.filter) {
            return endPoint;
        }

        return endPoint + "-" + tmpConfiguration.query.filter;
    }

    /**
     *  check and update query for next request if sum of totolCaptured (already fetched data count)
     *  and current data count (header.hits) is less than total count
     *  and increased page by 1 for next request.
     */
    getNextRequest = (header, query, pageSize) => {
        let nextQuery = {},
            nextPage = 0;

        if (((pageSize * (header.page + 1)) + header.hits) < header.count) {
            nextPage = parseInt(header.page, 10) + 1
            nextQuery = { ...query };

            nextQuery.query.nextPage = nextPage;
        }

        return { ...nextQuery, "length": header.count }
    }

    // TODO - refactor later by using existing service
    fetch = (configuration) => {

        const filter = configuration.query.filter || null,
            page = configuration.query.nextPage || 0,
            orderBy = configuration.query.sort || null,
            api = this.service.buildURL(this.getEntity(configuration.query), null, this.getParentEntity(configuration.query)),
            pageSize = configuration.query.pageSize || this.service.pageSize;

        return new Promise((resolve, reject) => {
            this.service.invokeRequest(
                'GET',
                api,
                this.service.computeHeaders(page, filter, orderBy, null, pageSize),
                undefined,
                true,
            ).then(response => {
                const header = {
                    page: response.headers['x-nuage-page'] || 0,
                    count: parseInt(response.headers['x-nuage-count'], 10) || 0,
                    hits: (response.data && response.data.length) || 0,
                }
                return resolve({
                    response: response.data || [],
                    nextQuery: this.getNextRequest(header, configuration, pageSize)
                })
            }
            ).catch(error => {
                getLogger().error(error.message || error);
                return reject(ERROR_MESSAGE);
            });
        });
    }

    // Add custom sorting into VSD query
    addSorting = (queryConfiguration, sort) => {
        if (!queryConfiguration)
            return null

        if (!sort || sort.order === '' || !sort.column)
            return queryConfiguration;

        queryConfiguration.query.sort = `${sort.column} ${sort.order}`
        return queryConfiguration;
    }

    // Add custom searching from searchbox into VSD query
    addSearching = (queryConfiguration, search = []) => {
        if (!queryConfiguration)
            return null;

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
