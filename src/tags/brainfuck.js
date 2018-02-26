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
    Builder.ComplexTag('brainfuck')
    .withArgs(b => 
        b.require('code').optional('input')
    ).withDesc('Interprets brainfuck input.')
    .withExample(
        '{brainfuck;++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.}',
        'Hello World!'
    ).beforeExecute(Builder.defaults.processAllSubtags)
    .whenArgs('1', Builder.defaults.notEnoughArguments)
    .whenArgs('2-3', async params => {
        try {
            return await bu.filterMentions((dep.brainfuck.execute(params.args[1], params.args[2])).output);
        } catch (e) {
            return await bu.tagProcessError(params, '`' + e.message + '`');
        }
    }).whenDefault(Builder.defaults.tooManyArguments)
    .build();