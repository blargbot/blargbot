/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:54
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-07-13 10:40:52
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
        ]).withDesc('Bans a user. ' +
            'This functions the same as the ban command. ' +
            'If the ban is successful, `Success` will be returned, unless a duration was provided in which case the duration in ms will be returned' +
            'If noperms is provided, do not check if the command executor is actually able to ban people. ' +
            'Only provide this if you know what you\'re doing.'
        ).withExample(
            '{ban;stupid cat;0;This is a test ban} @stupid cat was banned!',
            'Success @stupid cat was banned!'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-6', )
        .whenArgs('>6', async function(params) {
            let user = await bu.getUser(params.msg, params.args[1], true);
            if (user) {
                let noPerms = params.args[5] ? true : false;
                let duration;
                if (params.args[4])
                    duration = bu.parseDuration(params.args[4]);
                let response = await CommandManager.list['ban'].ban(
                    params.msg,
                    user,
                    params.args[2],
                    params.args[3],
                    duration,
                    true,
                    noPerms
                );
                console.debug('Response', response);
                if (typeof response[1] == 'string' && response[1].startsWith('`'))
                    return await bu.tagProcessError(params, response[1]);
                return response[1];
            }
            return await Builder.errors.noUserFound(params);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();