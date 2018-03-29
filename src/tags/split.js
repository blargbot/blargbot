/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:58:58
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:58:58
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('split')
        .withArgs(a => [a.require('text'), a.optional('splitter')])
        .withDesc('Splits `text` using `splitter`, and the returns an array.')
        .withExample(
            '{split;Hello! This is a sentence.;{space}}',
            '["Hello!","This","is","a","sentence."]'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            return bu.serializeTagArray(args[0].split(args[1]));
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();