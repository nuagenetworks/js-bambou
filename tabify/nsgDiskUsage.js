import evalExpression from 'eval-expression';

const processByteLabel = (mbValue) => {
    if (mbValue<1000) {
        return `${mbValue.toFixed(2)} MB`;
    }
    else if (mbValue<1000000){
        let val = mbValue/1000;
        return `${val.toFixed(2)} GB`;
    }
    else if (mbValue<1000000000){
        let val = mbValue/1000000;
        return `${val.toFixed(2)} TB`;
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
            const availMb = item.available;
            const usedMb = item.used;
            const totalMb = availMb + usedMb;
            const availPercent = (availMb*100/totalMb).toFixed(2);
            const usedPercent = (usedMb*100/totalMb).toFixed(2);
            const usedVal = processByteLabel(usedMb);
            const availVal = processByteLabel(availMb);
            const mbVal = `Used: ${usedVal}, Available: ${availVal}`;
            const tooltipPercent = `Used: ${usedPercent}%, Available: ${availPercent}%`;

            finalData.push({
                ...item,
                availPercent,
                usedPercent,
                tooltipPercent,
                totalMB: processByteLabel(totalMb),
                valueMB: mbVal
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
