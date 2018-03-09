/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:21:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:21:36
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
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1-4', async function (params) {
            let user = params.msg.author,
                count = parseInt(params.args[2] || 1),
                reason = params.args[3];

            if (params.args[1])
                user = await bu.getUser(params.msg, params.args[1]);

            if (user == null)
                return await Builder.errors.noUserFound(params);

            if (isNaN(count))
                return await Builder.errors.notANumber(params);

            let result = await bu.issueWarning(user, params.msg.guild, count);
            await bu.logAction(params.msg.guild, user, undefined, 'Tag Warning', reason, bu.ModLogColour.WARN, [{
                name: 'Warnings',
                value: `Assigned: ${count}\nNew Total: ${result.count || 0}`,
                inline: true
            }]);
            return result.count;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();