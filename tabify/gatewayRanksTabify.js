import ESTabify from '../elasticsearch/ESTabify';

export default class GatewayRanksTabify extends ESTabify {

    process(response) {
        const result =  super.process(response) || [];
        const computedItems = [];
        for (let rank = 1; rank <= 4; rank++) {
            if (!result.find((item) => item && item.GatewayRank === rank)) {
                computedItems.push({GatewayRank: rank, NSGCount: 0});
            }
        }
        return [...result, ...computedItems].sort((item1, item2) => (item2.GatewayRank - item1.GatewayRank));
    }
}