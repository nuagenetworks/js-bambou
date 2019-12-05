import ESTabify from "../elasticsearch/ESTabify";
import isEmpty from "lodash/isEmpty";

/*
    Tabifies into Object with ranks as keys and NSG counts as values
    Adds data for missing GatewayRank items, with NSGCount value as 0
    Sorts by Rank 1 to 4 (4 to 1 as per data received from elasticsearch response)
 */
export default class GatewayRanksTabify extends ESTabify {

    process(response) {
        const result =  super.process(response) || [];
        if (!isEmpty(result)) {
            const resultByRank = {};
            result.forEach(({GatewayRank}) => {
                resultByRank[GatewayRank] = (resultByRank[GatewayRank] || 0) + 1;
            });
            const resultArray = [];
            for (const GatewayRank in resultByRank) {
                resultArray.push({GatewayRank, NSGCount: resultByRank[GatewayRank]});
            }
            const computedItems = [];
            for (let rank = 0; rank <= 4; rank++) {
                if (!resultArray.find((item) => item && item.GatewayRank === rank)) {
                    computedItems.push({GatewayRank: rank, NSGCount: 0});
                }
            }
            return [...resultArray, ...computedItems].sort((item1, item2) => (
                item1.GatewayRank === 0 ? 1 : item2.GatewayRank === 0 ? -1 : item1.GatewayRank - item2.GatewayRank
            ));
        }
        return result;
    }
}