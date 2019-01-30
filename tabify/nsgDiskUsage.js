import evalExpression from 'eval-expression';

const processByteLabel = (mbValue) => {
    if (mbValue<1000) {
        return `${mbValue} MB`;
    }
    else if (mbValue<1000000){
        let val = mbValue/1000;
        return `${val} GB`;
    }
    else if (mbValue<1000000000){
        let val = mbValue/1000000;
        return `${val} TB`;
    }
};

export default class NSGDiskUsage {

    process(response, tabifyOptions = {}, queryConfig = {}) {
        if (!response || !response.hits || !response.hits.hits) {
            throw new Error("Tabify() invoked with invalid result set. Result set must have 'hits'.");
        }

        if (!response.hits.hits.length || !response.hits.hits[0]._source || !response.hits.hits[0]._source.disks) {
            return [];
        }

        const getDisksMethod = queryConfig.getDisks ? evalExpression(queryConfig.getDisks) : undefined;
        const disks = getDisksMethod ? getDisksMethod(response.hits.hits[0]._source.disks) : response.hits.hits[0]._source.disks;

        const finalData = [];
        disks.forEach(item => {
            //Select only these two disks, and populate their percentages.
            // Little workaround to avoid lots of configuration in configuration file
            finalData.push({
                name:item.name,
                field:"used",
                percent:(item.used*100/(item.used+item.available)),
                value: processByteLabel(item.used)
            });
            finalData.push({
                name:item.name,
                field:"available",
                percent:(item.available*100/(item.used+item.available)),
                value: processByteLabel(item.available)
            });
        })

        if (process.env.NODE_ENV === "development") {
            console.log("Results from tabify (first 3 rows only):");

            // This one shows where there are "undefined" values.
            console.log(finalData)

            // This one shows the full structure pretty-printed.
            console.log(JSON.stringify(finalData.slice(0, 3), null, 2))
        }

        return finalData;
    }
}
