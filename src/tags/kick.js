/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:26:54
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-07-25 10:18:50
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('kick')
        .withArgs(a => [
            a.require('user'),
            a.optional('reason'),
            a.optional('noperms')
        ]).withDesc('Kicks `user`. ' +
        'This functions the same as the kick command. ' +
        'If the kick is successful, `Success` will be returned, otherwise the error will be given. ' +
        'If `noperms` is provided, do not check if the command executor is actually able to kick people. ' +
        'Only provide this if you know what you\'re doing.'
        ).withExample(
        '{kick;stupid cat;because I can} @stupid cat was kicked!',
        'Success @stupid cat was kicked!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-3', async function (subtag, context, args) {
            let user = await context.getUser(args[0], {
                quiet: true, suppress: context.scope.suppressLookup,
                label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
            });
            let noPerms = args[2] ? true : false;
            let error = (message) => Builder.util.error(subtag, context, message);

            if (!user) return Builder.errors.noUserFound(subtag, context);

            let response = await CommandManager.built['kick'].kick(
                context.msg,
                user,
                args[1] || context.scope.reason || undefined,
                true,
                noPerms
            );
            /*console.debug(state);
            switch (state) {
                case 0: //Successful
                    return 'Success';
                case 1: //Bot doesnt have perms
                    return error(`I don't have permission to kick users!`);
                case 2: //Bot cannot kick target
                    return error(`I don't have permission to kick ${user.username}!`);
                case 3: //User doesnt have perms
                    return error(`You don't have permission to kick users!`);
                case 4: //User cannot kick target
                    return error(`You don't have permission to kick ${user.username}!`);
                default: //Error occurred
                    throw state;
            }*/
    
            if (typeof response[1] == 'string' && response[1].startsWith('`'))
                return Builder.util.error(subtag, context, response[1]);
    
            return response[1];
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
