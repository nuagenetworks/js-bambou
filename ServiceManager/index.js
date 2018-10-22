/*
    Stores all services.
*/
const services = {
    elasticsearch: 'ESService',
    VSD: 'VSDService'
};
/*
    Get the service registered for the given name
*/
const getService = (serviceName, serviceList = {} ) => {
    if (!(serviceName in services))
        throw new Error("No service named " + serviceName + " has been registered yet!");

    const service = services[serviceName];
    return serviceList[service];
}

export default {
    getService
}
