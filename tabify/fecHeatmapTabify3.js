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
export default class FecHeatmapTabify3 {
    
    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const result = [];
            const getFECHeatmapColorValue = (key) => {
                return key >= 0.0 && key < 0.5 ? '0.0% - 0.499%' : key >= 0.5 && key < 2.0 ? '0.5% - 1.99%' : key >= 2.0 && key < 4.0 ? '2.0% - 3.99%' : key >= 4.0 && key < 10.0 ? '4.0% - 9.99%' : '>= 10.0%';
            };
            if (aggregations.date_histo3 && aggregations.date_histo3.buckets) {
                for (const dateHistoEntry of aggregations.date_histo3.buckets) {
                    const networkLossValue = dateHistoEntry.NetworkLoss && dateHistoEntry.NetworkLoss.value || 0.0;
                    const lossAfterFecValue = dateHistoEntry.LossAfterFEC && dateHistoEntry.LossAfterFEC.value || 0.0;
                    result.push({
                        key_as_string3: dateHistoEntry.key_as_string,
                        date_histo3: dateHistoEntry.key,
                        doc_count: 1,
                        stat3: "Network Loss (%)",
                        key3: networkLossValue,
                        min3: dateHistoEntry.MinNetworkLoss && dateHistoEntry.MinNetworkLoss.value || 0.0,
                        max3: dateHistoEntry.MaxNetworkLoss && dateHistoEntry.MaxNetworkLoss.value || 0.0,
                        ColorValue3: getFECHeatmapColorValue(networkLossValue)
                    },
                    {
                        key_as_string3: dateHistoEntry.key_as_string,
                        date_histo3: dateHistoEntry.key,
                        doc_count: 1,
                        stat3: "Loss After FEC (%)",
                        key3: lossAfterFecValue,
                        min3: dateHistoEntry.MinLossAfterFEC && dateHistoEntry.MinLossAfterFEC.value || 0.0,
                        max3: dateHistoEntry.MaxLossAfterFEC && dateHistoEntry.MaxLossAfterFEC.value || 0.0,
                        ColorValue3: getFECHeatmapColorValue(lossAfterFecValue)
                    });
                }
            }
            return result;
        }
        return [];
    }
}
