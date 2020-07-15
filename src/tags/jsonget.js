/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-07 11:16:18
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('jsonget')
        .withAlias('jget')
        .withArgs(a => [a.require('input'), a.require('path')])
        .withDesc('Navigates the path of a JSON object. Works with arrays too!\n' +
            '`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.\n' +
            '`path` is a dot-noted series of properties.'
        )
        .withExample(
            '{jsonget;{j;{\n  "array": [\n    "zero",\n    { "value": "one" },\n    "two"\n  ]\n}};array.1.value}',
            'one'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs(2, async function (subtag, context, args) {
            let obj = args[0],
                path = args[1];

            if (!obj)
                obj = '{}';

            let varname = undefined;

            let arr = await bu.getArray(obj);
            if (arr && Array.isArray(arr.v)) {
                obj = arr.v;
            } else {
                try {
                    obj = JSON.parse(obj);
                } catch (err) {
                    varname = obj;
                    let v = await context.variables.get(varname);
                    if (v) {
                        if (typeof v === 'object') obj = v;
                        else {
                            try {
                                obj = JSON.parse(v);
                            } catch (err2) {
                                obj = {};
                            }
                        }
                    } else obj = {};
                }
            }
            if (typeof obj !== 'object' || obj === null)
                obj = {};

            path = path.split('.');
            try {
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
                if (typeof obj === 'object')
                    obj = JSON.stringify(obj);
                return obj;
            } catch (err) {
                return Builder.errors.customError(subtag, context, err.message);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();