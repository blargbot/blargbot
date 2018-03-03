/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:57:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('shuffle')
        .acceptsArrays()
        .withArgs(a => a.optional('array'))
        .withDesc('Shuffles the {args} the user provided, or the provided array.')
        .withExample(
            '{shuffle} {args;0} {args;1} {args;2}',
            'one two three',
            'three one two'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', async function (params) { bu.shuffle(params.words); })
        .whenArgs('2', async function (params) {
            let arr = bu.deserializeTagArray(params.args[1]);

            if (arr == null || !Array.isArray(arr.v))
                return await Builder.errors.notAnArray(params);

            bu.shuffle(arr.v);
            if (!arr.n)
                return bu.serializeTagArray(arr.n);

            await bu.setArray(arr, params);
            return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();