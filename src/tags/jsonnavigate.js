/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-08-30 15:11:12
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('jsonnavigate')
        .withAlias('navigate')
        .withArgs(a => [a.require('input'), a.require('path')])
        .withDesc('Navigates the path of a JSON object. Works with arrays too!\n' +
        '`path` is a dot-noted series of properties.'
        )
        .withExample(
        '{jsonnavigate;["one","two","three"];1}',
        'two'
        )
        .whenArgs('0-1', async (_, context) => getUrls(context.msg))
        .whenArgs(2, async function (subtag, context, args) {
            let obj = args[0],
                path = args[1];

            let arr = await bu.deserializeTagArray(obj);
            if (arr && Array.isArray(arr.v))
                obj = arr.v;
            else {
                try {
                    obj = JSON.parse(obj);
                } catch (err) {
                    return Builder.errors.invalidJSON(subtag, context);
                }
            }

            path = path.split('.');
            try {
                for (const part of path) {
                    if (typeof obj === 'string') {
                        try {
                            obj = JSON.parse(obj);
                        } catch (err) { }
                    }
                    // intentionally let it error if undefined
                    if (obj === undefined || obj.hasOwnProperty(part))
                        obj = obj[part];
                    else obj = undefined;
                }
                return obj;
            } catch (err) {
                return Builder.errors.customError(subtag, context, err.message);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();