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
        .withArgs(a => [a.require('channel'), a.require('message')])
        .withDesc('Sends `message` to `channel`, and returns the message ID. `channel` is either an ID or channel mention.')
        .withExample(
            '{send;#channel;Hello!}',
            '1111111111111111111\nIn #channel: Hello!'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3', async function (params) {
            let channel = bu.parseChannel(params.args[1], true),
                message = params.args[2];

            if (channel == null) return await Builder.errors.noChannelFound(params);
            if (channel.guild.id != params.msg.guild.id) return await Builder.errors.channelNotInGuild(params);

            let sent = await bu.send(channel.id, {
                content: params.args[2],
                disableEveryone: false
            });

            return sent.id;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();