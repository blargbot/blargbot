/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:33:45
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:34:15
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('edit')
        .requireStaff()
        .withArgs(a => [a.optional('channelid'), a.require('messageid'), a.require('message')])
        .withDesc('Edits a message outputted by the bot with the given message ID. The channel defaults to the current channel.')
        .withExample(
            'A message got edited: {edit;111111111111111111;New content}',
            '(the message got edited idk how to do examples for this)'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3-4', async function(params) {
            let content, messageId, channel;

            if (params.args.length == 3) {
                channel = params.msg.channel;
                messageId = params.args[1];
                content = params.args[2];
            } else {
                channel = Builder.util.parseChannel(params.args[1]);
                messageId = params.args[2];
                content = params.args[3];

                if (typeof channel == 'function')
                    return await channel(params);
            }

            if (!content)
                return await Builder.util.error('New message cannot be empty');

            let message = await bot.getMessage(channel.id, messageId);

            if (message == null)
                return await Builder.errors.noMessageFound(params);
            if (message.author.id !== bot.user.id)
                return await Builder.util.error('I must be message author');

            try {
                if (message.edit)
                    message.edit(content);
            } catch (err) { }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();