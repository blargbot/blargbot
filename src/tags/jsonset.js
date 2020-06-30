/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:14
 * @Last Modified by: RagingLink
 * @Last Modified time: 2020-06-30 19:59:24
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('jsonset')
        .withAlias('jset')
        .withArgs(a => [a.require('input'), a.require('path'), a.require('value'), a.optional('create')])
        .withDesc('Using the `input` as a base, navigates the provided dot-notated `path` and assigns the `value`.' +
        '`input` can be a JSON object, array, or string. If a string is provided, a variable with the same name will be used.' +
        'If `create` is specified, will create/convert any missing keys.')
        .withExample(
        '{jsonset;;path.to.key;value;create}',
        '{"path":{"to":{"key":"value"}}}'
        )
        .whenArgs('0-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-4', async function (subtag, context, args) {
            let create = args[3] !== undefined;

            let obj = args[0], path = args[1], value = args[2];
            if (!obj)
                obj = '{}';

            let varname = undefined;
            const deserializedTagArray = await bu.deserializeTagArray(value);
            if (deserializedTagArray && !deserializedTagArray.n)
                value = deserializedTagArray.v;
            
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

            let fullObj = obj;
            let comps = path.split('.');
            if (create) {
                for (let i = 0; i < comps.length - 1; i++) {
                    let p = comps[i];
                    if (obj.hasOwnProperty(p)) {
                        let _c = obj[p];
                        // first ensure that it's not json encoded
                        if (typeof _c === 'string') {
                            try {
                                _c = JSON.parse(_c);
                            } catch (err) { }
                        }
                        // set to an object if it's a primative
                        if (typeof _c !== 'object' || _c === null)
                            _c = {};

                        obj[p] = _c;
                    } else {
                        obj[p] = {};
                    }
                    obj = obj[p];
                }
            }
            obj = fullObj;
            try {
                for (let i = 0; i < comps.length - 1; i++) {
                    let p = comps[i];
                    obj = obj[p];
                }
                obj[comps[comps.length - 1]] = value;
            } catch (err) {
                return Builder.errors.customError(subtag, context, err.message);
            }

            if (arr && arr.n != null) {
                await context.variables.set(arr.n, fullObj);
            } else if (varname) {
                await context.variables.set(varname, JSON.stringify(fullObj));
            } else return JSON.stringify(fullObj);

        }).whenDefault(Builder.errors.tooManyArguments)
        .build();