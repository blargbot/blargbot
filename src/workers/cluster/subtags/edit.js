/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:33:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-20 09:38:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('edit')
        .withArgs(a => [a.optional('channelId'), a.required('messageId'), a.required([a.optional('text'), a.optional('embed')])])
        .withDesc('Edits `messageId` in `channelId` to say `text` or `embed`. ' +
            'Atleast one of `text` and `embed` is required. To delete the message text or the embed, enter `_delete`' +
            'If `channelId` is not supplied, it defaults to the current channel.\n' +
            'Please note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show.\n' +
            'Only messages created by the bot may be edited')
        .withExample(
            'A message got edited: {edit;111111111111111111;New content;{embedbuild;title:You\'re cool}}',
            '(the message got edited idk how to do examples for this)'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs(2, async function (subtag, context, args) { //args = [<messageId>,<text|embed>]
            let text = args[1];
            let embed = bu.parseEmbed(args[1]);

            if (embed != null && !embed.malformed)
                text = undefined; //args = [<messageId>,<embed>]
            else
                embed = undefined; //args = [<messageId>,<text>]

            return await this.runEdit(subtag, context, context.channel, args[0], text, embed);
        })
        .whenArgs(3, async function (subtag, context, args) { //args = [(<messageId>,<text>,<embed>)|(<channelid>,<messageId>,<text|embed>)]
            let channel = bu.parseChannel(args[0], true);
            if (channel == null) { //args = [<messageId>,<text>,<embed>]
                let text = args[1] || undefined;
                let embed = bu.parseEmbed(args[2]);
                if (!embed || embed.malformed) embed = args[2];
                return await this.runEdit(subtag, context, context.channel, args[0], text, embed);
            }

            let text = args[2];
            let embed = bu.parseEmbed(args[2]);

            if (embed != null && !embed.malformed)
                text = undefined; //args = [<channelId>,<messageId>,<embed>]
            else
                embed = undefined; //args = [<channelId>,<messageId>,<text>]
            return await this.runEdit(subtag, context, channel, args[1], text, embed);
        })
        .whenArgs(4, async function (subtag, context, args) { //args = [<channelId>,<messageId>,<text>,<embed>]
            let channel = bu.parseChannel(args[0], true);
            let messageId = args[1];
            let text = args[2] || undefined;
            let embed = bu.parseEmbed(args[3]) || args[3];
            if (!embed || embed.malformed) embed = args[3];
            return await this.runEdit(subtag, context, channel, messageId, text, embed);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .withProp('runEdit', async function (subtag, context, channel, messageId, text, embed) {
            if (!(await context.isStaff || context.ownsMessage(messageId)))
                return Builder.util.error(subtag, context, 'Author must be staff to edit unrelated messages');

            if (channel == null)
                return Builder.errors.noChannelFound(subtag, context);
            if (!channel.guild || !context.guild || channel.guild.id != context.guild.id)
                return Builder.errors.channelNotInGuild(subtag, context);

            let message;
            try {
                message = await bot.getMessage(channel.id, messageId);
            } catch (err) {
                if (err.code == 10008)
                    return Builder.errors.noMessageFound(subtag, context);
                return Builder.util.error(subtag, context, 'Unable to get message');
            }

            if (message == null) return Builder.errors.noMessageFound(subtag, context);
            if (message.author.id != bot.user.id) return Builder.util.error(subtag, context, 'I must be the message author');

            text = text || message.content;
            embed = embed || message.embeds[0];

            if (text == '_delete') text = '';
            if (embed == '_delete') embed = null;
            if (typeof embed === 'string') embed = undefined;

            if ((text == null || text.trim() == '') && embed == null)
                return Builder.util.error(subtag, context, 'Message cannot be empty');

            // For text:
            // '' = empty
            // null = 'null'
            // undefined = dont change

            // For embed:
            // null = remove
            // undefined = dont change

            try {
                if (message.edit)
                    message.edit({
                        content: text,
                        embed: embed
                    });
            } catch (err) {
                // NOOP
            }
        })
        .build();
