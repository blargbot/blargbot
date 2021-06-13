/*
 * @Author: stupid cat
 * @Date: 2017-05-21 00:22:32
 * @Last Modified by: RagingLink
 * @Last Modified time: 2021-05-20 23:52:32
 *
 * This project uses the AGPLv3 license. Please read the license file before using/adapting any of the code.
 */

const Builder = require('../structures/TagBuilder');

module.exports =
    Builder.APITag('rolesetperms')
        .withAlias('rolesetpermissions')
        .withArgs(a => [a.require('role'), a.optional('permissions'), a.optional('quiet')])
        .withDesc('Sets the permissions of `role` with the provided `permissions` number. ' +
            'This will not apply any permissions the authorizer can\'t grant. ' +
            'Additionally, this will completely overwrite the role\'s existing permissions. ' +
            'If `quiet` is specified, if `role` can\'t be found it will simply return nothing')
        .withExample(
            'The admin role now has the administrator permission. {rolesetperms;admin;8}',
            'The admin role now has the administrator permission.'
        )
        .whenArgs(0, Builder.errors.notEnoughArguments)
        .whenArgs('1-3', async function (subtag, context, args) {
            let topRole = Builder.util.getRoleEditPosition(context);
            if (topRole == 0)
                return Builder.util.error(subtag, context, 'Author cannot edit roles');

            let quiet = bu.isBoolean(context.scope.quiet) ? context.scope.quiet : !!args[2],
                role = await context.getRole(args[0], {
                    quiet, suppress: context.scope.suppressLookup,
                    label: `${context.isCC ? 'custom command' : 'tag'} \`${context.tagName || 'unknown'}\``
                }),
                perms = bu.parseInt(args[1]) || 0;

            const allowedPerms = Builder.util.getPerms(context).allow;
            const mappedPerms = BigInt(perms) & allowedPerms;

            if (role != null) {
                if (role.position >= topRole)
                    return Builder.util.error(subtag, context, 'Role above author');

                try {
                    let fullReason = bu.formatAuditReason(context.user, context.scope.reason);
                    await role.edit({ permissions: mappedPerms }, fullReason);
                    return;
                } catch (err) {
                    if (!quiet)
                        return Builder.util.error(subtag, context, 'Failed to edit role: no perms');
                }
            }
            return Builder.util.error(subtag, context, 'Role not found');
        })
        .whenDefault(Builder.errors.tooManyArguments)
        .build();