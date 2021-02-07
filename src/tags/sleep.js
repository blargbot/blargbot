/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:57:14
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-07-22 16:12:48
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');
const moment = require('moment-timezone');

module.exports =
    Builder.AutoTag('sleep')
        .withArgs(a => a.required('duration'))
        .withDesc('Pauses the current tag for the specified amount of time. Maximum is 5 minutes'
        ).withExample(
            '{sleep;10s}{send;{channelid};Hi!}',
            '(After 10s) Hi!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let duration = bu.parseDuration(args[0]);
            let ms = duration.asMilliseconds();

            let { max } = context.state.limits.sleep || { max: 300000 };

            if (ms <= 0)
                return Builder.util.error(subtag, context, 'Invalid duration');
            if (ms > max)
                ms = max;

            await new Promise(function (resolve) {
                setTimeout(() => resolve(), ms);
            });
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();