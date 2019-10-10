import { getLogger } from '../Logger';
import ESTabify from "../elasticsearch/ESTabify";

export default class HitsTabify extends ESTabify {

    process(response, tabifyOptions = {}) {
        let table;

        if (response.hits) {
            const hits = response.hits.total || 0;
            return [{hits}];
        }
        else {
            const errorMessage = "Tabify() invoked with invalid result set. Result set must have 'hits' defined.";
            getLogger().error(errorMessage);
            throw new Error(errorMessage);
        }
    }

}
