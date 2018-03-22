/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:04
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:57:04
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('send')
        .requireStaff()
        .withArgs(a => [a.require('channel'), a.require([a.optional('message'), a.optional('embed')])])
        .withDesc('Sends `message` and `embed` to `channel`, and returns the message ID. `channel` is either an ID or channel mention. ' +
            'At least one out of `message` and `embed` must be supplied')
        .withExample(
            '{send;#channel;Hello!}',
            '1111111111111111111\nIn #channel: Hello!'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (subtag, context, args) {
            let channel = bu.parseChannel(args[0], true),
                message = args[1],
                embed = bu.parseEmbed(args[1]);

            if (!embed.malformed)
                message = undefined;
            else
                embed = bu.parseEmbed(args[2]);

            if (channel == null)
                return Builder.errors.noChannelFound(subtag, context);
            if (channel.guild.id != context.guild.id)
                return Builder.errors.channelNotInGuild(subtag, context);

            let sent = await bu.send(channel.id, {
                content: message,
                embed: embed,
                nsfw: context.state.nsfw,
                disableEveryone: false
            });

            return sent.id;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();