/*
  This class implements mock functions that simulate HTTP actions invoked on the server
*/

export default class NURESTConnection {

    makeRequest(URL, verb, headers, body) {
        const response = {};
        const responseHeaders = {};
        headers.forEach((value, key) => {
            if (key) {
                responseHeaders[key.toLowerCase()] = value;
            }
        });
        responseHeaders.count = 10;

        if (URL !== null && verb !== null) {
            if (headers !== null) {
                switch (verb) {
                    case 'GET': {
                        const page = headers.get('Page');
                        response.data = this.getResponseForGET(URL, page);
                        if (page === '3') {
                            responseHeaders.count = 20;
                        }
                        break;
                    }
                    case 'PUT':
                        if (body !== null) {
                            response.data = '';
                        }
                        break;
                    case 'POST':
                        response.data = [{
                            ID: JSON.parse(body).ID,
                            ATTR1: 'AC00EMP789',
                            attr2: '1481113336000',
                        }];
                        break;
                    case 'DELETE':
                        response.data = '';
                        break;
                    case 'HEAD':
                        responseHeaders.count = 30;
                        break;
                    default:
                        throw new Error(`Invalid request, unsupported verb: ${verb}`);
                }
                response.headers = responseHeaders;
            }
            return new Promise((resolve) => {
                resolve(response);
            });
        }

        throw new Error('Invalid request, URL and/or verb missing');
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

    makeHEADRequest(url, headers) {
        return this.makeRequest(url, 'HEAD', headers);
    }

    getResponseForGET(url, page) {
        let response = null;
        // may have to update this style of code which is based on count of '/'
        switch ((url.match(/\//g) || []).length) {
            case 6:
                if (url.endsWith('/me')) {
                    response = [{
                        attr1: 'abcd',
                        ATTR2: 'efgh',
                        APIKey: '396bbbe7-3aae-424a-9d4b-5d2202ce6a4c',
                    }];
                }
                break;

            case 8:
                response = (page !== '3') ? [
                    { ID: 'xyz123', ATTR1: 'AC0098765', attr2: '1485301116000' },
                    { ID: 'xyz456', ATTR1: 'AC0098766', attr2: '1485302226000' },
                    { ID: 'xyz789', ATTR1: 'AC0098767', attr2: '1485303336000' },
                ] : [
                    { ID: 'aab111', ATTR1: 'AAB098111', attr2: '1485301116111' },
                    { ID: 'aac222', ATTR1: 'AAC098222', attr2: '1485302226222' },
                    { ID: 'aad333', ATTR1: 'AAC098333', attr2: '1485303336333' },
                ];
                break;
            default:
                response = [{ ID: 'def123', ATTR1: 'AC0098777', attr2: '1485301116777' }];
        }
        return response;
    }
}
