import { parse } from '@blargbot/core/utils/index.js';

import { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotAnArrayError, RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import templates from '../../text.js';
import { bbtag, SubtagType } from '../../utils/index.js';

const tag = templates.subtags.userSetRoles;

export class UserSetRolesSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'userSetRoles',
            aliases: ['setRoles'],
            category: SubtagType.USER,
            description: tag.description,
            definition: [
                {
                    parameters: ['roleArray?'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles]) => this.userSetRole(ctx, roles.value, ctx.user.id, false)
                },
                {
                    parameters: ['roleArray', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [roles, user, quiet]) => this.userSetRole(ctx, roles.value, user.value, quiet.value !== '')
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
            throw new BBTagRuntimeError('Author cannot remove roles');

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
                .withDisplay(quiet ? 'false' : undefined);
        }

        const roleArr = await bbtag.tagArray.deserializeOrGetArray(context, rolesStr !== '' ? rolesStr : '[]');
        if (roleArr === undefined) {
            throw new NotAnArrayError(rolesStr)
                .withDisplay(quiet ? 'false' : undefined);
        }

        const parsedRoles: string[] = [];

        for (const roleStr of roleArr.v.map(v => parse.string(v))) {
            const role = await context.queryRole(roleStr, {
                noLookup: quiet,
                noErrors: context.scopes.local.noLookupErrors
            });
            if (role === undefined) {
                throw new RoleNotFoundError(roleStr)
                    .withDisplay(quiet ? 'false' : undefined);
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
