import ESRESTConnection from './ESRESTConnection';
import ESTabify from './ESTabify';
import { getLogger } from '../Logger';

const ERROR_MESSAGE = 'unable to fetch data.'
const SCROLL_TIME = '3m';

export default class ESService {

    constructor() {
        this._connection = new ESRESTConnection();
    }

    fetch(query, scroll = false) {
        try {
            const client = this._connection.getClient();

            if (!client) {
                return Promise.reject('Unable to connect to ElasticSearch server');
            }

            return new Promise((resolve, reject) => {
                let esRequest;

                //if data comes from scroll (if `scroll: true` in query config)
                if (query && query.nextPage) {
                    esRequest = this.getScrollData({ client, query: query.nextPage })
                } else {
                    esRequest = this.getSearchData({ client, query, scroll })
                }

                esRequest
                    .then(response => resolve(this.parseResponse(response)))
                    .catch(error => {
                        if (!error.body) {
                            reject("Unable to connect to ElasticSearch datastore. Please check to ensure ElasticSearch datastore can be reached");
                        } else {
                            getLogger().error(error.body.error.reason + ": " + error.body.error["resource.id"])
                            reject(ERROR_MESSAGE);
                        }
                    });
            });
        } catch (error) {
            return Promise.reject(error);
        }
    }

    //get scroll data from ES
    getScrollData({ client, query }) {
        return client.scroll(query);
    }

    // get search data from ES
    getSearchData({ client, query, scroll = false }) {
        const updatedQuery = scroll ? { ...query, scroll: SCROLL_TIME } : query;
        return client.search(updatedQuery);
    }

    // process response for scroll & search response
    parseResponse(response = {}) {
        const tabify = new ESTabify();
        let results = null;

        // if scrolling is enabled then update next query for fetching data via scrolling
        if (response.hits.hits.length && response._scroll_id) {
            results = {
                response: tabify.process(response), 
                nextPage: {
                    scroll: SCROLL_TIME,
                    scroll_id: response._scroll_id,
                },
                length: response.hits.total
            };

        } else {
            results = {
                response: tabify.process(response),
            };
        }

        return results;
    }
}
