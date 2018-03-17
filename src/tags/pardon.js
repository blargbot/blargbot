/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:33
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-11-08 11:45:35
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
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-4', async function (params) {
            let user = params.msg.author,
                count = bu.parseInt(params.args[2] || 1),
                reason = params.args[3];

            if (params.args[1])
                user = await bu.getUser(params.msg, params.args[1]);

            if (user == null)
                return await Builder.errors.noUserFound(params);

            if (isNaN(count))
                return await Builder.errors.notANumber(params);

            let result = await bu.issuePardon(user, params.msg.guild, count);
            await bu.logAction(params.msg.guild, user, undefined, 'Tag Pardon', reason, bu.ModLogColour.PARDON, [{
                name: 'Pardons',
                value: `Assigned: ${count}\nNew Total: ${result || 0}`,
                inline: true
            }]);
            return result;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();