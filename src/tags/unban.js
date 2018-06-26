/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:06:50
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:15:41
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.CCommandTag('unban')
        .requireStaff()
        .withArgs(a => [a.require('user'), a.optional('reason'), a.optional('noperms')])
        .withDesc('Unbans `user` with the given `reason`. This functions the same as the unban command. ' +
            'If `noperms` is provided, do not check if the command executor is actually able to ban people. ' +
            'Only provide this if you know what you\'re doing.')
        .withExample(
            '{unban;@user;0;This is a test unban}@user was unbanned!',
            '@user was unbanned!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-3', async function (subtag, context, args) {
            let user = await context.getUser(args[0], {
                quiet: false,
                suppress: context.scope.suppressLookup,
                label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
            }),
                reason = args[1],
                noPerms = args[2] != null;

            if (user == null) return Builder.errors.noUserFound(subtag, context);
            let response = await CommandManager.built['unban'].unban(context.msg, user, reason, true, noPerms);

            if (typeof response[1] == 'string' && response[1].startsWith('`')) {
                return Builder.util.error(subtag, context, response[1]);
            }
            return response[1];
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();