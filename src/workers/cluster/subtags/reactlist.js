/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:51:35
 * @Last Modified by: stupid cat
 * @Last Modified time: 2019-08-03 17:43:40
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const { distinct } = require('../utils/iterables');

module.exports =
    Builder.APITag('reactlist')
        .withAlias('listreact')
        .withArgs(a => [
            a.optional([a.optional('channelId'),
                a.required('messageId')]),
            a.optional('reactions', true)
        ])
        .withDesc(
            'Lists reaction data about the given `messageId`. If `reactions` is supplied, then a list of users ' +
            'who have added those reactions will be returned. If `reactions` is not supplied then a list of all reactions ' +
            'on the given `messageId` will be given.\n`messageId` defaults to the command message.\n`channelId` defaults ' +
            'to the current channel.')
        .withExample(
            '{reactlist}\n{reactlist;:thinking:}',
            '["🤔","😂"]\n["1111111111111","2222222222222","1234567890123"]'
        ).whenDefault(async function (subtag, context, emotes) {
            let channel = null,
                message = null;

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
            if (message == null)
                return Builder.errors.noMessageFound(subtag, context);
            emotes.shift();

            // Find all actual emotes in remaining emotes
            let parsed = bu.findEmoji(emotes.join('|'), true);

            if (parsed.length == 0 && emotes.length > 0)
                return Builder.util.error(subtag, context, 'Invalid Emojis');

            // Default to listing what emotes there are
            if (parsed.length == 0)
                return JSON.stringify(Object.keys(message.reactions));

            // List all users per reaction
            let users = [];
            let errors = [];
            for (let emote of parsed) {
                emote = emote.replace(/^a?:/gi, '');
                if (!(emote in message.reactions)) {
                    continue;
                }
                try {
                    const escaped = emote.replace(/^a?:/gi, '');
                    do {
                        let lastUser = users.length === 0 ? null : users[users.length - 1].id;
                        users.push(...await message.getReaction(emote, 100, null, lastUser));
                    } while (users.length < message.reactions[emote].count);
                } catch (err) {
                    if (err.message == 'Unknown Emoji')
                        errors.push(emote);
                    else
                        throw err;
                }
            }

            if (errors.length > 0)
                return Builder.util.error(subtag, context, 'Unknown Emoji: ' + errors.join(', '));
            users = users.map(u => u.id);
            return JSON.stringify([...distinct(users)]);
        })
        .build();
