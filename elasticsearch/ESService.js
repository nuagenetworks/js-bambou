import * as tabification from '../tabify';
import objectPath from 'object-path';

import ESRESTConnection from './ESRESTConnection';
import ESTabify from './ESTabify';
import { getLogger } from '../Logger';
import NUTemplateParser from "../NUTemplateParser";
import { ESSearchConvertor } from 'vis-graphs/utils/helpers';
import { SCROLL_TIME } from './ESRESTConnection';

const ERROR_MESSAGE = 'Unable to fetch data';

const NO_DATA_FOR_SORT_ERROR = '[query_shard_exception] No mapping found for [timestamp] in order to sort on';
export default class ESService {
    constructor(host = null) {
        this._connection = new ESRESTConnection(host);
    }

    fetch = (configuration) => {
        try {
            let connection;
            if (!configuration.enabledCount) {
                connection = this._connection.makeRequest(configuration.query, configuration.scroll);
            } else {
                connection = this._connection.getCount(configuration.query);
            }
            return connection.then(response => Promise.resolve(this.parseResponse(response, configuration.tabifyOptions, configuration)))
                .catch(error => {

                    if(error.message.includes(NO_DATA_FOR_SORT_ERROR)){
                        return Promise.resolve(this.parseResponse([], configuration.tabifyOptions, configuration))
                    }
                    if (!error.body) {
                        return Promise.reject(error);
                    } else {
                        getLogger().error(error.body.error.reason + ": " + error.body.error["resource.id"])
                        return Promise.reject(ERROR_MESSAGE);
                    }
                });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    getTabify = (queryConfiguration) => {
        if (queryConfiguration) {
            const customTabify = objectPath.get(queryConfiguration, 'tabify');
            if (customTabify) {
                return new tabification[customTabify]();
            }
        }
        return new ESTabify();
    }

    // process response for scroll & search response
    parseResponse = (response = {}, tabifyOptions = {}, queryConfiguration = {}) => {
        const tabify = this.getTabify(queryConfiguration);
        let results = null;
        // if scrolling is enabled then update next query for fetching data via scrolling
        if (response.hits && response.hits.hits.length && response._scroll_id) {
            results = {
                response: tabify.process(response, tabifyOptions, queryConfiguration),
                nextPage: {
                    scroll_id: response._scroll_id,
                },
                length: response.hits.total
            };

        } else {
            results = {
                response: tabify.process(response, tabifyOptions, queryConfiguration),
            };
        }

        return results;
    }

    getRequestID = (configuration, context = {}) => {
        const tmpConfiguration = NUTemplateParser.parameterizedConfiguration(configuration, context);

        if (!tmpConfiguration)
            return;

        const parameters = NUTemplateParser.getUsedParameters(configuration, context);

        if (Object.keys(parameters).length === 0)
            return configuration.id;

        return `${configuration.vizID}-${configuration.id}[${JSON.stringify(parameters)}]`;

    }

    tabify = (data, tabifyOptions = {}, queryConfiguration = {}) => {
        const tabify = new ESTabify();
        return tabify.process(data, tabifyOptions, queryConfiguration);
    }

    // Add custom sorting into ES query
    addSorting = (queryConfiguration, sort) => {

        if (!queryConfiguration)
            return null

        if (!sort || sort.order === '')
            return queryConfiguration;

        queryConfiguration.query.body.sort = {
            [sort.column]: {
                order: sort.order
            }
        };

        return queryConfiguration;
    }

    // Add custom searching from searchbox into ES query
    addSearching = (queryConfiguration, search) => {

        if (!queryConfiguration)
            return null;

        if (!search)
            return queryConfiguration;

        if (search.length) {
            if (objectPath.has(queryConfiguration, 'query.body.query.bool.should')) {
                const allShould = objectPath.get(queryConfiguration, 'query.body.query.bool.should');
                if (Array.isArray(allShould)) {
                    allShould.map(item => {
                        objectPath.push(item, 'bool.must', ESSearchConvertor(search))
                    })
                } else {
                    objectPath.push(queryConfiguration, 'query.body.query.bool.should', ESSearchConvertor(search))
                }
            } else {
                objectPath.push(queryConfiguration, 'query.body.query.bool.must', ESSearchConvertor(search));
            }
        }

        return queryConfiguration;
    }

    getPageSizePath = () =>  'query.body.size';

    updatePageSize = (queryConfiguration, pageSize) => {
        objectPath.set(queryConfiguration, this.getPageSizePath(), pageSize);
        return queryConfiguration;
    }

    getNextPageQuery = (queryConfiguration, nextPage = {}) => {
        return Object.assign(queryConfiguration, {
            query: {
                scroll: SCROLL_TIME,
                scroll_id: nextPage.scroll_id
            }
        })
    }

    ping = () => this._connection.ping();

    isConnected = () => this._connection._isConnected;

    getESColumnList = (queryIndex) => this._connection.getMapping(queryIndex);
}
