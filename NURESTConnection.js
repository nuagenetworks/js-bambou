import NUObject from './NUObject';
import NUInterceptor from './NUInterceptor';
import { getLogger } from './Logger';

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
            RESTConnectionTimeout: 0,
            RESTConnectionLastActionTimer: null,
            ignoreRequestIdle: false,
        });
    }

    static _stringyfyBody = (body) => {
        if (!body) {
            return "";
        }
        try {
            const string = typeof body === 'string' ? JSON.parse(body) : body;
            return JSON.stringify(string, null, 4);
        }
        catch (e) {
            return body;
        }
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
        if (!this.ignoreRequestIdle) {
            this._resetIdleTimeout();
        }

        getLogger().log(`>>>> Sending\n\n${verb} ${requestURL}:\n\n${NURESTConnection._stringyfyBody(body)}`);

        return fetch(finalURL, { method: verb, body, headers })
            .then(response => Promise.all([
                response,
                (NURESTConnection.isJSONResponse(response)) ? response.json() : null,
            ]))
            .then(([response, data]) => {
                getLogger().log(`<<<< Response for \n\n${verb} ${requestURL} (${response.status}):\n\n${NURESTConnection._stringyfyBody(data)}`);
                const respHeaders = {};
                const authFailure = !response.ok && response.status === 401;

                [...response.headers.entries()].forEach(([key, value]) => {
                    respHeaders[key] = value;
                });

                const result = ({ data, headers: respHeaders, response });
                result.authFailure = authFailure;

                if (response.status === 300 && this._onMultipleChoices) {
                    return this._onMultipleChoices(data)
                        .then(c => this.makeRequest(requestURL, verb, headers, body, c));
                }

                if (response.ok) {
                    this.interceptor.success(result);
                    return result;
                } else if (authFailure) {
                    getLogger().error(`<<<< Authentication Failure: ${response.status}: ${response.statusText}`);
                    this.interceptor.fail(`${response.status}: ${response.statusText}`);
                    return Promise.reject(result);
                } else if (response.status === 403) {
                    getLogger().error(`<<<< Authentication Failure: ${response.status}`);
                    this.interceptor.onAuthenticationFailure({response, result});
                    return result;
                }

                this.interceptor.fail(result);
                return Promise.reject(result);
            });
    }
    /*
      Allow connection to the server to timeout
    */
    _resetIdleTimeout() {
        if (this.RESTConnectionLastActionTimer) {
            clearTimeout(this.RESTConnectionLastActionTimer);
        }

        if (!this.RESTConnectionTimeout) {
            return;
        }

        const interceptor = this.interceptor;
        const timeout = this.RESTConnectionTimeout;
        this.RESTConnectionLastActionTimer = setTimeout(() => {
            if (!timeout) {
                return;
            }
            interceptor.onTimeout();
        }, timeout);
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
