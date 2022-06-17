import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class IsStaffSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'isstaff',
            aliases: ['ismod'],
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: 'Checks if the tag author is staff',
                    exampleCode: '{if;{isstaff};The author is a staff member!;The author is not a staff member :(}',
                    exampleOut: 'The author is a staff member!',
                    returns: 'boolean',
                    execute: ctx => ctx.isStaff
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Checks if `user` is a member of staff. ' +
                        'If the `user` cannot be found `false` will be returned.',
                    exampleCode: '{if;{isstaff;{userid}};You are a staff member!;You are not a staff member :(}',
                    exampleOut: 'You are not a staff member :(',
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
