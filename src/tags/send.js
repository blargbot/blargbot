/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:04
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-10-13 11:14:44
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('send')
        .withArgs(a => [a.require('channel'), a.require([a.optional('message'), a.optional('embed')]), a.optional('file'), a.optional('filename')])
        .withDesc('Sends `message` and `embed` to `channel`, and returns the message ID. `channel` is either an ID or channel mention. ' +
            'At least one out of `message` and `embed` must be supplied.\nIf `file` is provided, `filename` will default to `file.txt`.\n' +
            'Please note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show')
        .withExample(
            '{send;#channel;Hello!;{embedbuild;title:You\'re cool}}',
            '1111111111111111111\nIn #channel: Hello!\nEmbed: You\'re cool'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-5', async function (subtag, context, args) {
            let channel = bu.parseChannel(args[0], true),
                message = args[1],
                embed = bu.parseEmbed(args[1]);

            if (embed != null && !embed.malformed)
                message = undefined;
            else
                embed = bu.parseEmbed(args[2]);

            if (channel == null)
                return Builder.errors.noChannelFound(subtag, context);
            if (channel.guild.id != context.guild.id)
                return Builder.errors.channelNotInGuild(subtag, context);

            let file = args[3], filename = args[4];
            if (file && !filename) filename = 'file.txt';
            if (file) {
                if (!filename) filename = 'file.txt';
                file = { file, name: filename };

                if (file.file.startsWith('buffer:')) {
                    file.file = Buffer.from(file.file.substring(7), 'base64');
                }
            }
            try {
                let sent = await bu.send(channel.id, {
                    content: message,
                    embed: embed,
                    nsfw: context.state.nsfw,
                    allowedMentions: {
                        everyone: true,
                        users: true,
                        roles: true
                    }
                }, file);

                if (!sent) throw new Error('Send unsuccessful');

                context.state.ownedMsgs.push(sent.id);

                return sent.id;
            } catch (err) {
                return Builder.util.error(subtag, context, 'Failed to send: ' + err.message);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();