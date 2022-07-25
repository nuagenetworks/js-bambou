import { getLogger } from '../Logger';
import ESTabify from "../elasticsearch/ESTabify";

export default class FlowExplorerTabify extends ESTabify {

    process(response, tabifyOptions = {}) {
        let table;

        if (response.hits) {
            table = response.hits.hits.map((d) => (d._source));
        } else {
            const errorMessage = "Tabify() invoked with invalid result set. Result set must have 'hits' defined.";
            getLogger().error(errorMessage);
            throw new Error(errorMessage);
        }

        if (table.length && table[0].Tier1URLInfo) {
            table[0].Tier1URLInfo.forEach(val => {
                val.roundTripTimeList = val.roundTripTimeList.join(', ');
            });
        }
        table = super.process(table);

        return table;
    }

}
