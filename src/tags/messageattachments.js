/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:03
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:50:03
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

function getUrls(message) {
    return JSON.stringify(message.attachments.map(a => a.url));
}

module.exports =
    Builder.AutoTag('messageattachments')
        .withAlias('attachments')
        .withArgs(a => a.optional([a.optional('channel'), a.require('messageid')]))
        .withDesc('Returns the array of attachment uthe attachments in the given channel.' +
            '\n`channel` defaults to the current channel' +
            '\n`messageid` defaults to the executing message id')
        .withExample(
            'You sent the attachments "{messageattachments}"',
            'You sent the attachments "["https://cdn.discordapp.com/attachments/1111111111111/111111111111111/thisisntreal.png"]"'
        )
        .whenArgs(0, async (_, context) => getUrls(context.msg))
        .whenArgs(1, async function (subtag, context, args) {
            let message = await bu.getMessage(context.channel.id, args[0]);

            if (message != null)
                return getUrls(message);
            return Builder.errors.noMessageFound(subtag, context);
        })
        .whenArgs(2, async function (subtag, context, args) {
            let channel = Builder.util.parseChannel(context, args[0]);
            if (typeof channel == "function")
                return channel(subtag, context);

            let message = await bu.getMessage(channel.id, args[1]);

            if (message != null)
                return getUrls(message);
            return Builder.errors.noMessageFound(subtag, context);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();