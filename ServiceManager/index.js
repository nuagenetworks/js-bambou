import ElasticSearchService from '../elasticsearch/ESService';

/*
    Stores all services.
*/
let services = {
    elasticsearch: new ElasticSearchService(),
    //VSD: VSDService,
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

export default {
    register: register,
    getService: getService,
    getRequestID: getRequestID,
}
