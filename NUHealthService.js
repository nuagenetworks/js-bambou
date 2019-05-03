import NUService from './NUService';

export default class NUHealthService extends NUService {
    constructor(props) {
        super(props);
        const { rootURLObj } = props;
        this.RESTResource = rootURLObj && rootURLObj.RESTResource ? rootURLObj.RESTResource : 'health';
        this.rootURL = `${this.protocol}://${this.hostname}${this.port ? ':' + this.port : ''}/${this.RESTRoot}/${this.RESTResource}`;
    }
    
    /*
    *  Fetch health status.
    *  component: name of the server component whose status is requested
    */
    fetch = (component, cancelToken) => {
        const healthURL = `${this.rootURL}/?proxyRequest=false`;
        const requestURL = component ? `${healthURL}&component=${component}` : healthURL;
        return this.invokeRequest({verb: 'GET', requestURL, cancelToken}).then((response) => {
            return response.data[0];
        });
    }
}
