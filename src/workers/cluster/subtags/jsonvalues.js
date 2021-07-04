/*
 * @Author: RagingLink
 * @Date: 2020-07-17 19:40:32
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-09-11 21:24:47
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('jsonvalues')
        .withAlias('jvalues')
        .withArgs(a => [a.required('object'), a.optional('path')])
        .withDesc('Retrieves all values from the provided object. ' +
            '`object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n' +
            '`path` is a dot-noted series of properties.'
        )
        .withExample(
            '{set;~json;{json;{"key": "value", "key2" : "value2"}}\n'
            + '{jsonvalues;~json}',
            '["value","value2"]'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async (subtag, context, args) => {
            let obj = args[0];
            let path = args[1];
            let varname;

            let arr = await bu.getArray(obj);
            if (arr && Array.isArray(arr.v)) obj = arr.v;

            try {
                obj = JSON.parse(obj);
            } catch (err) {
                varname = obj;
                let v = await context.variables.get(varname);
                if (v) {
                    if (typeof v === 'object') {
                        obj = v;
                    } else {
                        try {
                            obj = JSON.parse(v);
                        } catch (err2) {
                            obj = {};
                        }
                    }
                } else obj = {};
            }
            if (typeof obj !== 'object' || obj === null) obj = {};
            try {
                if (path) {
                    path = path.split('.');
                    for (const part of path) {
                        if (typeof obj === 'string') {
                            try {
                                obj = JSON.parse(obj);
                            } catch (err) {
                                // NOOP
                            }
                        }

                        if (typeof obj === 'object') {
                            const keys = Object.keys(obj);
                            if (keys.length === 2 && keys.includes('v') && keys.includes('n') && /^\d+$/.test(part)) {
                                obj = obj.v;
                            }
                        }

                        // intentionally let it error if undefined
                        if (obj === undefined || Object.prototype.hasOwnProperty.call(obj, part))
                            obj = obj[part];
                        else obj = undefined;
                    }
                }
                return Object.values(obj);
            } catch (err) {
                return Builder.errors.customError(subtag, context, err.message);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
