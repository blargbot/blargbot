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
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-4', async function (params) {
            let channel = bu.parseChannel(params.args[1], true),
                message = params.args[2],
                embed = bu.parseEmbed(params.args[2]);

            if (!embed.malformed)
                message = undefined;
            else
                embed = bu.parseEmbed(params.args[3]);

            if (channel == null) return await Builder.errors.noChannelFound(params);
            if (channel.guild.id != params.msg.guild.id) return await Builder.errors.channelNotInGuild(params);

            let sent = await bu.send(channel.id, {
                content: message,
                embed: embed,
                nsfw: params.nsfw,
                disableEveryone: false
            });

            return sent.id;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();