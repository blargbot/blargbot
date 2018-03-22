/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:31
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:31
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('length')
        .acceptsArrays()
        .withArgs(a => a.require('value'))
        .withDesc('Gives the amount of characters in `value`, or the number of elements if it is an array.')
        .withExample(
            'What you said is {length;{args}} chars long.',
            'Hello',
            'What you said is 5 chars long.'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let deserialized = bu.deserializeTagArray(args[0]);
            if (deserialized && Array.isArray(deserialized.v))
                return deserialized.v.length;
            return args[0].length;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();