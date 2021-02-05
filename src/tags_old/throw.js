/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:05:37
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-29 14:40:10
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('throw')
        .withArgs(a => a.optional('error'))
        .withDesc('Throws `error`.')
        .withExample(
            '{throw;Custom Error}',
            '\u200B`Custom Error`\u200B'
        )
        .whenArgs('0-1', async (subtag, context, args) => Builder.util.error(subtag, context, args[0] || 'A custom error occurred'))
        .whenDefault(Builder.errors.tooManyArguments)
        .build();