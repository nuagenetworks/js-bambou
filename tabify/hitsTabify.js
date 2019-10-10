import { getLogger } from '../Logger';

export default class HitsTabify {

    process(response) {
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
