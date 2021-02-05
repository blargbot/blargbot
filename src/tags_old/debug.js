/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-10-05 17:19:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('debug')
        .withArgs(a => a.optional('text', true))
        .withDesc('Adds the specified text to the debug output. This output is only shown via ' +
            '`tag debug`, `ccommand debug`, `tag test debug` and `ccommand test debug`.' +
            'The line number is also included in the debug entry')
        .withExample(
            '{debug;current value;{get;~i}}',
            '(in debug output)[10]current value 1'
        )
        .whenDefault(async function (subtag, context, args) {
            context.debug.push({ tag: subtag, text: args.join(' ') });
        })
        .build();