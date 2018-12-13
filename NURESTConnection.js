import NUObject from './NUObject';
import NUInterceptor from './NUInterceptor';
import { getLogger } from './Logger';
import { Enum } from 'enumify';

class ResponseCodeEnum extends Enum {
    static getClassName() {
        return 'ResponseCodeEnum';
    }

    static getEnumForCode (code) {
        return ResponseCodeEnum.enumValues.filter( item => item.code === code);
    }

    getClassName() {
        return ResponseCodeEnum.getClassName();
    }

    static getErrors(result) {
        const { response } = result;
        switch (response.status) {
            case 400:
            case 401:
            case 403:
            case 404:
            case 405:
            case 500:
                const item = ResponseCodeEnum.getEnumForCode(response.status);
                if (item && item.length) {
                    const descriptions = [item[0].errors];
                    return {
                        data: {
                            errors: [{
                                descriptions
                            }]
                        }
                    };
                }
                return response.statusText;
            default:
                return {
                    data: result.data
                }
        }
    }
}

ResponseCodeEnum.initEnum({
    Unauthorized: {
        get code() { return 401; },
        get errors() {
            return {
                title: "Permission denied",
                description: "You are not allowed to access this resource."
            }
        }
    },
    PermissionDenied: {
        get code() { return 403; },
        get errors() {
            return {
                title: "Permission denied",
                description: "You are not allowed to access this resource."
            }
        }
    },
    NotFound: {
        get code() {
            return 404;
        },
        get errors() {
            return {
                title: "Not Found",
                description: "Requested URL is not found or server might not be reachable."
            }
        },
    },
    MethodNotAllowed: {
        get code () { return 405; },
        get errors() { return {}; }
    },
    PreconditionFailed: {
        get code() { return 412; },
        get errors() { return {}; }
    },
    BadRequest: {
        get code() { return 400; },
        get errors() {
            return {
                title: "Bad Request",
                description: "This API call cannot be processed by the server. Please report this to the UI team"
            }
        }
    },
    CodeConflict: {
        get code() { return 409; },
        get errors() { return {}; }
    },
    InternalServerError: {
        get code() { return 500; },
        get errors() {
            return {
                title: "Internal Server Error",
                description: "Please check the log and report this error to the server team"
            }
        }
    },
    ServiceUnavailable: {
        get code() { return 503; },
        get errors() { return {}; }
    },
});


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
            isConnected: false
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
                //handle response with choice
                if (response.status === 300 && this._onMultipleChoices) {
                    return this._onMultipleChoices(data, requestURL)
                        .then(c => this.makeRequest(requestURL, verb, headers, body, c));
                }

                const respHeaders = {};
                [...response.headers.entries()].forEach(([key, value]) => {
                    respHeaders[key] = value;
                });

                const result = ({ data, headers: respHeaders, response });

                if (response.ok) {
                    this.interceptor.success(result);
                    return result;
                }
                // server returned with some sort of error response
                const errors = ResponseCodeEnum.getErrors(result);
                const authFailure = !response.ok && response.status === 401;

                if (authFailure) {
                    getLogger().error(`<<<< Authentication Failure: ${response.status}: ${response.statusText}`);
                    this.interceptor.onAuthenticationFailure({data: errors.data});
                    result.authFailure = authFailure;
                    return Promise.reject({response, result, data: errors.data});
                }

                this.interceptor.fail({data: errors.data});
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
