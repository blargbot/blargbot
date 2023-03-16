import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import type { BBTagLogger } from '../../services/BBTagLogger.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.roleRemove;

@Subtag.id('roleRemove', 'removeRole')
@Subtag.ctorArgs('arrayTools', 'users', 'logger')
export class RoleRemoveSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #users: UserService;
    readonly #logger: BBTagLogger;

    public constructor(arrayTools: BBTagArrayTools, users: UserService, logger: BBTagLogger) {
        super({
            category: SubtagType.ROLE,
            description: tag.description,
            definition: [
                {
                    parameters: ['role'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role]) => this.removeRole(ctx, role.value, ctx.runtime.user.id, false)
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: tag.other.description,
                    exampleCode: tag.other.exampleCode,
                    exampleOut: tag.other.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role, user, quiet]) => this.removeRole(ctx, role.value, user.value, quiet.value !== '')
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#users = users;
        this.#logger = logger;
    }

    public async removeRole(
        context: BBTagScript,
        roleStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        const topRole = context.runtime.roleEditPosition(context.runtime.authorizer);
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot remove roles');

        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const user = await this.#users.querySingle(context.runtime, userStr, { noLookup: quiet });

        if (user?.member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? 'false' : undefined);
        }

        const roleStrs = new Set(this.#arrayTools.deserialize(roleStr)?.v.map(v => v?.toString() ?? '~') ?? [roleStr]);
        const roles = context.runtime.guild.roles.filter(r => roleStrs.has(r.id));

        if (roles.length === 0)
            throw new RoleNotFoundError(roleStr);

        if (roles.find(role => role.position >= topRole) !== undefined)
            throw new BBTagRuntimeError('Role above author');

        const userRoles = new Set(user.member.roles);
        if (roles.every(r => !userRoles.has(r.id)))
            return false;

        try {
            const removeRoles = new Set(roles.map(r => r.id));
            const newRoleList = [...new Set(user.member.roles.filter(r => !removeRoles.has(r)))];
            await this.#users.edit(context.runtime, user.id, { roles: newRoleList });
            return true;
        } catch (err: unknown) {
            this.#logger.error(err);
            return false;
        }
    }
}
