/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:27:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('brainfuck')
    .withArgs(a => [a.require('code'), a.optional('input')])
    .withDesc('Interprets `code` as brainfuck, using `input` as the text for `,`.')
    .withExample(
        '{brainfuck;++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.}',
        'Hello World!'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-3', async function(params) {
        try {
            return await bu.filterMentions((dep.brainfuck.execute(params.args[1], params.args[2])).output);
        } catch (e) {
            return await Builder.util.error(params, e.message);
        }
    }).whenDefault(Builder.errors.tooManyArguments)
    .build();