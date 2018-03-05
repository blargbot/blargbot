/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:22:10
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:22:10
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('warnings')
        .requireStaff()
        .withArgs(a => a.optional('user'))
        .withDesc('Gets the number of warnings a user has.')
        .withExample(
            'You have {warnings} warning(s)!',
            'You have 0 warning(s)!'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            let user = params.args[1];

            if (user == null)
                user = params.msg.author;
            else
                user = await bu.getUser(params.msg, user);

            if (user == null)
                return await Builder.errors.noUserFound(params);

            let storedGuild = await bu.getGuild(params.msg.guild.id);
            if (storedGuild.warnings && storedGuild.warnings.users && storedGuild.warnings.users[user.id])
                return storedGuild.warnings.users[user.id];
            return 0;
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();