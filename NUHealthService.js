import NUService from './NUService';

export default class NUHealthService extends NUService {
    constructor(rootURL, headers, URL) {
        super(rootURL, headers);
        this.RESTResource = URL && URL.RESTResource ? URL.RESTResource : '/health';
    }
    
    /*
    *  Fetch health status.
    *  component: name of the server component whose status is requested
    */
    fetch = (component) => {
        const healthURL = `${this.protocol}://${this.hostname}:${this.port}${this.RESTRoot}${this.RESTResource}/?proxyRequest=false`;
        const url = component ? `${healthURL}&component=${component}` : healthURL;
        return this.invokeRequest('GET', url).then((response) => {
            return response.data[0];
        });
    }
}
