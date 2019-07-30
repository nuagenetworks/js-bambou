import elasticsearch from 'elasticsearch';
import _ from 'lodash';

import NUObject from '../NUObject';
import { SCROLL_TIME } from './ESService';
import objectPath from 'object-path';

/*
  This class implements the HTTP actions invoked on the server
*/
export default class ESRESTConnection extends NUObject {

    constructor(host = null) {
        super();

        this.defineProperties({
            log: 'trace',
            apiVersion: 'master',
            host: host || process.env.REACT_APP_ELASTICSEARCH_HOST || 'http://localhost:9200',
            client: null,
            isConnected: false
        });

        this.setClient();
    }

    ping() {
        if (!this.getClient()) {
            this.setClient();
        }

        return new Promise((resolve, reject) => {
            this.client.ping({
                // ping usually has a 3000ms timeout
                requestTimeout: 3000,
            }, (error) => {
                if (error) {
                    reject();
                } else {
                    resolve();
                }
            });
        });
    }

    setClient() {
        this.client = new elasticsearch.Client({
            log: this.log,
            apiVersion: this.apiVersion,
            host: this.host
        });
    }

    getClient() {
        return this.client;
    }

    makeRequest(query, scroll = false) {

        if (!this.getClient()) {
            return Promise.reject('Unable to connect to ElasticSearch server');
        }

        // check query to execute is empty or not.
        if (_.isEmpty(query)) {
            return Promise.reject('Invalid query');
        }

        //if data comes from scroll (if `scroll: true` in query config)
        if (query && query.scroll_id) {
            return this.getScrollData(query);
        }

        return this.getSearchData(query, scroll);
    }


    //get scroll data from ES
    getScrollData(query) {
        return this.client.scroll(query);
    }

    // get search data from ES
    getSearchData(query, scroll) {
        const updatedQuery = scroll ? { ...query, scroll: SCROLL_TIME } : query;
        return this.client.search(updatedQuery);
    }

    async getMapping(query){
        const index = objectPath.get(query,['query', 'index']);
        const mapping = await this.client.indices.getMapping({index: index});
        return this.getESColumns(objectPath.get(mapping, [index, 'mappings', 'nuage_doc_type','properties'])) || [];
    }

    getESColumns(data, parentKey = null, columns = []) {
        if (parentKey !== null && data[0] !== "nested") {
            data = data[0];
        } else if (data[0] === "nested") {
            data = data[1];
        }

        Object.entries(data).forEach(([key, val]) => {
            if (objectPath.has(val, 'properties')) {
                this.getESColumns(Object.values(val), parentKey ? `${parentKey}.${key}` : key, columns);
            } else {
                if (parentKey === null) {
                    columns.push(key);
                } else {
                    columns.push(`${parentKey}.${key}`);
                }
            }
        });
        return columns;
    }
}
