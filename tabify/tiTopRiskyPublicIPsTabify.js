import isEmpty from "lodash/isEmpty";
import union from "lodash/union";

/*
 *Returns the top risky public IPs coming from source and destination IPs by flows aggregations
 */
export default class TiTopRiskyPublicIPsTabify {
    
    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const result = aggregations.srcPublicIPs && aggregations.srcPublicIPs.buckets 
                ? aggregations.srcPublicIPs.buckets.map(item => { 
                    return {
                        publicIP: item.key,
                        CardinalityOf: item.CardinalityOf.value,
                        flowIds: item.flowIds.buckets ? item.flowIds.buckets.map((flowId) => flowId.key) : []
                    }
                }) : [];
            const dstPublicIPs = aggregations.dstPublicIPs && aggregations.dstPublicIPs.buckets 
                ? aggregations.dstPublicIPs.buckets.map(item => { 
                    return {
                        publicIP: item.key,
                        CardinalityOf: item.CardinalityOf.value,
                        flowIds: item.flowIds.buckets ? item.flowIds.buckets.map((flowId) => flowId.key) : []
                    }
                }) : [];

            if (!isEmpty(dstPublicIPs)) {
                dstPublicIPs.forEach((dstPublicIPsItem) => {
                    const resultItem = result.find(item => item.publicIP === dstPublicIPsItem.publicIP);
                    if (resultItem) {
                        const uniqueFlowIds = union(resultItem.flowIds, dstPublicIPsItem.flowIds);
                        resultItem.flowIds = uniqueFlowIds;
                        resultItem.CardinalityOf = uniqueFlowIds.length;
                    } else {
                        result.push({...dstPublicIPsItem});
                    }
                });
            }
            return result;
        }
        return [];
    }
}
