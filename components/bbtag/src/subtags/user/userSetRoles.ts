import type { Logger } from '@blargbot/logger';

import type { BBTagContext } from '../../BBTagContext.js';
import type { BBTagValueConverter } from '../../BBTagUtilities.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { BBTagRuntimeError, NotAnArrayError, RoleNotFoundError, UserNotFoundError } from '../../errors/index.js';
import type { RoleService } from '../../services/RoleService.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import templates from '../../text.js';
import type { BBTagArrayTools } from '../../utils/index.js';
import { SubtagType } from '../../utils/index.js';

const tag = templates.subtags.userSetRoles;

@Subtag.names('userSetRoles', 'setRoles')
@Subtag.ctorArgs(Subtag.arrayTools(), Subtag.converter(), Subtag.service('user'), Subtag.service('role'), Subtag.logger())
export class UserSetRolesSubtag extends CompiledSubtag {
    readonly #arrayTools: BBTagArrayTools;
    readonly #converter: BBTagValueConverter;
    readonly #users: UserService;
    readonly #roles: RoleService;
    readonly #logger: Logger;

    public constructor(arrayTools: BBTagArrayTools, converter: BBTagValueConverter, users: UserService, roles: RoleService, logger: Logger) {
        super({
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

        this.#arrayTools = arrayTools;
        this.#converter = converter;
        this.#users = users;
        this.#roles = roles;
        this.#logger = logger;
    }

    public async userSetRole(
        context: BBTagContext,
        rolesStr: string,
        userStr: string,
        quiet: boolean
    ): Promise<boolean> {
        const topRole = context.roleEditPosition(context.authorizer);
        if (topRole <= 0)
            throw new BBTagRuntimeError('Author cannot remove roles');

        /*
         * Quiet suppresses all errors here instead of just the user errors
         * I feel like that is how it *should* work
        */
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await this.#users.querySingle(context, userStr, { noLookup: quiet });
        if (user?.member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? 'false' : undefined);
        }

        const roleArr = await this.#arrayTools.deserializeOrGetArray(context, rolesStr !== '' ? rolesStr : '[]');
        if (roleArr === undefined) {
            throw new NotAnArrayError(rolesStr)
                .withDisplay(quiet ? 'false' : undefined);
        }

        const parsedRoles: string[] = [];

        for (const roleStr of roleArr.v.map(v => this.#converter.string(v))) {
            const role = await this.#roles.querySingle(context, roleStr, { noLookup: quiet });
            if (role === undefined) {
                throw new RoleNotFoundError(roleStr)
                    .withDisplay(quiet ? 'false' : undefined);
            }
            parsedRoles.push(role.id);
        }

        try {
            await this.#users.edit(context, user.id, { roles: parsedRoles });
            return true;
        } catch (err: unknown) {
            this.#logger.error(err);
            return false;
        }

    }
}
