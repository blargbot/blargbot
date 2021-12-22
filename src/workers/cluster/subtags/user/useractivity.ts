import { BBTagContext, DefinedSubtag } from '@cluster/bbtag';
import { UserNotFoundError } from '@cluster/bbtag/errors';
import { SubtagType } from '@cluster/utils';

export class UserActivitySubtag extends DefinedSubtag {
    public constructor() {
        super({
            name: 'useractivity',
            aliases: ['usergame'],
            category: SubtagType.USER,
            desc: 'If no game is being played, this will return \'nothing\'',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the name of the activity the executing user is currently doing. ',
                    exampleCode: 'You are listening to {useractivity}',
                    exampleOut: 'You are listening to bad music',
                    returns: 'string',
                    execute: (ctx) => this.getUserActivity(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the name of the activity `user` is currently doing. If `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is playing {useractivity;Stupid cat}',
                    exampleOut: 'Stupid cat is playing nothing',
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserActivity(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserActivity(
        context: BBTagContext,
        userId: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const member = await context.queryMember(userId, { noLookup: quiet });

        if (member === undefined) {
            throw new UserNotFoundError(userId)
                .withDisplay(quiet ? '' : undefined);
        }

        return member.activities?.[0]?.name ?? 'nothing';
    }
}
