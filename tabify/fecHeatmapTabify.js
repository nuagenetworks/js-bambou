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

    getFECHeatmapColorValue(key) {
        return key >= 0.0 && key < 0.5 ? '0.0% - 0.49%' : 
            key >= 0.5 && key < 1.0 ? '0.5% - 0.99%' : 
            key >= 1.0 && key < 1.5 ? '1.0% - 1.49%' :
            key >= 1.5 && key < 2.0 ? '1.5% - 1.99%' :
            key >= 2.0 && key < 4.0 ? '2.0% - 3.99%' : 
            key >= 4.0 && key < 6.0 ? '4.0% - 5.99%' : 
            key >= 6.0 && key < 10.0 ? '6.0% - 9.99%' : '>= 10.0%';
    }
    
    process(response) {
        const aggregations = response && response.aggregations;
        const NO_DATA = 'No Data';
        if (!isEmpty(aggregations)) {
            const result = [];
            if (aggregations.date_histo && aggregations.date_histo.buckets) {
                for (const dateHistoEntry of aggregations.date_histo.buckets) {
                    const networkLossValue = dateHistoEntry.NetworkLoss ? dateHistoEntry.NetworkLoss.value : NO_DATA;
                    const lossAfterFecValue = dateHistoEntry.LossAfterFEC ? dateHistoEntry.LossAfterFEC.value : NO_DATA;
                    const underlayName = (dateHistoEntry.UnderlayName && dateHistoEntry.UnderlayName.buckets && dateHistoEntry.UnderlayName.buckets.length && dateHistoEntry.UnderlayName.buckets[0].key) || '-';
                    result.push({
                        key_as_string: dateHistoEntry.key_as_string,
                        date_histo: dateHistoEntry.key,
                        doc_count: 1,
                        stat: "Network Loss (%)",
                        key: networkLossValue,
                        min: dateHistoEntry.MinNetworkLoss ? dateHistoEntry.MinNetworkLoss.value : NO_DATA,
                        max: dateHistoEntry.MaxNetworkLoss ? dateHistoEntry.MaxNetworkLoss.value : NO_DATA,
                        underlay: underlayName,
                        ColorValue: this.getFECHeatmapColorValue(networkLossValue)
                    },
                    {
                        key_as_string: dateHistoEntry.key_as_string,
                        date_histo: dateHistoEntry.key,
                        doc_count: 1,
                        stat: "Loss After FEC (%)",
                        key: lossAfterFecValue,
                        min: dateHistoEntry.MinLossAfterFEC ? dateHistoEntry.MinLossAfterFEC.value : NO_DATA,
                        max: dateHistoEntry.MaxLossAfterFEC ? dateHistoEntry.MaxLossAfterFEC.value : NO_DATA,
                        underlay: underlayName,
                        ColorValue: this.getFECHeatmapColorValue(lossAfterFecValue)
                    });
                }
            }
            return result;
        }
        return [];
    }
}
