import isEmpty from "lodash/isEmpty";
import union from "lodash/union";

/*
 *Returns the top security categories coming from source and destination IP Categories by flows aggregations
 */
export default class TiTopSecCatsTabify {
    
    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const result = aggregations.srcIpCats && aggregations.srcIpCats.buckets 
                ? aggregations.srcIpCats.buckets.map(item => { 
                    return {
                        secCats: item.key,
                        CardinalityOf: item.CardinalityOf.value,
                        flowIds: item.flowIds.buckets ? item.flowIds.buckets.map((flowId) => flowId.key) : []
                    }
                }) : [];
            const dstIpCats = aggregations.dstIpCats && aggregations.dstIpCats.buckets 
                ? aggregations.dstIpCats.buckets.map(item => { 
                    return {
                        secCats: item.key,
                        CardinalityOf: item.CardinalityOf.value,
                        flowIds: item.flowIds.buckets ? item.flowIds.buckets.map((flowId) => flowId.key) : []
                    }
                }) : [];

            if (!isEmpty(dstIpCats)) {
                dstIpCats.forEach((dstIpCatsItem) => {
                    const resultItem = result.find(item => item.secCats === dstIpCatsItem.secCats);
                    if (resultItem) {
                        const uniqueFlowIds = union(resultItem.flowIds, dstIpCatsItem.flowIds);
                        resultItem.flowIds = uniqueFlowIds;
                        resultItem.CardinalityOf = uniqueFlowIds.length;
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
