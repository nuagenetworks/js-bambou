import { getLogger } from '../Logger';
/**
  This utility will convert the nested data structure
  returned from an ElasticSearch query into a tabular
  data structure represented as an array of row objects.

  Inspired by Kibana's implementation, found at
  https://github.com/elastic/kibana/blob/master/src/ui/public/agg_response/tabify/tabify.js
*/
export default class ESTabify {

    process(response, tabifyOptions = {}) {
        let table;

        if (response.aggregations) {
            const tree = this.collectBucket(response.aggregations);
            table = this.flatten(tree);
        } else if (response.hits) {
            table = response.hits.hits.map((d) => d._source);

        } else if (Array.isArray(response)) {
            table = response;

        } else {
            const errorMessage = "Tabify() invoked with invalid result set. Result set must have either 'aggregations' or 'hits' defined.";
            getLogger().error(errorMessage);
            throw new Error(errorMessage);
        }

        if (tabifyOptions.join) {
            table = this.processTabifyOptions(table, tabifyOptions);
        }

        return this.flatArray(table);
    }

    /**
     *  Converting the provided array indexes to comma seprated values, instead of generating the multiple rows
        For e.g -
        "tabifyOptions": {
            "join": [
                {
                    "path": "nuage_metadata.src-pgmem-info",
                    "field": "name"
                },
                {
                    "path": "nuage_metadata.dst-pgmem-info",
                    "field": "name"
                }
            ]
        }
    **/
    processTabifyOptions(table, tabifyOptions) {
        const joinFields = tabifyOptions.join;
        return table.map(d => {
            joinFields.forEach(joinField => {
                const dataSet = objectPath.get(d, joinField.path);
                let value;
                if (Array.isArray(dataSet)) {
                    value = dataSet.map(name => name[joinField.field]).join(', ');
                } else {
                    value = dataSet;
                }

                objectPath.set(d, joinField.path, value);
            });
            return d;
        })
    }

    flatArray(data) {

        let finalData = [];
        data.forEach(item => {
            let result = this.cartesianProduct(item);
            finalData = [...finalData, ...result];
        })

        return finalData;
    }


    cartesianProduct(data) {
        let final = [];
        let arrayExists = false;

        const keys = Object.keys(data);
        for (let i = 0; i < keys.length; i++) {
            if (Array.isArray(data[keys[i]])) {
                if (data[keys[i]].length === 0) {
                    data[keys[i]].push({});
                }

                data[keys[i]].forEach(item => {
                    final.push({ ...data, [keys[i]]: item })
                });
                arrayExists = true;
                break;
            } else if (data[keys[i]] && typeof data[keys[i]] === 'object') {

                const products = this.cartesianProduct(data[keys[i]]);
                if (products.length > 1) {
                    products.forEach(item => {
                        final.push({ ...data, [keys[i]]: item })
                    });
                    arrayExists = true;
                    break;
                } else if (products.length === 1) {
                    data[keys[i]] = products[0];
                }
            }
        }

        if (arrayExists) {
            final = this.flatArray(final);
        } else {
            final.push(data);
        }

        return final;
    }

    collectBucket(node, stack = []) {
        if (!node)
            return;

        const keys = Object.keys(node);

        // Use old school `for` so we can break control flow by returning.
        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = node[key];

            if (typeof value === 'object') {

                if ("hits" in value && Array.isArray(value.hits) && value.hits.length === 1) {
                    if ("sort" in value.hits[0]) {
                        value.hits[0]._source['sort'] = value.hits[0].sort[0];
                    }
                    return value.hits[0]._source;
                }

                if (Array.isArray(value)) {
                    return this.extractTree(value, [...stack, key]);
                }

                // Here we are sure to have an object
                if (key === "buckets" && Object.keys(value).length > 1) {
                    return this.extractBuckets(value, [...stack, key]);
                }
                return this.collectBucket(value, [...stack, key]);
            }
        }

        return node;
    }

    extractBuckets(buckets, stack) {
        const keys = Object.keys(buckets);
        let results = [];

        for (let i = 0; i < keys.length; i++) {
            const key = keys[i];
            const value = buckets[key];

            const currentObject = this.collectBucket({ [key]: value });

            if (!currentObject)
                continue;

            currentObject[stack[stack.length - 2]] = key;
            results.push(currentObject)
        }

        return results;
    }

    extractTree(buckets, stack) {
        return buckets.map( bucket => {
            return Object.keys(bucket).reduce((tree, key) => {
                let value = bucket[key];

                if (typeof value === "object") {
                    if ("value" in value) {
                        value = value.value;
                    } else {
                        value = this.collectBucket(value, [...stack, key]);
                    }
                }

                if (key === "key") {
                    key = stack[stack.length - 2]
                }

                if (typeof value === 'object') {
                    if ("value" in value) {
                        value = value.value;
                    }
                }
                tree[key] = value;

                return tree;
            }, {});
        });
    }

    flatten(tree, parentNode = {}) {

        if (!tree)
            return [];

        if (!Array.isArray(tree))
            tree = [tree];

        return tree

            // Have the child node inherit values from the parent.
            .map((childNode) => Object.assign({}, parentNode, childNode))

            // Each node object here has values inherited from its parent.
            .map((node) => {

                // Detect properties whose values are arrays.
                const childTrees = Object.keys(node)
                    .map((key) => {
                        const value = node[key];
                        if (Array.isArray(value)) {

                            if (value.length) {
                                return value.map(item => {
                                    if (item[key]) {
                                        return item;
                                    }
                                    return {[key]: item};
                                });
                            }

                            node[key] = null;
                        }
                        return false;
                    })
                    .filter((d) => d);
                if (childTrees.length === 0) {
                    // Leaf node case, return the node.
                    return node;
                } else {
                    // Non-leaf node case, recurse on the child nodes.
                    const childTree = childTrees[0];
                    if (childTree.length === 0) {
                        return node;
                    }
                    return this.flatten(childTree, node);
                }
            })

            // Flatten the nested arrays.
            .reduce((a, b) => a.concat(b), []);
    }
}
