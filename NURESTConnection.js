import NUObject from './NUObject';
import NUInterceptor from './NUInterceptor';
import { getLogger } from './Logger';
import { Enum } from 'enumify';
import axios from 'axios';

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

    static getErrors(error) {
        const { response, message } = error;
        if (!response) {
            getLogger().error(`<<<< Error response without status: ${message}`);
            return {
                data: message
            }
        }
        switch (response.status) {
            case 400:
            case 401:
            case 403:
            case 404:
            case 405:
            case 500:
            case 503:
                if (response && response.data && Array.isArray(response.data.errors)) {
                    return {data: response.data};
                }
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
                    data: response.data
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
                description: "You are either not allowed to access this resource or you used an incorrect password."
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
        get errors() {
            return {
                title: "Service Unavailable",
                description: "Service Unavailable. Please try after sometime"
            }
        }
    },
});


/*
  This class implements the HTTP actions invoked on the server
*/
const RESPONSE_PARAM = 'responseChoice';

const validateStatus = (status) => (status >= 200 && status <= 300);

export default class NURESTConnection extends NUObject {

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
    makeRequest({requestURL, verb, headers, body, choice, cancelToken}) {
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

        return axios({
            method: verb,
            url: finalURL,
            data: body,
            headers: headers,
            validateStatus,
            cancelToken
        }).then(response => {
            const { data } = response;
            getLogger().log(`<<<< Response for \n\n${verb} ${requestURL} (${response.status}):\n\n${NURESTConnection._stringyfyBody(data)}`);

            //handle response with choice
            if (response.status === 300 && this._onMultipleChoices) {
                return this._onMultipleChoices(response.data, requestURL)
                    .then(choice => this.makeRequest({requestURL, verb, headers, body, choice, cancelToken}));
            }

            const result = ({ data, headers: {...response.headers}, response });
            this.interceptor.success(result);
            return result;
        }).catch((error) => {
            if (axios.isCancel(error)) {
                // request was cancelled, possibly through the cancelToken
                getLogger().error(`<<<< Request canceled ${error.message}`);
                return Promise.reject(error);
            } else {
                // server returned with some sort of error response
                const {response} = error;
                const result = response ? {headers: {...response.headers}, response} : {};
                const errors = ResponseCodeEnum.getErrors(error);
                if (response) {
                    //handle error
                    if (response.status === 401) {
                        getLogger().error(`<<<< Authentication Failure: ${response.status}: ${response.statusText}`);
                        this.interceptor.onAuthenticationFailure({response, result, data: errors});
                        result.authFailure = true;
                        return Promise.reject({response, result, data: errors.data});
                    }
                }
                this.interceptor.fail({response, result, data: errors.data});
                return Promise.reject(result);
            }
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
    makeGETRequest(requestURL, headers, cancelToken) {
        return this.makeRequest({requestURL, verb: 'GET', headers, cancelToken});
    }

    /*
      Invokes a PUT request on the server
    */
    makePUTRequest(requestURL, headers, body, cancelToken) {
        return this.makeRequest({requestURL, verb: 'PUT', headers, body, cancelToken});
    }

    /*
      Invokes a POST request on the server
    */
    makePOSTRequest(requestURL, headers, body, cancelToken) {
        return this.makeRequest({requestURL, verb: 'POST', headers, body, cancelToken});
    }

    /*
      Invokes a DELETE request on the server
    */
    makeDELETERequest(requestURL, headers, cancelToken) {
        return this.makeRequest({requestURL, verb: 'DELETE', headers, cancelToken});
    }

    /*
      Invokes a HEAD request on the server
    */
    makeHEADRequest(requestURL, headers, cancelToken) {
        return this.makeRequest({requestURL, verb: 'HEAD', headers, cancelToken});
    }

    /*
      Invokes a PATCH request on the server
    */
    makePATCHRequest(requestURL, headers, body, cancelToken) {
        return this.makeRequest({requestURL, verb: 'PATCH', headers, body, cancelToken});
    }
}
