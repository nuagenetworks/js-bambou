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
            const vrsInfo = item.vrsinfo;
            const nsgInfo = item.nsginfo;
            const nsgState = item.nsgstate;
            const nsgsummary = item.nsgsummary;
            const vscs = item.vscs;
            let vscIPs;
            if (vscs && vscs.length) {
                vscIPs = vscs.reduce((ips, currVal) => {
                    if (currVal.addresses && currVal.addresses.length) {
                        ips.push(...currVal.addresses);
                    }
                    return ips;
                }, [])
            }

            return {
                name: nsgsummary.gatewayName,
                location: nsgsummary.address,
                serialNumber: nsgInfo.serialNumber,
                model: nsgInfo.family,
                softwareVersion: nsgsummary.NSGVersion,
                state: nsgState.status,
                vscIPs: vscIPs ? vscIPs.join('\n') : '',
                vrsUptime: millsToDaysHoursMin(vrsInfo.uptime),
                address: vrsInfo.address,
                managementIP: vrsInfo.managementIP,
                JSONRPCConnectionState: vrsInfo.JSONRPCConnectionState || 'Unknown'
            };
        })
    }
}