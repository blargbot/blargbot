/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-09-15 11:11:42
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('slowmode')
        .withArgs(a => [a.optional('channel'), a.optional('time')])
        .withDesc('Enables slowmode for the specified channel. `time` is the amount of seconds required between messages, with a maximum of 120. `channel` is the channel to modify, defaulting to the current one.')
        .withExample(
            '{slowmode;5}',
            '(slowmode is enabled at a rate of 1 message per 5 seconds)'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            let channel = await Builder.util.parseChannel(context, args[0], { quiet: true, suppress: context.scope.suppressLookup }),
                time = parseInt(args[1]);
            if (!channel) {
                time = parseInt(args[0]);
                channel = context.channel;
            }
            if (channel.guild.id != context.guild.id)
                return Builder.errors.channelNotInGuild(subtag, context);
            if (isNaN(time)) time = 0;

            let endpoint = Endpoints.CHANNEL(channel.id);
            time = Math.min(time, 120);

            try {
                await channel.edit({
                    rateLimitPerUser: time,
                    reason: context.scope.reason || 'Initiated from BBTag by ' + bu.getFullName(context.user)
                });
            } catch (err) {
                return Builder.errors.missingPermissions(subtag, context);
            }
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();