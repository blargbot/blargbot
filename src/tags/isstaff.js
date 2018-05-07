/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:50:20
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-07 14:41:51
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('isstaff')
        .withAlias('ismod')
        .withArgs(a => [a.optional('user'), a.optional('quiet')])
        .withDesc('Checks if `user` is a member of staff. `user` defaults to the person running the tag. ' +
        'If the `user` cannot be found `false` will be returned.')
        .withExample(
        '{if;{isstaff};You are a staff member!;You are not a staff member :(}',
        'You are a staff member!'
        )
        .whenArgs('0-2', async function (subtag, context, args) {
            if (args.length == 0)
                return await context.isStaff;

            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                user = await bu.getUser(context.msg, args[0], quiet);

            if (user == null) return false;

            return await bu.isUserStaff(user.id, context.guild.id);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();