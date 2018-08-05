/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:35
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:18:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('reactremove')
        .withAlias('removereact')
        .withArgs(a => [
            a.optional('channelId'),
            a.require('messageId'),
            a.require([a.optional('users', true), a.optional('reactions')])
        ])
        .withDesc('Removes `reactions` from `messageId` which were placed by `users`.\n`users` defaults to the user who executed the tag.\n' +
            '`reactions` defaults to all reactions.\n`channelId` defaults to the current channel.')
        .withExample(
            '{reactremove;12345678901234;:thinking:}',
            '(removed the 🤔 reaction by the user)'
        ).whenDefault(async function (subtag, context, emotes) {
            let channel = null,
                message = null,
                users = [],
                parsed;

            // Check if the first "emote" is actually a valid channel
            channel = bu.parseChannel(emotes[0], true);
            if (channel == null)
                channel = context.channel;
            else
                emotes.shift();

            if (!channel.guild || !context.guild || channel.guild.id != context.guild.id)
                return Builder.errors.channelNotInGuild(subtag, context);

            // Check that the current first "emote" is a message id
            try {
                message = await bot.getMessage(channel.id, emotes[0]);
            } catch (e) { }
            finally {
                if (message == null)
                    return Builder.errors.noMessageFound(subtag, context);
            }
            emotes.shift();

            // Loop through the "emotes" and check if each is a user. If it is not, then break
            let emote;
            while (emote = emotes.shift()) {
                let deserialized = await bu.deserializeTagArray(emote);
                let entries = deserialized && Array.isArray(deserialized.v)
                    ? deserialized.v
                    : [emote];
                entries = await Promise.all(entries.map(entry => context.getUser(entry, {
                    quiet: true, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                })));
                if (entries.reduce((c, entry) => c && entry == null, true)) {
                    emotes.splice(0, 0, emote);
                    break;
                }
                users.push(...entries);
            }

            // Find all actual emotes in remaining emotes
            parsed = bu.findEmoji(emotes.join('|'), true);

            if (parsed.length == 0 && emotes.length != 0)
                return Builder.util.error(subtag, context, 'Invalid Emojis');

            // Default to current user
            if (users.length == 0)
                users.push(context.user);

            // Default to all emotes
            if (parsed.length == 0)
                parsed = Object.keys(message.reactions);

            // Perform removal for each reaction for each user
            let errored = [];
            for (const reaction of parsed) {
                for (const user of users) {
                    try {
                        await message.removeReaction(reaction, user.id);
                    }
                    catch (err) {
                        switch (err.code) {
                            case 10014:
                                errored.push(reaction);
                                break;
                            case 50013:
                                return Builder.util.error(subtag, context, 'I need to be able to Manage Messages to remove reactions');
                            default:
                                throw err;
                        }
                    }
                }
            }

            if (errored.length > 0)
                return Builder.util.error(subtag, context, 'Unknown Emoji: ' + errored.join(', '));
        })
        .build();