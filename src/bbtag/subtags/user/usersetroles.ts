import { parse } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { BBTagRuntimeError, NotAnArrayError, RoleNotFoundError, UserNotFoundError } from '../../errors';
import { bbtag, SubtagType } from '../../utils';

export class UserSetRolesSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: `usersetroles`,
            aliases: [`setroles`],
            category: SubtagType.USER,
            description: `\`roleArray\` must be an array formatted like \`["role1", "role2"]\``,
            definition: [
                {
                    parameters: [`roleArray?`],
                    description: `Sets the roles of the current user to \`roleArray\`.`,
                    exampleCode: `{usersetroles;["1111111111111"]}`,
                    exampleOut: `true`,
                    returns: `boolean`,
                    execute: (ctx, [roles]) => this.userSetRole(ctx, roles.value, ctx.user.id, false)
                },
                {
                    parameters: [`roleArray`, `user`, `quiet?`],
                    description: `Sets the roles of \`user\` to \`roleArray\`. If quiet is provided, all errors will return \`false\`.`,
                    exampleCode: `{usersetroles;["1111111111111"];stupid cat}`,
                    exampleOut: `true`,
                    returns: `boolean`,
                    execute: (ctx, [roles, user, quiet]) => this.userSetRole(ctx, roles.value, user.value, quiet.value !== ``)
                }
            ]
        });
    }

    public async userSetRole(
        context: BBTagContext,
        rolesStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        const topRole = context.roleEditPosition();
        if (topRole <= 0)
            throw new BBTagRuntimeError(`Author cannot remove roles`);

        /*
         * Quiet suppresses all errors here instead of just the user errors
         * I feel like that is how it *should* work
        */
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userStr, {
            noLookup: quiet,
            noErrors: context.scopes.local.noLookupErrors
        });
        if (member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? `false` : undefined);
        }

        const roleArr = await bbtag.tagArray.deserializeOrGetArray(context, rolesStr !== `` ? rolesStr : `[]`);
        if (roleArr === undefined) {
            throw new NotAnArrayError(rolesStr)
                .withDisplay(quiet ? `false` : undefined);
        }

        const parsedRoles: string[] = [];

        for (const roleStr of roleArr.v.map(v => parse.string(v))) {
            const role = await context.queryRole(roleStr, {
                noLookup: quiet,
                noErrors: context.scopes.local.noLookupErrors
            });
            if (role === undefined) {
                throw new RoleNotFoundError(roleStr)
                    .withDisplay(quiet ? `false` : undefined);
            }
            parsedRoles.push(role.id);
        }

        try {
            await member.edit({ roles: parsedRoles }, context.auditReason());
            member.roles = parsedRoles;
            return true;
        } catch (err: unknown) {
            context.logger.error(err);
            return false;
        }

    }
}
