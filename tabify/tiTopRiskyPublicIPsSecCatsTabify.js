import isEmpty from "lodash/isEmpty";
import union from "lodash/union";

/*
 *Returns the top risky public IPs coming from source and destination IPs by flows aggregations
 */
export default class TiTopRiskyPublicIPsSecCatsTabify {
    
    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const result = aggregations.sources && aggregations.sources.riskySrcs 
                && aggregations.sources.riskySrcs.buckets ? aggregations.sources.riskySrcs.buckets.map(item => { 
                    return {
                        topxAttr: item.key,
                        CardinalityOf: item.CardinalityOf.value,
                        flowIds: item.flowIds.buckets ? item.flowIds.buckets.map((flowId) => flowId.key) : []
                    }
                }) : [];
            const dsts = aggregations.destinations && aggregations.destinations.riskyDsts 
                && aggregations.destinations.riskyDsts.buckets ? aggregations.destinations.riskyDsts.buckets.map(item => { 
                    return {
                        topxAttr: item.key,
                        CardinalityOf: item.CardinalityOf.value,
                        flowIds: item.flowIds.buckets ? item.flowIds.buckets.map((flowId) => flowId.key) : []
                    }
                }) : [];

            if (!isEmpty(dsts)) {
                dsts.forEach((dstsItem) => {
                    const resultItem = result.find(item => item.topxAttr === dstsItem.topxAttr);
                    if (resultItem) {
                        const uniqueFlowIds = union(resultItem.flowIds, dstsItem.flowIds);
                        resultItem.flowIds = uniqueFlowIds;
                        resultItem.CardinalityOf = uniqueFlowIds.length;
                    } else {
                        result.push({...dstsItem});
                    }
                });
            }
            result.sort((a,b) => (a.CardinalityOf > b.CardinalityOf) ? -1 : ((b.CardinalityOf > a.CardinalityOf) ? 1 : 0));
            return result;
        }
        return [];
    }
}
