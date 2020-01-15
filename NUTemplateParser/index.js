import NUParser from './NUParser';
import isEmpty from 'lodash/isEmpty';

export default class NUTemplateParser {
    /**
     *  TODO - Will look it later.
        This will update the context by calling the respective translator
    Arguments:
        * parameters: parameters of the query that have been parsed.
        * context: the context object that contains parameters value
        Returns:
            context: updated context by calling respective translators
    */
    static evaluateContext(context, parameters) {
        // const updatedContext = Object.assign({}, context);

        // for (let i in parameters) {

        //     if (!parameters.hasOwnProperty(i)) continue;

        //     const parameter = parameters[i];
        //     if (parameter.evaluate) {
        //         updatedContext[parameter.key] = NUTranslator.translate(parameter.evaluate, context[parameter.key]);
        //     }
        // }

        return context;
    }

    /*
        Check if the context can parameterized all parameters.
        Arguments:
        * parameters: parameters of the query that have been parsed.
        * context: the context object that contains parameters value
        Returns:
            True if the context matches all parameters
    */
    static shouldParameterizedContext(parameters, context) {

        return parameters.every((parameter) => {
            return "defaultValue" in parameter || parameter.key in context;
        });
    }

    /*
        Parameterized a configuration according to the given context
        Arguments:
        * configuration: the configuration template that needs to be parameterized
        * context: the context object that contains parameters
        Returns:
        A parameterized configuration.
    */
    static parameterizedConfiguration(configuration, context) {
        if (!configuration) {
            return false;
        }

        const template = NUParser(configuration);
        const isContextOK = NUTemplateParser.shouldParameterizedContext(template.parameters, context);

        if (isContextOK) {
            return template(NUTemplateParser.evaluateContext(context, template.parameters));
        }

        return false;
    }

    /*
        Returns a key-value dictionary with all parameters that are really used
        in the configuration.
        Arguments:
        * configuration: the configuration template that needs to be parameterized
        * context: the context object that contains parameters
        Returns:
        An object that gives all parameters
    */
    static getUsedParameters(configuration, context) {
        const parameters = NUParser(configuration).parameters;
        const queryParams = {};

        for (let i in parameters) {

            if (!parameters.hasOwnProperty(i)) continue;

            const parameter = parameters[i];

            if (parameter.key in context) {
                queryParams[parameter.key] = context[parameter.key];
            } else if ("defaultValue" in parameter) {
                queryParams[parameter.key] = parameter.defaultValue;
            }
            // else ignore the parameter because it is not used in the provided configuration.
        }

        if(!isEmpty(context.value) && typeof context.value === 'string') {
            queryParams['value'] = context.value.replace(/ /g,'');
        }

        return queryParams;
    }

    static contextualize(data, context) {
        const template = NUParser(data);
        return template(NUTemplateParser.evaluateContext(context, template.parameters));
    }
}
