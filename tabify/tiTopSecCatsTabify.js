import isEmpty from "lodash/isEmpty";

/*
 *Returns the top risky public IPs coming from source and destination IPs by flows aggregations
 */
export default class TiTopSecCatsTabify {
    
    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const result = aggregations.srcIpCats && aggregations.srcIpCats.buckets 
                ? aggregations.srcIpCats.buckets.map(item => { return {secCats: item.key, CardinalityOf: item.CardinalityOf.value} }) : [];
            const dstIpCats = aggregations.dstIpCats && aggregations.dstIpCats.buckets 
                ? aggregations.dstIpCats.buckets.map(item => { return {secCats: item.key, CardinalityOf: item.CardinalityOf.value} }) : [];
            if (!isEmpty(dstIpCats)) {
                dstIpCats.forEach((dstIpCatsItem) => {
                    const resultItem = result.find(item => item.publicIP === dstIpCatsItem.publicIP);
                    if (resultItem) {
                        resultItem.CardinalityOf += dstIpCatsItem.CardinalityOf
                    } else {
                        result.push({...dstIpCatsItem});
                    }
                });
            }
            return result;
        }
        return [];
    }
}
