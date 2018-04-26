/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:35
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-04-26 12:06:24
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('addreact')
        .withArgs(a => [a.optional([a.optional('channelId'), a.require('messageId')]), a.require('emotes', true)])
        .withDesc('Adds `emotes` as reactions to the given `messageId`. If the `messageId` is not supplied, ' +
            'it instead adds the `emotes` to the output from the containing tag.\n' +
            'Please note that to be able to add a reaction, I must be on the server that you got that reaction from. ' +
            'If I am not, then I will return an error if you are trying to apply the reaction to another message.')
        .withExample(
            '{addreact;:thinking:;:joy:}',
            '(On message) 🤔(1) 😂(1)'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenDefault(async function (subtag, context, emotes) {
            let channel = null,
                message = null;

            channel = bu.parseChannel(emotes[0], true);
            if (channel == null)
                channel = context.channel;
            else
                emotes.shift();

            if (!channel.guild || !context.guild || channel.guild.id != context.guild.id)
                return Builder.errors.channelNotInGuild(subtag, context);


            if (/^\d{17,23}$/.test(emotes[0]))
                try {
                    message = await bot.getMessage(channel.id, emotes[0]);
                } catch (e) { }

            if (message != null)
                emotes.shift();

            if (message != null) {
                try {
                    for (const reaction of emotes)
                        await bot.addMessageReaction(channel.id, message.id, reaction.replace(/[<>]/g, ''));
                } catch (e) {
                    if (e.response.message == 'Unknown Emoji')
                        return Builder.util.error(subtag, context, 'Unknown emoji');
                    console.error(e);
                }
                return;
            }

            for (const emote of emotes)
                context.state.reactions.push(emote);
        })
        .build();