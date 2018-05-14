/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-11 19:08:27
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('push')
        .withArgs(a => [a.require('array'), a.require('values', true)])
        .withDesc('Pushes `values` onto the end of `array`. If provided a variable, this will update the original variable. Otherwise, it will simply output the new array.')
        .withExample(
            '{push;["this", "is", "an"];array}',
            '["this","is","an","array"]'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, args) {
            let arr = await bu.getArray(context, args[0]),
                values = args.slice(1),
                result;

            if (arr == null || !Array.isArray(arr.v))
                return Builder.errors.notAnArray(subtag, context);

            arr.v.push(...values);

            if (arr.n != null)
                await context.variables.set(arr.n, arr.v);
            else
                return bu.serializeTagArray(arr.v);
        })
        .build();