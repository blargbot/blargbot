/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:19
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:57:19
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('shift')
        .withArgs(a => a.require('array'))
        .withDesc('Returns the first element in an array. If used with {get} this will remove the first element from the array as well.')
        .withExample(
            '{shift;["this", "is", "an", "array"]}',
            'this'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            let arr = bu.deserializeTagArray(params.args[1]), result;

            if (arr == null || !Array.isArray(arr.v))
                return await Builder.errors.notAnArray(params);

            result = arr.v.shift();
            if (arr.n)
                await bu.setArray(arr, params);

            return result;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();