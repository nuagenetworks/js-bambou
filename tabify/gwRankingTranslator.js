import ESTabify from '../elasticsearch/ESTabify';

export default class GWRankingTranslator {
    process(response, tabifyOptions = {}, queryConfig = {}) {
        const results = new ESTabify().process(response, tabifyOptions, queryConfig);
        /**
         * this aberration is to allow the ranking to be displayed in the yAxis as per request from the PLM:
         * top => bottom: 1,2,3,4,0 in the same time keeping the array of results sorted based on the timestamp ascending
         * and without any changes in the line graph framework. Fortunately this is a small collection.
         */
        if (Array.isArray(results)) {
            return results.map(row => {
                let rank = row.GatewayRank;
                switch (row.GatewayRank) {
                    case 1:
                        rank = 4;
                        break;
                    case 2:
                        rank = 3;
                        break;
                    case 3:
                        rank = 2;
                        break;
                    case 4:
                        rank = 1;
                        break;
                    default:
                        break;
                }
                return Object.assign({}, row, {GatewayRank: rank});
            });
        }
        return results;
    }
}