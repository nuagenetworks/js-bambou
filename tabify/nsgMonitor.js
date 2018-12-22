export default (response)  => {
    if (Array.isArray(response)) {
        return response.map( item => {
            const vrsInfo = item.vrsinfo;
            const nsgInfo = item.nsginfo;
            const nsgState = item.nsgstate;
            const nsgsummary = item.nsgsummary;

            return {
                name: nsgsummary.gatewayName,
                location: nsgsummary.address,
                serialNumber: nsgInfo.serialNumber,
                model: nsgInfo.family,
                softwareVersion: nsgsummary.NSGVersion,
                state: nsgState.status,
                vscIPs: '',
                address: vrsInfo.address,
                managementIP: vrsInfo.managementIP
            };
        })
    }
}