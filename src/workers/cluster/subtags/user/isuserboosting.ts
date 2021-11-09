import { BaseSubtag } from '@cluster/bbtag';
import { SubtagType } from '@cluster/utils';

export class IsUserBoostingSubtag extends BaseSubtag {
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
                    execute: (ctx) => (ctx.member.premiumSinceTimestamp !== null).toString()
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns `true` if the `user` is boosting the guild and `false` if not. ' +
                        'If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: '{if;{isuserboosting;stupid cat};stupid cat is boosting!; no boosting here :(}',
                    exampleOut: 'stupid cat is boosting!',
                    execute: async (context, [{ value: userStr }, { value: quietStr }]): Promise<string | void> => {
                        const quiet = typeof context.scopes.local.quiet === 'boolean' ? context.scopes.local.quiet : quietStr !== '';
                        const member = userStr === '' ? context.member : await context.queryMember(userStr, {
                            noErrors: context.scopes.local.noLookupErrors,
                            noLookup: quiet
                        });
                        if (member === undefined) {
                            // TODO
                            // if (quiet)
                            return '';
                            // throw new UserNotFoundError(userStr);
                        }
                        return (member.premiumSinceTimestamp !== null).toString();
                    }
                }
            ]
        });
    }
}
