/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:25:36
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:25:36
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

async function grantRole(params, target) {
    if (!target)
        return await Builder.util.noUserFound(params);

    let regexp = /(\d{17,23})/, role;
    if (regexp.test(params.args[1])) {
        let roleId = params.args[1].match(regexp)[1];
        role = params.msg.guild.roles.get(roleId);
    }
    if (!role)
        return await Builder.util.noRoleFound(params);

    let hasRole = bu.hasRole(target, role.id, false);
    if (hasRole)
        return 'false';

    try {
        await target.addRole(role.id);
        return 'true';
    } catch (err) {
        console.error(err);
        return 'false';
    }


}

module.exports =
    Builder.CCommandTag('addrole')
        .requireStaff(true)
        .withArgs(a => [a.require('role'), a.optional('user')])
        .withDesc('Gives a user a role, where role is a role ID or mention. ' +
            'You can find a list of roles and their ids by doing `b!roles`. ' +
            'Returns true if a role was given, and false otherwise.'
        ).withExample(
            'Have a role! {addrole;11111111111111111}',
            'Have a role! true'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('<2', Builder.errors.notEnoughArguments)
        .whenArgs('2', async params => await grantRole(params, params.msg.member))
        .whenArgs('3', async params => {
            let user = await bu.getUser(params.msg, params.args[2], true);
            if (user)
                return await grantRole(params, params.msg.guild.members.get(user.id));
            return await grantRole(params, params.msg.member);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();