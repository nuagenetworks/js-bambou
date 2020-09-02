const getFECHeatmapTabifyResults = aggregations => {
    const result = [];
    if (aggregations.date_histo && aggregations.date_histo.buckets) {
        for (const dateHistoEntry of aggregations.date_histo.buckets) {
            const networkLossValue = dateHistoEntry.NetworkLoss && dateHistoEntry.NetworkLoss.value || undefined;
            const lossAfterFecValue = dateHistoEntry.LossAfterFEC && dateHistoEntry.LossAfterFEC.value || undefined;
            result.push({
                key_as_string: dateHistoEntry.key_as_string,
                date_histo: dateHistoEntry.key,
                doc_count: 1,
                stat: "Network Loss",
                key: networkLossValue,
                ColorValue: getFECHeatmapColorValue(networkLossValue)
            },
            {
                key_as_string: dateHistoEntry.key_as_string,
                date_histo: dateHistoEntry.key,
                doc_count: 1,
                stat: "Loss After FEC",
                key: lossAfterFecValue,
                ColorValue: getFECHeatmapColorValue(lossAfterFecValue)
            });
        }
    }
    return result;
}

const getFECHeatmapColorValue = (key) => {
    return !key ? 'EMPTY' : key >= 0.0 && key < 0.5 ? '0.0% - 0.499%' : key >= 0.5 && key < 2.0 ? '0.5% - 1.99%' : key >= 2.0 && key < 4.0 ? '2.0% - 3.99%' : key >= 4.0 && key < 10.0 ? '4.0% - 9.99%' : '>= 10.0%';
};
