/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:10
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:18:12
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.BotTag('warnings')
        .withArgs(a => a.optional('user'))
        .withDesc('Gets the number of warnings `user` has. `user` defaults to the user who executed the containing tag.')
        .withExample(
            'You have {warnings} warning(s)!',
            'You have 0 warning(s)!'
        )
        .whenArgs('0-1', async function (subtag, context, args) {
            let user = context.user;

            if (args[0])
                user = await context.getUser(args[0], {
                    suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user == null)
                return Builder.errors.noUserFound(subtag, context);

            let storedGuild = await bu.getGuild(context.guild.id);
            if (storedGuild.warnings && storedGuild.warnings.users && storedGuild.warnings.users[user.id])
                return storedGuild.warnings.users[user.id];
            return 0;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();