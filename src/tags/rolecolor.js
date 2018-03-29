/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-21 00:57:44
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('rolecolor')
        .withArgs(a => [a.require('role'), a.optional('quiet')])
        .withDesc('Returns `role`\'s hex color code. ' +
            'If `quiet` is specified, if `role` can\'t be found it will simply return `role`')
        .withExample(
            'The admin role color is: #{rolecolor;admin}.',
            'The admin role ID is: #1b1b1b.'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-2', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                role = await bu.getRole(context.msg, args[0], quiet);

            if (role != null)
                return role.color.toString(16).padStart(6, '0');

            if (quiet)
                return args[0];
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();