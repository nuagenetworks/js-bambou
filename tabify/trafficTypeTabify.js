import ESTabify from '../elasticsearch/ESTabify';

export default class TrafficTypeTabify extends ESTabify {

    process(response) {
        let result =  super.process(response);
        result = result.reduce((acc, item) => {
            if (item.IngressBytes) {
                acc.push({
                    TrafficType: item.TrafficType,
                    Bytes: item.IngressBytes,
                    Direction: "Upload"
                });
            };
            if (item.EgressBytes) {
                acc.push({
                    TrafficType: item.TrafficType,
                    Bytes: item.EgressBytes,
                    Direction: "Download"
                });
            };
            return acc;
        }, []);
        return result;
    }
}