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
        .withArgs(a => [a.require('array'), a.require('start'), a.optional('end')])
        .withDesc('Grabs elements between the zero-indexed `start` and `end` points (inclusive) from `array`.')
        .withExample(
            '{slice;["this", "is", "an", "array"];1}',
            '["is","an","array"]'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-4', async function (params) {
            let arr = bu.deserializeTagArray(params.args[1]),
                start = bu.parseInt(params.args[2]),
                end = bu.parseInt(params.args[3]),
                fallback = bu.parseInt(params.fallback);


            if (!params.args[3])
                end = arr.v.length;

            if (arr == null || !Array.isArray(arr.v))
                return await Builder.errors.notAnArray(params);

            if (isNaN(start)) start = fallback;
            if (isNaN(end)) end = fallback;
            if (isNaN(start) || isNaN(end))
                return await Builder.errors.notANumber(params);


            return bu.serializeTagArray(arr.v.slice(start, end));
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();