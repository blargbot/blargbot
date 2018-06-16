/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2018-05-16 10:04:07
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('rolemembers')
        .withArgs(a => [a.require('role'), a.optional('quiet')])
        .withDesc('Returns an array of members in `role`. ' +
            'If `quiet` is specified, if `role` can\'t be found it will simply return nothing.')
        .withExample(
            'The admins are: {rolemembers;Admin}.',
            'The admins are: ["11111111111111111","22222222222222222"].'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                role = await bu.getRole(context.msg, args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });

            if (role != null)
                return JSON.stringify(context.guild.members
                    .filter(m => m.roles.includes(role.id))
                    .map(m => m.user.id));

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();