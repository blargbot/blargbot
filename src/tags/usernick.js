/*
 * @Author: stupid cat
 * @Date: 2017-05-07 19:20:48
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:02:25
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('usernick')
        .withArgs(a => [a.optional('user'), a.optional('quiet')])
        .withDesc('Returns `user`\'s nickname. If it doesn\'t exist, returns their username instead. ' +
        '`user` defaults to the user who executed the containing tag. ' +
        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.')
        .withExample(
        'Your nick is {usernick}!',
        'Your nick is Cool Dude 1337!'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                user = context.user;

            if (args[0])
                user = await bu.getUser(context.msg, args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user != null) {
                let member = context.guild.members.get(user.id);
                if (member == null) return user.username;
                return member.nick || user.username;
            }

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();
