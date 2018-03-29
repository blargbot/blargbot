/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:42
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 19:20:42
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('username')
        .withArgs(a => [a.optional('user'), a.optional('quiet')])
        .withDesc('Returns `user`\'s name. `user` defaults to the user who executed the containing tag. ' +
            'If `quiet` is specified, if `user` can\'t be found it will simply return `user`')
        .withExample(
            'Your username is {username}!',
            'Your username is user!'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                user = context.user;

            if (args[0])
                user = await bu.getUser(context.msg, args[0], quiet);

            if (user != null)
                return user.username;

            if (quiet)
                return args[0];
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();