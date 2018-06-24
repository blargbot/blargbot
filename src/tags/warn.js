/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:21:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:18:07
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('warn')
        .requireStaff()
        .withArgs(a => [a.optional('user'), a.optional('count'), a.optional('reason')])
        .withDesc('Gives `user` the specified number of warnings with the given reason, and returns their new warning count. ' +
            '`user` defaults to the user who executed the containing tag. `count` defaults to 1.')
        .withExample(
            'Be warned! {warn}',
            'Be warned! 1'
        )
        .whenArgs('0-3', async function (subtag, context, args) {
            let user = context.user,
                count = bu.parseInt(args[1] || 1),
                reason = args[2];

            if (args[0])
                user = await context.getUser(args[0], {
                    suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user == null)
                return Builder.errors.noUserFound(subtag, context);

            if (isNaN(count))
                return Builder.errors.notANumber(subtag, context);

            let result = await bu.issueWarning(user, context.guild, count);
            await bu.logAction(context.guild, user, undefined, 'Tag Warning', reason, bu.ModLogColour.WARN, [{
                name: 'Warnings',
                value: `Assigned: ${count}\nNew Total: ${result.count || 0}`,
                inline: true
            }]);
            return result.count;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();