const capitalizeFirstLetter = (input) => {
    if (typeof input !== 'string') return '';
    return input.charAt(0).toUpperCase() + input.slice(1).toLowerCase();
}

export default (response)  => {
    if (Array.isArray(response)) {
        const ports = response.reduce((allPorts, item) => {
            const monitoringPorts = item.monitoringPorts || [];
            const wirelessPorts = item.wirelessPorts;
            const configuredPorts = (item.ports && item.ports.reduce((acc, currVal) => {
                const portInfo = monitoringPorts.find(port => port.name === currVal.physicalName) || {state: 'Unknown'};
                const port = {
                    ...currVal,
                    type: capitalizeFirstLetter(currVal.portType),
                    ...portInfo
                }
                acc.push(port);
                return acc;
            }, [])) || [];
            allPorts.push(...configuredPorts);
            if (Array.isArray(wirelessPorts) && wirelessPorts.length) {
                for (let wifiPort of wirelessPorts) {
                    const portInfo = monitoringPorts.find(port => port.name === wifiPort.physicalName) || {state: 'UP'};
                    allPorts.push ({...wifiPort, type: 'Wireless', ...portInfo});
                }
            }
            return allPorts;
        }, []);
        return ports.sort((first, second) => first.type === second.type ? 0 : first.type === 'Network' ? -1 : 1 );
    }
}