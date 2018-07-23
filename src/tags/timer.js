/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-03-31 12:33:34
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const moment = require('moment-timezone');

module.exports =
    Builder.BotTag('timer')
        .withArgs(a => [a.require('code'), a.require('duration')])
        .withDesc('Executes `code` after `duration`. ' +
            'Three timers are allowed per custom command, with no recursive timers.')
        .withExample(
            '{timer;Hello!;20s}',
            '(after 20 seconds:) Hello!'
        ).resolveArgs(1)
        .whenArgs('0-1', Builder.errors.notEnoughArguments)
        .whenArgs(2, async function (subtag, context, args) {
            let duration = bu.parseDuration(args[1]);

            if (duration.asMilliseconds() <= 0) return Builder.util.error(subtag, context, 'Invalid duration');

            await r.table('events').insert({
                type: 'tag',
                version: 3,
                source: context.guild ? context.guild.id : context.user.id,
                user: context.user.id,
                channel: context.channel.id,
                endtime: r.epochTime(moment().add(duration).unix()),
                starttime: r.epochTime(moment().unix()),
                context: context.serialize(),
                content: args[0].content
            });
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();