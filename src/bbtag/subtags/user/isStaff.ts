import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation/index';
import { UserNotFoundError } from '../../errors/index';
import templates from '../../text';
import { SubtagType } from '../../utils/index';

const tag = templates.subtags.isStaff;

export class IsStaffSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'isStaff',
            aliases: ['isMod'],
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'boolean',
                    execute: ctx => ctx.isStaff
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
    }

    public async isStaff(context: BBTagContext, userStr: string, quiet: boolean): Promise<boolean> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userStr, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return await context.util.isUserStaff(member);
    }
}
