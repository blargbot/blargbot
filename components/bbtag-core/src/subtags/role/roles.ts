import { guard } from '@blargbot/core/utils/index.js';

import { subtagParameter as p } from '../../execution/parameters/index.js';
import { Subtag } from '../../execution/Subtag.js';
import { UserNotFoundError } from '../../errors/index.js';

export class RolesSubtag extends Subtag {
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
