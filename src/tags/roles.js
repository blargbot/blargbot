/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:20:02
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('roles')
        .withArgs(a => [a.optional('user'), a.optional('quiet')])
        .withDesc('Returns an array of roles on the current guild. ' +
        'If `user` is specified, get the roles that `user` has. ' +
        'If `quiet` is specified, if a `user` can\'t be found it will simply return nothing.')
        .withExample(
        'The roles on this guild are: {roles}.',
        'The roles on this guild are: ["11111111111111111","22222222222222222"].'
        )
        .whenArgs(0, async function (subtag, context, args) {
            let roles = context.guild.roles.map(r => r);
            roles = roles.sort((a, b) => b.position - a.position);
            return JSON.stringify(roles.map(r => r.id));
        })
        .whenArgs('1-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                user = await bu.getUser(context.msg, args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (user != null) {
                let guildRoles = context.guild.roles.map(r => r).reduce((o, r) => (o[r.id] = r, o), {});
                let roles = context.guild.members.get(user.id).roles.map(r => guildRoles[r]);
                return JSON.stringify(roles.sort((a, b) => b.position - a.position).map(r => r.id));
            }

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();