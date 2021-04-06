/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-06 14:19:25
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('jsonclean')
        .withAlias('jclean')
        .withArgs(a => [a.require('input')])
        .withDesc('Using the `input` as a base, cleans up the JSON file structure, parsing stringified nested objects/arrays. Will not mutate the original object.')
        .withExample(
            '{jsonclean;{j;{"test":"[]"}}}',
            '{"test":[]}'
        )
        .withProp('clean', function(obj) {
            if (typeof obj === 'string') {
                try {
                    // don't parse ints, because it will break snowflakes
                    if (/^\d+$/.test(obj)) {
                        return obj;
                    }
                    const raw = JSON.parse(obj);

                    return this.clean(raw);
                } catch (err) {
                    return obj;
                }
            } else if (Array.isArray(obj)) {
                for (let i = 0; i < obj.length; i++) {
                    obj[i] = this.clean(obj[i]);
                }
            } else if (typeof obj === 'object' && obj !== null) {
                if (obj.n && obj.v && Array.isArray(obj.v)) {
                    return this.clean(obj.v);
                }

                for (const key of Object.keys(obj)) {
                    obj[key] = this.clean(obj[key]);
                }
            }
            return obj;
        })
        .whenArgs('0', Builder.errors.notEnoughArguments)
        .whenArgs('1', async function (subtag, context, args) {
            let obj = args[0];
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
                return JSON.stringify(obj);

            const cleanedObj = this.clean(obj);

            return JSON.stringify(cleanedObj);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();