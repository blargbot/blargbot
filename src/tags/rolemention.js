/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-07-03 19:13:43
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('rolemention')
        .withArgs(a => [a.require('role'), a.optional('quiet'), a.optional('noPing')])
        .withDesc('Returns a mention of `role`. ' +
            'If `quiet` is specified (can be any value), if `role` can\'t be found it will simply return nothing.' +
            ' If `noPing` is `true` (must be a boolean), role won\'t be pinged but the mention will still be displayed, if it is `false` the mention will ping.')
        .withExample(
            'The admin role ID is: {roleid;admin}.',
            'The admin role ID is: 123456789123456.'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-3', async function (subtag, context, args) {
            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[1],
                role = await context.getRole(args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                });
            const noPing = bu.parseBoolean(args[2]);
            if (args[2] && typeof noPing !== 'boolean') {
                return Builder.errors.notABoolean(subtag, context);
            }

            if (role != null) {
                if (!noPing && !context.state.allowedMentions.roles.includes(role.id)) {
                    context.state.allowedMentions.roles.push(role.id);
                }
                return role.mention;
            }

            if (quiet)
                return '';
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();