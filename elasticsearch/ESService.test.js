import ESService from './ESService';
import mockQueryTemplate from '../__mocks__/mockQueryTemplate';

import NUTemplateParser from '../NUTemplateParser';


jest.mock('./ESRESTConnection');


const eSService = new ESService();

describe('ES Service', () => {
    // for elastic search query
    it('fetch', () => {
        return eSService.fetch(mockQueryTemplate).then((results) => {
            expect(results.response[0].protocol).toEqual("TCP");
        });
    });

    it('fetch with scroll', () => {
        return eSService.fetch({ ...mockQueryTemplate, scroll: true }).then((results) => {
            expect(results.nextPage.scroll_id)
                .toEqual("cXVlcnlUaGVuRmV0Y2g7NTsxMzI6MUdvVlRMdl==");
        });
    });

    it('fetch without config', () => {
        return eSService.fetch({})
            .catch(error => {
                return expect(error).toEqual("Invalid query");
            });
    });

});
