export default (response) => {
	/**
	* [
  {
    "numberOfOccurances": 4,
    "title": "Underlay Test Degraded",
    "systemID": "146.31.164.73",
    "description": "[SystemID:146.31.164.73] NSG:ovs-2(SystemID:146.31.164.73) - Underlay Test returned a DEGRADED status.",
    "severity": "MAJOR",
    "errorCondition": 70017,
    "alarmedObjectID": "199d22f0-cb0b-11ec-b639-3b97ea120875",
    "remedy": "Check the underlay test report for further details.",
  }
]
	*/

    if(Array.isArray(response) && response.length) {

        response.forEach(data => {
            let newDescription = data.description;
            if(newDescription.includes(`NSG ${data.alarmedObjectID}`)) {
                const index = newDescription.indexOf(`NSG ${data.alarmedObjectID}`);
                newDescription = newDescription.substring(index).replace(` ${data.alarmedObjectID}`, '');
            }

            if(newDescription.includes(`SystemID:${data.systemID}`)) {
                const index = newDescription.lastIndexOf(`SystemID:${data.systemID}`);
                newDescription = newDescription.substring(index).replace(`SystemID:${data.systemID}`, '').replace(') -', '').replace('] ', '');
            }
            data.description = newDescription
        })
    }
	return response;
}
