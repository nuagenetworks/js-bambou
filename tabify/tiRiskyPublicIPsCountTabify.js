import isEmpty from "lodash/isEmpty";
import union from "lodash/union";

/*
 *Returns the cardinality of unique public IPs coming from source and destination IPs terms aggregations
 */
export default class TiRiskyPublicIPsCountTabify {
    
    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const uniqueSrcPublicIps = aggregations.uniqueSrcPublicIps && aggregations.uniqueSrcPublicIps.riskySrcIps 
                && aggregations.uniqueSrcPublicIps.riskySrcIps.buckets ? aggregations.uniqueSrcPublicIps.riskySrcIps.buckets.map(item => item.key) : [];
            const uniqueDstPublicIps = aggregations.uniqueDstPublicIps && aggregations.uniqueDstPublicIps.riskyDstIps 
                && aggregations.uniqueDstPublicIps.riskyDstIps.buckets ? aggregations.uniqueDstPublicIps.riskyDstIps.buckets.map(item => item.key) : [];
            const result = union(uniqueSrcPublicIps, uniqueDstPublicIps);
            return [{value: result.length}];
        }
        return [{value:0}];
    }
}
