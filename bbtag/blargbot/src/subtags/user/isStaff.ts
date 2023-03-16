import type { BBTagScript } from '../../BBTagScript.js';
import { CompiledSubtag } from '../../compilation/index.js';
import { UserNotFoundError } from '../../errors/index.js';
import type { StaffService } from '../../services/StaffService.js';
import type { UserService } from '../../services/UserService.js';
import { Subtag } from '../../Subtag.js';
import textTemplates from '../../text.js';
import { SubtagType } from '../../utils/index.js';

const tag = textTemplates.subtags.isStaff;

@Subtag.id('isStaff', 'isMod')
@Subtag.ctorArgs('staff', 'users')
export class IsStaffSubtag extends CompiledSubtag {
    readonly #staff: StaffService;
    readonly #users: UserService;

    public constructor(staff: StaffService, users: UserService) {
        super({
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: ctx => ctx.runtime.isStaff
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'boolean',
                    execute: (ctx, [user, quiet]) => this.isStaff(ctx, user.value, quiet.value !== '')
                }
            ]
        });

        this.#staff = staff;
        this.#users = users;
    }

    public async isStaff(context: BBTagScript, userStr: string, quiet: boolean): Promise<boolean> {
        quiet ||= context.runtime.scopes.local.quiet ?? false;
        const member = await this.#users.querySingle(context.runtime, userStr, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return await this.#staff.isUserStaff(member);
    }
}
