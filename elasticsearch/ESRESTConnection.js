import elasticsearch from 'elasticsearch';

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
        }

        return this.client;
    }
}
