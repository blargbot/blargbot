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
            a.required('messageId'),
            a.required([a.optional('user', true), a.optional('reactions')])
        ])
        .withDesc('Removes `reactions` from `messageId` which were placed by `user`.\n`user` defaults to the user who executed the tag.\n' +
            '`reactions` defaults to all reactions.\n`channelId` defaults to the current channel.'
            + '\nOnly one `user` may be provided. Only a certain number reaction remove attempts can be done per tag, after which they\'ll be silently ignored.')
        .withExample(
            '{reactremove;12345678901234;:thinking:}',
            '(removed the 🤔 reaction by the user)'
        ).whenDefault(async function (subtag, context, emotes) {
            let channel = null;
            let message = null;
            let users = [];
            let parsed;

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
            } catch (e) {
                // NOOP
            }

            if (message == null)
                return Builder.errors.noMessageFound(subtag, context);

            if (!(await context.isStaff || context.ownsMessage(message.id)))
                return Builder.util.error(subtag, context, 'Author must be staff to modify unrelated messages');

            emotes.shift();

            // Loop through the "emotes" and check if each is a user. If it is not, then break
            let emote;
            while ((emote = emotes.shift()) !== undefined) {
                let deserialized = await bu.deserializeTagArray(emote);
                let entries = deserialized && Array.isArray(deserialized.v)
                    ? deserialized.v
                    : [emote];
                entries = await Promise.all(entries.map(entry => context.getUser(entry, {
                    quiet: true, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.rootTagName || 'unknown'}\``
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

            let user = users[0].id;

            // Default to all emotes
            if (parsed.length == 0)
                parsed = Object.keys(message.reactions);

            // Perform removal for each reaction for each user
            let remaining = context.state.limits.reactremove || { requests: 20 };

            let errored = [];
            for (const reaction of parsed) {
                if (!message.reactions[reaction]) continue;

                try {
                    if (remaining.requests > 0) {
                        await message.removeReaction(reaction, user);

                        remaining.requests--;
                    }
                } catch (err) {
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

            if (errored.length > 0)
                return Builder.util.error(subtag, context, 'Unknown Emoji: ' + errored.join(', '));
        })
        .build();
