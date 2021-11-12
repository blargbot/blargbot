import { BaseSubtag, BBTagContext } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class IsStaffSubtag extends BaseSubtag {
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
            // We dont want this error to appear in the output
            context.scopes.local.fallback = '';
            throw new UserNotFoundError(userStr);
        }

        return await context.util.isUserStaff(member);
    }
}
