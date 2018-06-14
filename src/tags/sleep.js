/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 11:30:13
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('sleep')
        .withArgs(a => a.require('duration'))
        .withDesc('Pauses the current tag for the specified amount of time. Maximum is 5 minutes'
        ).withExample(
            '{sleep;10s}{send;{channelid};Hi!}',
            '(After 10s) Hi!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let duration = bu.parseDuration(args[0]);

            if (duration.asMilliseconds() <= 0)
                return Builder.util.error(subtag, context, 'Invalid duration');
            if (duration.asMilliseconds() > 300000)
                duration = dep.moment(300000);

            await new Promise(function (resolve) {
                setTimeout(() => resolve(), duration.asMilliseconds());
            });
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();