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
    Builder.AutoTag('inrole')
        .withArgs(a => a.require('roleId'))
        .withDesc('Returns how many people have the `roleId` role.')
        .withExample(
            'There are {inrole;11111111111111111} people in the role!',
            'There are 5 people in the role!'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2', async function (params) {
            let role = params.msg.guild.roles.get(params.args[1]);
            if (role)
                return params.msg.guild.members.filter(m => m.roles.includes(role.id)).length;
            return await Builder.errors.noRoleFound(params);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();