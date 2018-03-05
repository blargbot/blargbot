/*
 * @Author: stupid cat
 * @Date: 2017-05-07 18:47:38
 * @Last Modified by: stupid cat
 * @Last Modified time: 2017-05-07 18:47:38
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.AutoTag('hasrole')
        .acceptsArrays()
        .withArgs(a => [a.require('roleids'), a.optional('user'), a.optional('quiet')])
        .withDesc('Checks if a user has a role with the same id as the provided argument, and returns either `true` or `false`. ' +
            'Roleid can also be an array of role ids. ' +
            'You can find a list of roles and their ids by doing \`b!roles\`. ' +
            'If a user is provided, check that user.' +
            'If `quiet` is specified, if a user can\'t be found it will simply return `false`')
        .withExample(
            'You are a moderator: {hasrole;moderator}',
            'You are a moderator: false'
        ).beforeExecute(Builder.util.processAllSubtags)
        .whenArgs('1', Builder.errors.notEnoughArguments)
        .whenArgs('2-3', async function (params) {
            let result = await this.checkRoles(params, ...params.args.slice(1, 4));

            if (result.user == null)
                return await Builder.errors.noUserFound(params);
            if (result.roles.length == 0)
                return await Builder.errors.noRoleFound(params);

            return result.hasRole.reduce((a, b) => a || b, false);
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .withProp('checkRoles', async function (params, roleText, userText, quiet) {
            let roleExpr = /(\d{17,23})/,
                deserialized = await bu.deserializeTagArray(roleText),
                result = {
                    user: params.msg.member,
                    roles: [],
                    hasRole: []
                };

            roleText = [roleText];
            if (userText != null)
                result.user = await bu.getUser(params.msg, userText, quiet);

            if (deserialized && Array.isArray(deserialized.v))
                roleText = deserialized.v;

            for (const entry of roleText) {
                if (roleExpr.test(entry)) {
                    let roleId = entry.match(roleExpr)[1];
                    result.roles.push(params.msg.guild.roles.get(roleId));
                }
            }

            if (result.user && result.roles.length > 0)
                result.hasRole = result.roles.map(role => bu.hasRole(result.user, role.id, false));
            else
                result.hasRole = result.roles.map(r => false);
            return result;
        })
        .build();