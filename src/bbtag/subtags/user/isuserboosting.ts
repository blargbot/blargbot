import { Member } from 'eris';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class IsUserBoostingSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'isuserboosting',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: 'Returns `true` if the executing user is boosting the guild and `false` if not.',
                    exampleCode: '{if;{isuserboosting};Yes you are boosting;You should consider boosting}',
                    exampleOut: 'You should consider boosting',
                    returns: 'boolean',
                    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
                    execute: (ctx) => this.isUserBoosting(ctx.member!)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `true` if the `user` is boosting the guild and `false` if not. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: '{if;{isuserboosting;stupid cat};stupid cat is boosting!; no boosting here :(}',
                    exampleOut: 'stupid cat is boosting!',
                    returns: 'boolean',
                    execute: (ctx, [user, quiet]) => this.findIsUserBoosting(ctx, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async findIsUserBoosting(context: BBTagContext, userStr: string, quiet: boolean): Promise<boolean> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userStr, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return this.isUserBoosting(member);
    }

    public isUserBoosting(member: Member): boolean {
        return typeof member.premiumSince === 'number';
    }
}
