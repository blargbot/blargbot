/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-01-01 16:39:53
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('timer')
        .withArgs(a => [a.require('code'), a.require('duration')])
        .withDesc('Executes `code` after `duration`. ' +
            'Three timers are allowed per custom command, with no recursive timers.')
        .withExample(
            '{timer;Hello!;20s}',
            '(after 20 seconds:) Hello!'
        ).whenArgs('1-2', Builder.errors.notEnoughArguments)
        .whenArgs('3', async function (params) {
            if (params.disabletimer)
                return await Builder.util.error(params, 'Nested timers are not allowed');

            let code = params.args[1],
                duration = await bu.processTagInner(params, 2);

            duration = bu.parseDuration(duration);

            if (duration.asMilliseconds() <= 0) return await Builder.util.error(params, 'Invalid duration');

            if (params.timers > 2) return await Builder.util.error(params, 'Max 3 timers per tag');

            let msg = params.msg;
            params.msg = msg.id;
            params.disabletimer = true;
            await r.table('events').insert({
                type: 'tag',
                params,
                msg: JSON.stringify(msg),
                channel: msg.channel.id,
                endtime: r.epochTime(dep.moment().add(duration).unix())
            });
            params.msg = msg;
            return {
                timers: (params.timers || 0) + 1
            };
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();