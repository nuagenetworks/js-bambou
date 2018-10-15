import ElasticSearchService from '../elasticsearch/ESService';
import VSDService from '../VSDService';

/*
    Stores all services.
*/
const services = {
    elasticsearch: new ElasticSearchService(),
    VSD: new VSDService(),
};

/*
    Registers a new service to a service name
*/
const register = (service, serviceName) => (
    services[serviceName] = service
)

/*
    Get the service registered for the given name
*/
const getService = (serviceName) => {
    if (!(serviceName in services))
        throw new Error("No service named " + serviceName + " has been registered yet!");

    return services[serviceName];
}

/*
    Get the query ID for the given configuration and the given context

    Arguments:
    * configuration: The query configuration
    * context: the context if the query configuration should be parameterized

    Returns:
    A unique string that represents the request ID
*/
const getRequestID = (configuration, context) => {

    // TODO: Temporary - Replace this part in the middleware
    // Note: It should actually be its own service !
    if (!configuration)
        return;

    try {
        const service = getService(configuration.service)
        return service.getRequestID(configuration, context)
    } catch (error) {
        return
    }
}

const addSorting = function (queryConfiguration, sort) {

    if(!queryConfiguration)
        return null

    if(!sort || sort.order === '')
        return queryConfiguration;

    try {
        const service = getService(queryConfiguration.service);
        return service.addSorting(queryConfiguration, sort);
    } catch (error) {
        return queryConfiguration;
    }
}


const addSearching = function (queryConfiguration, search) {

    if(!queryConfiguration)
        return null;

    if(!search)
        return queryConfiguration;

    try {
        const service = getService(queryConfiguration.service);
        return service.addSearching(queryConfiguration, search);
    } catch (error) {
        return queryConfiguration;
    }
}

export default {
    register,
    getService,
    getRequestID,
    addSearching,
    addSorting
}
