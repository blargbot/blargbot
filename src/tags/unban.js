/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:50
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:19:18
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
  Builder.CCommandTag('unban')
    .requireStaff()
    .withArgs(a => [a.require('user'), a.optional('reason'), a.optional('noperms')])
    .withDesc('Unbans a user. This functions the same as the unban command. '+
    'If noperms is provided, do not check if the command executor is actually able to ban people. '+
    'Only provide this if you know what you\'re doing.')
    .withExample(
      '{unban;@user;0;This is a test unban}@user was unbanned!',
      '@user was unbanned!'
    ).beforeExecute(Builder.util.processAllSubtags)
    .whenArgs('1', Builder.errors.notEnoughArguments)
    .whenArgs('2-4', async function (params) {
        let user = await bu.getUser(params.msg, params.args[1], false),
            reason = params.args[2],
            noPerms = params.args[3] != null;

        if (user == null) return await Builder.errors.noUserFound(params);
        let response = await CommandManager.list['unban'].unban(params.msg, user, reason, true, noPerms);

        if (typeof response[1] == 'string' && response[1].startsWith('`')) {
            return await bu.tagProcessError(params, response[1]);
        }
        return response[1];
    })
    .whenDefault(Builder.errors.tooManyArguments)
    .build();