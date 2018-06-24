/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:18:56
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('pardon')
        .requireStaff()
        .withArgs(a => [
            a.optional('user'),
            a.optional('count'),
            a.optional('reason')
        ])
        .withDesc('Gives `user` `count` pardons with `reason`, and returns their new warning count. ' +
            '`user` defaults to the person running the tag and `count` defaults to 1')
        .withExample(
            'Be pardoned! {pardon}',
            'Be pardoned! 0'
        )
        .whenArgs('0-3', async function (subtag, context, args) {
            let user = context.author,
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

            let result = await bu.issuePardon(user, context.guild, count);
            await bu.logAction(context.guild, user, undefined, 'Tag Pardon', reason, bu.ModLogColour.PARDON, [{
                name: 'Pardons',
                value: `Assigned: ${count}\nNew Total: ${result || 0}`,
                inline: true
            }]);
            return result;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();