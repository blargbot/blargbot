/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-06 14:21:11
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('jsonstringify')
        .withAlias('jstringify')
        .withArgs(a => [a.required('input'), a.optional('indent')])
        .withDesc('Pretty-prints the provided JSON `input` with the provided `indent`, defaulting to 4.')
        .withExample(
            '{jsonstringify;["one","two","three"]}',
            '[\n    \"one\",\n    \"two\",\n    \"three\"\n]'
        )
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            if (!args[1]) args[1] = '4';
            let obj = args[0],
                indent = parseInt(args[1]);

            if (isNaN(indent))
                return Builder.errors.notANumber(subtag, context);

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

            return JSON.stringify(obj, null, indent);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();