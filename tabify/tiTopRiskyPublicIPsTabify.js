import isEmpty from "lodash/isEmpty";

/*
 *Returns the top risky public IPs coming from source and destination IPs by flows aggregations
 */
export default class TiTopRiskyPublicIPsTabify {
    
    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const result = aggregations.srcPublicIPs && aggregations.srcPublicIPs.buckets 
                ? aggregations.srcPublicIPs.buckets.map(item => { return {publicIP: item.key, CardinalityOf: item.CardinalityOf.value} }) : [];
            const dstPublicIPs = aggregations.dstPublicIPs && aggregations.dstPublicIPs.buckets 
                ? aggregations.dstPublicIPs.buckets.map(item => { return {publicIP: item.key, CardinalityOf: item.CardinalityOf.value} }) : [];
            if (!isEmpty(dstPublicIPs)) {
                dstPublicIPs.forEach((dstPublicIPsItem) => {
                    const resultItem = result.find(item => item.publicIP === dstPublicIPsItem.publicIP);
                    if (resultItem) {
                        resultItem.CardinalityOf += dstPublicIPsItem.CardinalityOf
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
