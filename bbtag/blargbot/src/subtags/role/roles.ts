import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.roles;

@Subtag.names('roles')
@Subtag.ctorArgs('user')
export class RolesSubtag extends CompiledSubtag {
    readonly #users: UserService;

    public constructor(users: UserService) {
        super({
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

        this.#users = users;
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
        const user = await this.#users.querySingle(context, userId, { noLookup: quiet });

        if (user?.member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        const memberRoles = new Set(user.member.roles);
        return context.guild.roles.filter(r => memberRoles.has(r.id))
            .sort((a, b) => b.position - a.position)
            .map(r => r.id);
    }
}
