/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-08-30 14:46:52
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

function getUrls(message) {
    return JSON.stringify(message.attachments.map(a => a.url));
}

module.exports =
    Builder.APITag('messageattachments')
        .withAlias('attachments')
        .withArgs(a => a.optional([a.optional('channel'), a.require('messageid')]))
        .withDesc('Returns the array of attachment that a message contains in the given channel.' +
        '\n`channel` defaults to the current channel' +
        '\n`messageid` defaults to the executing message id')
        .withExample(
        'You sent the attachments "{messageattachments}"',
        'You sent the attachments "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"'
        )
        .whenArgs(0, async (_, context) => getUrls(context.msg))
        .whenArgs(1, async function (subtag, context, args) {
            return this.getMessageAttachments(subtag, context, context.channel.id, args[0]);
        })
        .whenArgs(2, async function (subtag, context, args) {
            const channel = await Builder.util.parseChannel(context, args[0], { quiet: true });
            if (typeof channel == "function") 
                return channel(subtag, context);
            return this.getMessageAttachments(subtag, context, channel.id, args[1]);
        })
        .withProp("getMessageAttachments", async function (subtag, context, channelId, messageId) {
            const message = await bu.getMessage(channelId, messageId);
            return message
              ? getUrls(message)
              : Builder.errors.noMessageFound(subtag, context);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();