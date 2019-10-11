import mockQueryTemplate from '../__mocks__/mockQueryTemplate';
import NUTemplateParser from './index';

describe('NU Template Parser', () => {
    // for template parser (paramerized query from given context)configuration
    it('replace tags', () => {
        const updatedQuery = NUTemplateParser.parameterizedConfiguration(mockQueryTemplate, { 'type': 'sample type', 'domainName': 'main title section' });
        expect(updatedQuery.query.type).toEqual('sample type');
    });

    it('replace default tags', () => {
        const updatedQuery = NUTemplateParser.parameterizedConfiguration(mockQueryTemplate, { 'type': 'sample type', 'domainName': 'main title section' });
        expect(updatedQuery.query.index).toEqual('nuage_flow');
    });

    it('missing tags', () => {
        const updatedQuery = NUTemplateParser.parameterizedConfiguration(mockQueryTemplate, { 'type': 'sample type' });
        expect(updatedQuery).toEqual(false);
    });

    it('replace provided tags', () => {
        const updatedQuery = NUTemplateParser.contextualize(mockQueryTemplate, { 'type': 'sample type' });
        expect(updatedQuery.query.type).toEqual('sample type');
        expect(updatedQuery.query.index).toEqual('nuage_flow');
        expect(updatedQuery.title).toEqual('test undefined');
    });

    it('expected parameters', () => {
        const parameters = NUTemplateParser.getUsedParameters(mockQueryTemplate, { 'type': 'sample type', value: '' });
        expect(parameters).toEqual({
            index: 'nuage_flow',
            type: 'sample type',
            startTime: 'now-24h',
            endTime: 'now',
            domainName: undefined
        });
    });
});
