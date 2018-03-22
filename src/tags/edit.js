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
    Builder.CCommandTag('edit')
        .requireStaff()
        .withArgs(a => [a.optional('channelId'), a.require('messageId'), a.require([a.optional('text'), a.optional('embed')])])
        .withDesc('Edits `messageId` in `channelId` to say `text` or `embed`. ' +
            'Atleast one of `text` and `embed` is required. ' +
            'If `channelId` is not supplied, it defaults to the current channel.\n' +
            'Please note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show.\n' +
            'Only messages created by the bot may be edited')
        .withExample(
            'A message got edited: {edit;111111111111111111;New content;{buildembed;title:You\'re cool}}',
            '(the message got edited idk how to do examples for this)'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (subtag, context, args) { //args = [<messageId>,<text|embed>]
            let message = args[1],
                embed = bu.parseEmbed(args[1]);

            if (embed != null && !embed.malformed)
                message = undefined; //args = [<messageId>,<embed>]
            else
                embed = undefined; //args = [<messageId>,<text>]

            return await this.runEdit(subtag, context, context.channel, args[0], message, embed);
        })
        .whenArgs('4', async function (subtag, context, args) { //args = [(<messageId>,<text>,<embed>)|(<channelid>,<messageId>,<text|embed>)]

            let channel = bu.parseChannel(args[0], true);
            if (channel == null) { //args = [<messageId>,<text>,<embed>]
                let text = args[1],
                    embed = bu.parseEmbed(args[2]);
                return await this.runEdit(subtag, context, context.channel, args[0], text, embed);
            }

            let text = args[2],
                embed = bu.parseEmbed(args[2]);

            if (embed != null && !embed.malformed)
                text = null; //args = [<channelId>,<messageId>,<embed>]
            else
                embed = null; //args = [<channelId>,<messageId>,<text>]
            return await this.runEdit(subtag, context, channel, args[1], text, embed);
        })
        .whenArgs('5', async function (subtag, context, args) { //args = [<channelId>,<messageId>,<text>,<embed>]
            let channel = bu.parseChannel(args[0], true),
                messageId = args[1],
                text = args[2],
                embed = bu.parseEmbed(args[3]);
            return await this.runEdit(subtag, context, channel, messageId, text, embed);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .withProp('runEdit', async function (subtag, context, channel, messageId, text, embed) {
            if (channel == null)
                return Builder.errors.noChannelFound(subtag, context);
            if (!channel.guild || !context.guild || channel.guild.id != context.guild.id)
                return Builder.errors.channelNotInGuild(subtag, context);

            let message = await bot.getMessage(channel.id, messageId);

            if (message == null) return Builder.errors.noMessageFound(subtag, context);
            if (message.author.id != bot.user.id) return Builder.util.error(subtag, context, 'I must be the message author');

            if ((text == null || text.trim() == '') && embed == null)
                return Builder.util.error(subtag, context, 'Message cannot be empty');

            try {
                if (message.edit)
                    message.edit({
                        content: text || message.content,
                        embed: embed || message.embeds[0]
                    });
            } catch (err) { }
        })
        .build();