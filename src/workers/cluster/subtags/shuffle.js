/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-11 18:30:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('shuffle')
        .acceptsArrays()
        .withArgs(a => a.optional('array'))
        .withDesc('Shuffles the `{args}` the user provided, or the elements of `array`. If used with a variable this will modify the original array')
        .withExample(
            '{shuffle} {args;0} {args;1} {args;2}',
            'one two three',
            'three one two'
        )
        .whenArgs(0, async function (subtag, context) { bu.shuffle(context.input); })
        .whenArgs(1, async function (subtag, context, args) {
            let arr = bu.deserializeTagArray(args[0]);

            if (arr == null || !Array.isArray(arr.v))
                return Builder.errors.notAnArray(subtag, context);

            bu.shuffle(arr.v);
            if (!arr.n)
                return bu.serializeTagArray(arr.v);

            await context.variables.set(arr.n, arr.v);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
