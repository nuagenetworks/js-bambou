import isEmpty from "lodash/isEmpty";
import union from "lodash/union";

/*
 *Returns the cardinality of unique public IPs coming from source and destination IPs terms aggregations
 */
export default class TiRiskyPublicIPsCountTabify {
    
    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const uniqueSrcPublicIps = aggregations.uniqueSrcPublicIps && aggregations.uniqueSrcPublicIps.buckets 
                ? aggregations.uniqueSrcPublicIps.buckets.map(item => item.key) : [];
            const uniqueDstPublicIps = aggregations.uniqueDstPublicIps && aggregations.uniqueDstPublicIps.buckets 
                ? aggregations.uniqueDstPublicIps.buckets.map(item => item.key) : [];
            const result = union(uniqueSrcPublicIps, uniqueDstPublicIps);
            return [{value: result.length}];
        }
        return [{value:0}];
    }
}
