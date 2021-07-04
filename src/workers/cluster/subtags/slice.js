/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:28
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:57:28
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('slice')
        .withArgs(a => [a.required('array'), a.required('start'), a.optional('end')])
        .withDesc('Grabs elements between the zero-indexed `start` and `end` points (inclusive) from `array`.')
        .withExample(
            '{slice;["this", "is", "an", "array"];1}',
            '["is","an","array"]'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (subtag, context, args) {
            let arr = await bu.getArray(context, args[0]);
            let start = bu.parseInt(args[1]);
            let end = bu.parseInt(args[2]);
            let fallback = bu.parseInt(context.scope.fallback);

            if (arr == null || !Array.isArray(arr.v))
                return Builder.errors.notAnArray(subtag, context);

            if (!args[2])
                end = arr.v.length;

            if (isNaN(start)) start = fallback;
            if (isNaN(end)) end = fallback;
            if (isNaN(start) || isNaN(end))
                return Builder.errors.notANumber(subtag, context);

            return bu.serializeTagArray(arr.v.slice(start, end));
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
