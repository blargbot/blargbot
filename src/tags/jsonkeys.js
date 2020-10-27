/*
 * @Author: RagingLink
 * @Date: 2020-07-17 19:24:32
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-09-11 21:25:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('jsonkeys')
        .withAlias('jkeys')
        .withArgs(a => [a.require('object'), a.optional('path')])
        .withDesc('Retrieves all keys from provided JSON object.' + 
        '`object` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n' +
        '`path` is a dot-noted series of properties.'
        )
        .withExample('{set;~json;{json;{"key": "value", "key2" : "value2"}}\n'
            + '{jsonkeys;~json}', '["key","key2"]')
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async (subtag, context, args) => {
            let obj = args[0],
                path = args[1],
                varname;

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
                            } catch (err) { }
                        }

                        if (typeof obj === 'object') {
                            const keys = Object.keys(obj);
                            if (keys.length === 2 && keys.includes('v') && keys.includes('n') && /^\d+$/.test(part)) {
                                obj = obj.v;
                            }
                        }

                        // intentionally let it error if undefined
                        if (obj === undefined || obj.hasOwnProperty(part))
                            obj = obj[part];
                        else obj = undefined;
                    }
                }
                return Object.keys(obj);
            } catch (err) {
                return Builder.errors.customError(subtag, context, err.message);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
