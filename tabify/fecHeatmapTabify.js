import isEmpty from "lodash/isEmpty";

/*
 * Returns the Network Loss and Loss after FEC percentages for a given Source and Destination NSG combination in the given format
 * [
 *   {
 *     "key_as_string": "2020-08-24T18:40:00.000Z",
 *     "date_histo": 1598294400000,
 *     "doc_count": 1,
 *     "stat": "NetworkLoss",
 *     "ColorValue": "0.0% - 0.499%"
 *   },
 *   {
 *     "key_as_string": "2020-08-24T18:40:00.000Z",
 *     "date_histo": 1598294400000,
 *     "doc_count": 1,
 *     "stat": "LossAfterFEC",
 *     "ColorValue": "0.0% - 0.499%"
 *   },
 *   ...
 * ]
 */
export default class FecHeatmapTabify {
    
    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const result = aggregations.date_histo && aggregations.date_histo.buckets &&  aggregations.date_histo.buckets.map(dateHistoEntry => {
                const networkLossInfo = dateHistoEntry.NetworkLoss && dateHistoEntry.NetworkLoss.buckets && dateHistoEntry.NetworkLoss.buckets.map(element => ({ 
                    key_as_string: dateHistoEntry.key_as_string,
                    date_histo: dateHistoEntry.key,
                    doc_count: 1,
                    stat: "NetworkLoss",
                    key: element.key || 0,
                    ColorValue: element.ColorValue && element.ColorValue.buckets && element.ColorValue.buckets.length > 0 ?
                        element.ColorValue.buckets[0].key : "0.0% - 0.499%"
                }));
                const lossAfterFecInfo = dateHistoEntry.LossAfterFEC && dateHistoEntry.LossAfterFEC.buckets && dateHistoEntry.LossAfterFEC.buckets.map(element => ({ 
                    key_as_string: dateHistoEntry.key_as_string,
                    date_histo: dateHistoEntry.key,
                    doc_count: 1,
                    stat: "LossAfterFEC",
                    key: element.key || 0,
                    ColorValue: element.ColorValue && element.ColorValue.buckets && element.ColorValue.buckets.length > 0 ?
                        element.ColorValue.buckets[0].key : "0.0% - 0.499%"
                }));
                const temp = networkLossInfo.reduce(function(arr, v, i) {
                    return arr.concat(v, lossAfterFecInfo[i]); 
                }, []);
                return temp;
            });
            return result;
        }
        return [];
    }
}
