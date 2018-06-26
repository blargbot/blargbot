/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:54
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:19:18
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('ban')
        .requireStaff()
        .withArgs(a => [
            a.require('user'),
            a.optional('daysToDelete'),
            a.optional('reason'),
            a.optional('timeToUnban'),
            a.optional('noperms')
        ]).withDesc('Bans `user`. ' +
            'This functions the same as the ban command. ' +
            'If the ban is successful, `Success` will be returned, unless a duration was provided in which case the duration in ms will be returned' +
            'If `noperms` is provided, do not check if the command executor is actually able to ban people. ' +
            'Only provide this if you know what you\'re doing.'
        ).withExample(
            '{ban;stupid cat;0;This is a test ban} @stupid cat was banned!',
            'Success @stupid cat was banned!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-5', async function (subtag, context, args) {
            let user = await context.getUser(args[0], {
                quiet: true, suppress: context.scope.suppressLookup,
                label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
            });

            if (!user)
                return Builder.errors.noUserFound(subtag, context);

            let noPerms = args[4] ? true : false;
            let duration;

            if (args[3])
                duration = bu.parseDuration(args[3]);

            let response = await CommandManager.built['ban'].ban(
                context.msg,
                user,
                args[1],
                args[2],
                duration,
                true,
                noPerms
            );

            if (typeof response[1] == 'string' && response[1].startsWith('`'))
                return Builder.util.error(subtag, context, response[1]);

            return response[1];
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();