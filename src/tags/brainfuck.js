/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:27:21
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:27:21
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const Brainfuck = require('brainfuck-node');
const bfClient = new Brainfuck();

module.exports =
    Builder.AutoTag('brainfuck')
        .withArgs(a => [a.require('code'), a.optional('input')])
        .withDesc('Interprets `code` as brainfuck, using `input` as the text for `,`.')
        .withExample(
            '{brainfuck;++++++++++[>+++++++>++++++++++>+++>+<<<<-]>++.>+.+++++++..+++.>++.<<+++++++++++++++.>.+++.------.--------.>+.>.}',
            'Hello World!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            try {
                return await bu.filterMentions((bfClient.execute(...args)).output);
            } catch (e) {
                return Builder.util.error(subtag, context, e.message);
            }
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();