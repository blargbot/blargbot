import { guard } from '@blargbot/core/utils';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.roles;

export class RolesSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'roles',
            category: SubtagType.ROLE,
            definition: [
                {
                    parameters: [],
                    description: tag.guild.description,
                    exampleCode: tag.guild.exampleCode,
                    exampleOut: tag.guild.exampleOut,
                    returns: 'id[]',
                    execute: (ctx) => this.getGuildRoles(ctx)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'id[]',
                    execute: (ctx, [userId, quiet]) => this.getUserRoles(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public getGuildRoles(context: BBTagContext): string[] {
        return [...context.guild.roles.values()]
            .sort((a, b) => b.position - a.position)
            .map(r => r.id);
    }

    public async getUserRoles(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string[]> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        if (!guard.hasValue(member.guild) || !guard.hasValue(member.roles))
            return [];

        return member.roles
            .map(r => ({ r, p: member.guild.roles.get(r)?.position ?? -Infinity }))
            .sort((a, b) => b.p - a.p)
            .map(r => r.r);
    }
}
