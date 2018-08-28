import elasticsearch from 'elasticsearch';
import _ from 'lodash';

import NUObject from '../NUObject';

/*
  This class implements the HTTP actions invoked on the server
*/
export default class ESRESTConnection extends NUObject {

    constructor(host = null) {
        super();

        this.defineProperties({
            log: 'trace',
            apiVersion: '2.2',
            host: host || process.env.REACT_APP_ELASTICSEARCH_HOST || 'http://localhost:9200',
            client: null
        });

        this.setClient()
    }

    setClient() {
        this.client = new elasticsearch.Client({
            log: this.log,
            apiVersion: this.apiVersion,
            host: this.host
        });
    }

    getClient() {
        if (!this.client) {
            this.setClient();

            this.client.ping({
                // ping usually has a 3000ms timeout
                requestTimeout: Infinity,
            }, (error) => {
                if (error) {
                    return null;
                }
            });
        }

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
        if (query && query.nextPage) {
            return this.getScrollData(query.nextPage);
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
}
