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
        .withArgs(a => a.required('text'))
        .withDesc('Reverses the order of `text`. If `text` is an array, the array will be reversed. If `{get}` is used with an array, this will modify the original array.')
        .withExample(
            '{reverse;palindrome}',
            'emordnilap'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let arr = bu.deserializeTagArray(args[0]);
            if (arr == null || !Array.isArray(arr.v))
                return args[0].split('').reverse().join('');

            arr.v = arr.v.reverse();

            if (!arr.n)
                return bu.serializeTagArray(arr.v);

            await context.variables.set(arr.n, arr.v);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
