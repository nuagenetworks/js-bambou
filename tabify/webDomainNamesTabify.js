import ESTabify from "../elasticsearch/ESTabify";
import isEmpty from "lodash/isEmpty";

/*
    Sums up web domain name hits from two separate sum aggregations
 */
export default class WebDomainNamesTabify extends ESTabify {

    process(response) {
        const aggregations = response && response.aggregations;
        if (!isEmpty(aggregations)) {
            const result = aggregations.WebDoms ? super.process({aggregations: { WebDoms: aggregations.WebDoms }}) : [];
            const webDomainsNested = aggregations.WebDomsNested ? super.process({aggregations: { WebDomsNested: aggregations.WebDomsNested }}) : [];
            if (!isEmpty(webDomainsNested)) {
                webDomainsNested.forEach((webDomainNestedItem) => {
                    const resultItem = result.find(item => item.WebDoms === webDomainNestedItem.WebDomsNested);
                    if (resultItem) {
                        resultItem.SumOfHits += webDomainNestedItem.SumOfHits
                    } else {
                        result.push({...webDomainNestedItem, WebDoms: webDomainNestedItem.WebDomsNested});
                    }
                });
            }
            return result;
        }
        return [];
    }
}