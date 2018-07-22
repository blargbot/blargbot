/*
 * @Author: stupid cat
 * @Date: 2017-05-21 12:20:00
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:19:14
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder'),
    DMCache = {};

module.exports =
    Builder.APITag('dm')
        .withArgs(a => [a.require('user'), a.require([a.optional('message'), a.optional('embed')])])
        .withDesc('DMs `user` the given `message` and `embed`. At least one of `message` and `embed` must be provided. ' +
            'You may only send one DM per execution. Requires author to be staff, and the user to be on the current guild.\n' +
            'Please note that `embed` is the JSON for an embed object, don\'t put the `{embed}` subtag there, as nothing will show.'
        ).withExample(
            '{dm;stupid cat;Hello;{embedbuild;title:You\'re cool}}',
            'DM: Hello\nEmbed: You\'re cool'
        )
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (subtag, context, args) {
            if (context.state.count.dm > 0)
                return Builder.util.error(subtag, context, 'Already have DMed');

            let user = await context.getUser(args[0], {
                suppress: context.scope.suppressLookup,
                label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
            }),
                content = args[1],
                embed = bu.parseEmbed(args[1]);

            if (user == null)
                return Builder.errors.noUserFound(subtag, context);
            if (!context.guild.members.get(user.id))
                return Builder.errors.userNotInGuild(subtag, context);

            if (embed != null && !embed.malformed)
                content = undefined;
            else
                embed = bu.parseEmbed(args[2]);

            try {
                const DMChannel = await user.getDMChannel();
                if (!DMCache[user.id] ||
                    DMCache[user.id].count > 5 ||
                    DMCache[user.id].user != context.user.id ||
                    DMCache[user.id].guild != context.guild.id) {
                    // Ew we're gonna send a message first? It was voted...
                    await bu.send(DMChannel.id, 'The following message was sent from ' +
                        `**__${context.guild.name}__** (${context.guild.id}), ` +
                        'and was sent by ' +
                        `**__${bu.getFullName(context.user)}__** (${context.user.id}):`
                    );
                    DMCache[user.id] = { user: context.user.id, guild: context.guild.id, count: 1 };
                }
                await bu.send(DMChannel.id, {
                    content,
                    embed,
                    nsfw: context.state.nsfw
                });
                DMCache[user.id].count++;
                context.state.count.dm += 1;
            } catch (e) {
                return Builder.util.error(subtag, context, 'Could not send DM');
            }
        }).whenDefault(Builder.errors.tooManyArguments)
        .build();