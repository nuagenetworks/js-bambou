import { getLogger } from '../Logger';
import ESTabify from "../elasticsearch/ESTabify";

export default class FlowExplorerTabify extends ESTabify {

    process(response, tabifyOptions = {}) {
        let table;

        if (response.hits) {
            table = response.hits.hits.map((d) => (d._source));
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
