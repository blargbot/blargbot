/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-06-13 15:02:26
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('messageembeds')
        .withArgs(a => a.optional([a.optional('channel'), a.require('messageid')]))
        .withDesc('Returns the array of embeds on the given message in the given channel.' +
            '\n`channel` defaults to the current channel' +
            '\n`messageid` defaults to the executing message id')
        .withExample(
            'You sent an embed that looked like "{messageembed}"',
            'You sent an embed that looked like "[{"title":"Hello!"}]"'
        )
        .whenArgs(0, async (_, context) => JSON.stringify(context.msg.embeds))
        .whenArgs(1, async function (subtag, context, args) {
            return this.getMessageEmbeds(subtag, context, context.channel.id, args[0]);
        })
        .whenArgs(2, async function (subtag, context, args) {
            let channel = await Builder.util.parseChannel(context, args[0], { quiet: true, suppress: context.scope.suppressLookup });
            if (!channel)
                return Builder.errors.noChannelFound(subtag, context);
            return this.getMessageEmbeds(subtag, context, channel.id, args[1]);
        })
        .withProp("getMessageEmbeds", async function (subtag, context, channelId, messageId) {
            const message = await bu.getMessage(channelId, messageId);
            return message
                ? JSON.stringify(message.embeds)
                : Builder.errors.noMessageFound(subtag, context);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();