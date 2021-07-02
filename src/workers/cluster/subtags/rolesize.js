/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:48:43
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:48:43
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('rolesize')
        .withAlias('inrole')
        .withArgs(a => a.required('roleId'))
        .withDesc('Returns how many people have the `roleId` role.')
        .withExample(
            'There are {rolesize;11111111111111111} people in the role!',
            'There are 5 people in the role!'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs(1, async function (subtag, context, args) {
            let role = context.guild.roles.get(args[0]);
            if (role)
                return context.guild.members.filter(m => m.roles.includes(role.id)).length;
            return Builder.errors.noRoleFound(subtag, context);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();