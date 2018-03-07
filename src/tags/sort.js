/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-16 19:40:38
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('sort')
        .withArgs(a => [a.require('array'), a.optional('descending')])
        .withDesc('Sorts the `array` in ascending order. ' +
            'If `descending` is provided, sorts in descending order. ' +
            'If `{get}` is used, will modify the original `array`.')
        .withExample(
            '{sort;[3, 2, 5, 1, 4]}',
            '[1,2,3,4,5]'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (params) {
            let arr = bu.deserializeTagArray(params.args[1]),
                descending = bu.parseBoolean(params.args[2]);

            if (!bu.isBoolean(descending)) 
                descending = !!params.args[2];

            if (arr == null || !Array.isArray(arr.v))
                return await Builder.errors.notAnArray(params);

            let sorter = new Intl.Collator(undefined,   {numeric: true, sensitivity: 'base'});

            arr.v = arr.v.sort(sorter.compare);
            if (descending) arr.v.reverse();

            if (!arr.n)
                return bu.serializeTagArray(arr.v);
            await bu.setArray(arr, params);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();