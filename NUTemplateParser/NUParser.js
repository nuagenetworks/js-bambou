import evalExpression from 'eval-expression';

/*
MIT License

Copyright (c) 2016 Curran Kelleher

Permission is hereby granted, free of charge, to any person obtaining a copy
of this software and associated documentation files (the "Software"), to deal
in the Software without restriction, including without limitation the rights
to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
copies of the Software, and to permit persons to whom the Software is
furnished to do so, subject to the following conditions:
*/

/**
 * JSON Template parser for subsitution of parameters
 */

// Parses the given template object.
//
// Returns a function `template(context)` that will "fill in" the template
// with the context object passed to it.
//
// The returned function has a `parameters` property,
// which is an array of parameter descriptor objects,
// each of which has a `key` property and possibly a `defaultValue` property.
const NUParser = (value) => {
    switch (type(value)) {
        case "string":
            return parseString(value);
        case "object":
            return parseObject(value);
        case "array":
            return parseArray(value);
        default:
            return Template(function () { return value; }, []);
    }
};

const type = (value) => {
    if (Array.isArray(value)) {
        return 'array';
    }

    return value instanceof Date ? "date" : typeof value;
};


// Constructs a parameter object from a match result.
// e.g. "['{{foo}}']" --> { key: "foo" }
// e.g. "['{{foo:bar}}']" --> { key: "foo", defaultValue: "bar" }
const Parameter = (match) => {
    match = match.substr(2, match.length - 4).trim();
    let i = match.indexOf(":");
    if (i !== -1) {
        const parameter = {
            key: match.substr(0, i),
        };

        let value = match.substr(i + 1);

        if (value.includes('call(')) {
            let re = /(call\(')(.*)('\))/;
            parameter.evaluate = value.replace(re, "$2");
        } else if (value.startsWith('(props)')) {
            parameter.method = evalExpression(value);
        } else {
            parameter.defaultValue = value;
        }

        return parameter;
    } else {
        return { key: match };
    }
}

// Constructs a template function with `parameters` property.
const Template = (fn, parameters) => {
    fn.parameters = parameters;
    return fn;
};

// Parses leaf nodes of the template object that are strings.
// Also used for parsing keys that contain templates.
const parseString = (() => {

    // This regular expression detects instances of the
    // template parameter syntax such as {{foo}}, {{foo:someDefault}} or {{foo:['someDefault']}}.
    const regex = /{{(\w|:|\s|-|\.|\[|\)|\(|'|,|]|\+|=|>)+}}/g;

    return (str) => {
        if (regex.test(str)) {

            let matches = str.match(regex),
                parameters = matches.map(Parameter);

            return Template((context) => {
                context = context || {};
                return matches.reduce((str, match, i) => {
                    const parameter = parameters[i];

                    const value = context[parameter.key] || parameter.defaultValue;
                    return Array.isArray(value) ? value : str.replace(match, value);
                }, str);
            }, parameters);

        } else {
            return Template(() => {
                return str;
            }, []);
        }
    };
})();

// Parses non-leaf-nodes in the template object that are objects.
const parseObject = (object) => {

    const children = Object.keys(object).map(function (key) {
        return {
            keyTemplate: parseString(key),
            valueTemplate: NUParser(object[key]),
        };
    });

    return Template(function (context) {
        return children.reduce(function (newObject, child) {
            newObject[child.keyTemplate(context)] = child.valueTemplate(context);
            return newObject;
        }, {});
    }, children.reduce(function (parameters, child) {
        return parameters.concat(child.valueTemplate.parameters, child.keyTemplate.parameters);
    }, []));

}


// Parses non-leaf-nodes in the template object that are arrays.
const parseArray = (array) => {

    const templates = array.map(NUParser);

    return Template(function (context) {
        return templates.map(function (template) {
            return template(context);
        });
    }, templates.reduce(function (parameters, template) {
        return parameters.concat(template.parameters);
    }, []));

}

export default NUParser;
