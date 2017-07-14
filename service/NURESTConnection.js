import NUObject from './NUObject';
import NUInterceptor from './NUInterceptor';

/*
  This class implements the HTTP actions invoked on the server
*/
const RESPONSE_PARAM = 'responseChoice';

export default class NURESTConnection extends NUObject {
    static HEADER_CONTENT_TYPE= 'Content-Type';
    static JSON_CONTENT_TYPE = 'application/json';

    /*
      Returns true if response body is in JSON format.
      Uses 'Content-Type' in response header for determinining this.
    */
    static isJSONResponse(response) {
        const contentType = response.headers.get(NURESTConnection.HEADER_CONTENT_TYPE);
        return (contentType && contentType.match(NURESTConnection.JSON_CONTENT_TYPE));
    }

    constructor(...args) {
        super(...args);

        this.defineProperties({
            onMultipleChoices: null,
            interceptor: new NUInterceptor(),
        });
    }

    /*
      Generic method for invoking HTTP/REST requests on the server
    */
    makeRequest(requestURL, verb, headers, body, choice) {
        let finalURL;

        if (choice !== undefined) {
            const tmpURL = new URL(requestURL);
            tmpURL.searchParams.set(RESPONSE_PARAM, choice);
            finalURL = tmpURL.href;
        } else {
            finalURL = requestURL;
        }

        return fetch(finalURL, { method: verb, body, headers })
            .then(response => Promise.all([
                response,
                (NURESTConnection.isJSONResponse(response)) ? response.json() : null,
            ]))
            .then(([response, data]) => {
                const respHeaders = {};
                const authFailure = !response.ok && response.status === 401;

                [...response.headers.entries()].forEach(([key, value]) => {
                    respHeaders[key] = value;
                });

                const result = ({ data, headers: respHeaders });
                result.authFailure = authFailure;

                if (response.status === 300 && this._onMultipleChoices) {
                    return this._onMultipleChoices(data)
                        .then((c) => {
                            // TODO: The server will ask confirmation again when responseChoice=0
                            // this needs to be fixed on the backend.
                            if (!c) return Promise.reject(result);
                            return this.makeRequest(requestURL, verb, headers, body, c);
                        });
                }

                if (response.ok) {
                    this.interceptor.success(result);
                    return result;
                } else if (authFailure) {
                    return result;
                }

                this.interceptor.fail(result);
                return Promise.reject(result);
            });
    }

    /*
      Invokes a GET request on the server
    */
    makeGETRequest(url, headers) {
        return this.makeRequest(url, 'GET', headers);
    }

    /*
      Invokes a PUT request on the server
    */
    makePUTRequest(url, headers, body) {
        return this.makeRequest(url, 'PUT', headers, body);
    }

    /*
      Invokes a POST request on the server
    */
    makePOSTRequest(url, headers, body) {
        return this.makeRequest(url, 'POST', headers, body);
    }

    /*
      Invokes a DELETE request on the server
    */
    makeDELETERequest(url, headers) {
        return this.makeRequest(url, 'DELETE', headers);
    }

    /*
      Invokes a HEAD request on the server
    */
    makeHEADRequest(url, headers) {
        return this.makeRequest(url, 'HEAD', headers);
    }

}
