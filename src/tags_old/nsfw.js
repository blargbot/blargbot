/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:20
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('nsfw')
        .withArgs(a => a.optional('message'))
        .withDesc('Marks the output as being NSFW, and only to be sent in NSFW channels. A requirement for any tag with NSFW content. ' +
            '`message` is the error to show, defaults to "❌ This contains NSFW content! Go to a NSFW channel. ❌"')
        .withExample(
            'This command is not safe! {nsfw}',
            'This command is not safe!'
        )
        .whenArgs('0-1', async function (_, context, args) {
            context.state.nsfw = args[0] || '❌ This contains NSFW content! Go to a NSFW channel. ❌';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();