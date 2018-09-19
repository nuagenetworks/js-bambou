export default Object.freeze({
    "id": "vss-domain-flow-explorer",
    "title": "test {{domainName}}",
    "service": "elasticsearch",
    "query": {
        "index": "{{index:nuage_flow}}",
        "type": "{{type:nuage_doc_type}}",
        "body": {
            "size": 10,
            "sort": [
                { "timestamp": { "order": "desc" } }
            ],
            "query": {
                "bool": {
                    "must": [
                        { "range": { "timestamp": { "gte": "{{startTime:now-24h}}", "lte": "{{endTime:now}}", "format": "epoch_millis" } } }
                    ]
                }
            }
        }
    }
});
