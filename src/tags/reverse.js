/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:30
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:30
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('reverse')
        .acceptsArrays()
        .withArgs(a => a.require('text'))
        .withDesc('Reverses the order of text or an array. If {get} is used with an array, will modify the original array.')
        .withExample(
            '{reverse;palindrome}',
            'emordnilap'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            let arr = bu.deserializeTagArray(params.args[1]);
            if (arr == null || !Array.isArray(arr.v))
                return params.args[1].split('').reverse().join('');

            arr.v = arr.v.reverse();
            if (!arr.n)
                return bu.serializeTagArray(arr.v);

            await bu.setArray(arr, params);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();