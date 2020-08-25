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
export default class FecHeatmapTabify extends ESTabify {
    
    process(response, tabifyOptions = {}) {
        let table;

        if (response.hits) {
            console.log(response);
        }
        else {
            const errorMessage = "Tabify() invoked with invalid result set. Result set must have 'hits' defined.";
            getLogger().error(errorMessage);
            throw new Error(errorMessage);
        }

        if (tabifyOptions.concatenationFields) {
            table = this.processTabifyOptions(table, tabifyOptions);
        }

        return this.flatArray(table);
    }
}
