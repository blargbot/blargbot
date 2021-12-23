/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:54:23
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:54:23
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const { FlowState } = require('../structures/bbtag/FlowControl');
const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('yield')
        .withArgs(a => [a.optional('content')])
        .withDesc('Appends to the output of the current tag without returning anything. ' +
            'If you are going to use this in a tag, make sure at least 1 `{yield}` is guaranteed to execute otherwise you might get ' +
            'the normal output rather than blank like you would expect')
        .withExample(
            '{yield;Hi!}\nThis is invisible\n{yield;{space}My name is blargbot!}',
            'Hi! My name is blargbot!'
        )
        .whenArgs('0-1', async function (subtag, context, args) {
            const i = context.state.tagResults.length - 1;
            context.state.tagResults[i] = (context.state.tagResults[i] || '') + (args[0] || '');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();