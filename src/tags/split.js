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
        .withDesc('Splits text using the provided splitter, and the returns an array.')
        .withExample(
            '{split;Hello! This is a sentence.;{space}}',
            '["Hello!","This","is","a","sentence."]'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (params) {
            return bu.serializeTagArray(params.args[1].split(params.args[2]));
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();