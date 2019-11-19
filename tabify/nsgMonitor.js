const millsToDaysHoursMin = mills => {
    const seconds = mills ? mills / 1000 : 0;
    const numDays = Math.floor((seconds % 31536000) / 86400);
    const numHours = Math.floor(((seconds % 31536000) % 86400) / 3600);
    const numMinutes = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
    let string = "";

    if (numDays)
        string = `${numDays} ${numDays > 1 ? " days " : " day "}`

    if (numHours)
        string = `${string}${numHours} ${numHours > 1 ? " hours " : " hour "}`;

    if (numMinutes)
        string = `${string}${numMinutes} min`;

    if (!string.length)
        string = "0 min";

    return string;
}

export default (response)  => {
    if (Array.isArray(response)) {
        return response.map( item => {
            const vrsInfo = item.vrsinfo || {};
            const nsgInfo = item.nsginfo || {};
            const nsgState = item.nsgstate || {};
            const nsgsummary = item.nsgsummary || {};
            const vscs = item.vscs;

            const controllervrslinks = item.controllervrslinks;
            const vscLinks = [];
            if (controllervrslinks && controllervrslinks.length) {
                for (let link of controllervrslinks) {
                    if (link.controllerType === 'VSC') {
                        const vscObj = {connections: link.connections, controllerID: link.controllerID};
                        const vsc = vscs && vscs.length && vscs.find( item => item.ID === link.controllerID);
                        if (vsc) {
                            vscObj.addresses = Array.isArray(vsc.addresses) && vsc.addresses.length ? vsc.addresses.join(',\n') : '';
                            vscObj.managementIP = vsc.managementIP;
                        }
                        vscLinks.push(vscObj);
                    }

                }
            }

            return {
                name: nsgsummary.gatewayName,
                location: nsgsummary.address,
                serialNumber: nsgInfo.serialNumber,
                model: nsgInfo.family,
                softwareVersion: nsgsummary.NSGVersion,
                state: nsgState.status,
                vrsUptime: millsToDaysHoursMin(vrsInfo.uptime),
                vscs: vscLinks
            };
        })
    }
}
