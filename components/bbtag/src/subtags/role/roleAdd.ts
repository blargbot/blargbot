import type { Logger } from '@blargbot/logger';

import type { BBTagContext } from '../../BBTagContext.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.roleAdd;

@Subtag.names('roleAdd', 'addRole')
@Subtag.ctorArgs(Subtag.arrayTools(), Subtag.service('user'), Subtag.logger())
export class RoleAddSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #users: UserService;
    readonly #logger: Logger;

    public constructor(arrayTools: BBTagArrayTools, users: UserService, logger: Logger) {
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
                    execute: (ctx, [role]) => this.addRole(ctx, role.value, ctx.user.id, false)
                },
                {
                    parameters: ['role', 'user', 'quiet?'],
                    description: tag.other.description,
                    exampleCode: tag.other.exampleCode,
                    exampleOut: tag.other.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [role, user, quiet]) => this.addRole(ctx, role.value, user.value, quiet.value !== '')
                }
            ]
        });

        this.#arrayTools = arrayTools;
        this.#users = users;
        this.#logger = logger;
    }

    public async addRole(
        context: BBTagContext,
        roleStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        const topRole = context.roleEditPosition(context.authorizer);
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot add roles');

        quiet ||= context.scopes.local.quiet ?? false;
        const user = await this.#users.querySingle(context, userStr, { noLookup: quiet });

        if (user?.member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? 'false' : undefined);
        }

        const roleStrs = new Set(this.#arrayTools.deserialize(roleStr)?.v.map(v => v?.toString() ?? '~') ?? [roleStr]);
        const roles = context.guild.roles.filter(r => roleStrs.has(r.id));

        if (roles.length === 0)
            throw new RoleNotFoundError(roleStr);

        if (roles.find(role => role.position >= topRole) !== undefined)
            throw new BBTagRuntimeError('Role above author');

        const userRoles = new Set(user.member.roles);
        if (roles.every(r => userRoles.has(r.id)))
            return false;

        try {
            const newRoleList = [...new Set([...userRoles, ...roles.map(r => r.id)])];
            await this.#users.edit(context, user.id, { roles: newRoleList });
            return true;
        } catch (err: unknown) {
            this.#logger.error(err);
            return false;
        }
    }
}
