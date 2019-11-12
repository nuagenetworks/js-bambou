import ESTabify from "../elasticsearch/ESTabify";
import isEmpty from "lodash/isEmpty";

/*
    Adds data for missing GatewayRank items, with NSGCount value as 0
    Sorts by Rank 1 to 4 (4 to 1 as per data received from elasticsearch response)
 */
export default class GatewayRanksTabify extends ESTabify {

    process(response) {
        const result =  super.process(response) || [];
        const computedItems = [];
        if (!isEmpty(result)) {
            for (let rank = 1; rank <= 4; rank++) {
                if (!result.find((item) => item && item.GatewayRank === rank)) {
                    computedItems.push({GatewayRank: rank, NSGCount: 0});
                }
            }
            return [...result, ...computedItems].sort((item1, item2) => (item2.GatewayRank - item1.GatewayRank));
        }
        return result;
    }
}