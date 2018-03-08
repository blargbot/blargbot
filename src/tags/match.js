/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:49:46
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:49:46
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.ArrayTag('match')
        .withArgs(a => [a.require('text'), a.require('regex')])
        .withDesc('Returns an array of everything in `text` that matches `regex`.')
        .withExample(
            '{match;I have $1 and 25 cents;/\\d+/g}',
            '["1", "25"]'
        ).beforeExecute(params => Builder.util.processSubtags(params, [1]))
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3', async function (params) {
            let text = params.args[1],
                regex;

            try {
                regex = bu.createRegExp(params.args[2]);
            }
            catch (e) {
                return await Builder.errors.unsafeRegex(params);
            }

            return bu.serializeTagArray(text.match(regex) || []);
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();