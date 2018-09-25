import NUService from 'service/NUService';
import NURESTUser from 'service/NURESTUser';
import NUTemplateParser from "../NUTemplateParser";

const ERROR_MESSAGE = `No VSD API endpoint specified`;

export default class VSDService extends NUService {

    constructor() {
        const url = localStorage.getItem('rootURL');
        super(url);
    
        this.url = url;
        this.APIKey = localStorage.getItem('API_KEY');
        this.organization = localStorage.getItem('ORGANIZATION');
        this.userJson = localStorage.getItem('USER_JSON');
    }

    buildURL = (configuration) => {

        let url = configuration.parentResource;

        if (configuration.hasOwnProperty("parentID"))
            url += "/" + configuration.parentID;

        if (configuration.hasOwnProperty("resource"))
            url += "/" + configuration.resource;

        return url;
    }

    getRequestID = (configuration, context = {}) => {
        const tmpConfiguration = NUTemplateParser.parameterizedConfiguration(configuration, context);
        if (!tmpConfiguration)
            return;
        let URL = this.buildURL(tmpConfiguration.query);

        URL = configuration.id ? `${configuration.vizID}-${configuration.id}-${URL}` : URL;
        if (!tmpConfiguration.query.filter)
            return URL;

        return URL + "-" + tmpConfiguration.query.filter;
    }

    // TODO - refactor later by using existing service
    fetch = (configuration, scroll = false) => {

        if (!this.APIKey || !this.userJson || !this.organization) {
            return Promise.reject(ERROR_MESSAGE);
        }

        const user = new NURESTUser().buildFromJSON(JSON.parse(this.userJson));
        if(user) {
            this.userName = user.userName;
        }

        this.addCustomHeader('X-Nuage-Organization', this.organization);

        const filter = configuration.filter || null,
            page = (configuration && configuration.nextPage) || 0,
            orderBy = configuration.sort || null,
            api = `${this.url}/${this.buildURL(configuration)}`;

        return new Promise((resolve, reject) => {
            this.invokeRequest(
                'GET',
                api,
                this.computeHeaders(page, filter, orderBy),
                undefined,
                true,
            ).then(response => resolve({
                response: response.data,
            })
            ).catch(error => reject(error));
        });
    }
}
