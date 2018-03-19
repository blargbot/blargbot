/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-05 16:51:36
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('push')
        .withArgs(a => [a.require('array'), a.require('values', true)])
        .withDesc('Pushes `values` onto the end of `array`. If used with `{get}` this will update the original variable. Otherwise, it will simply output the new array.')
        .withExample(
            '{push;["this", "is", "an"];array}',
            '["this","is","an","array"]'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenDefault(async function (params) {
            let arr = await bu.getArray(params, params.args[1]),
                values = params.args.slice(2),
                result;

            if (arr == null || !Array.isArray(arr.v))
                return await Builder.errors.notAnArray(params);

            arr.v.push(...values);

            if (arr.n != null)
                await bu.setArray(arr, params);
            else
                return bu.serializeTagArray(arr.v);
        })
        .build();