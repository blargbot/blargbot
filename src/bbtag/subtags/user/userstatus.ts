import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import { SubtagType } from '../../utils';

export class UserStatusSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'userstatus',
            category: SubtagType.USER,
            desc: 'Returned status can be one of `online`, `idle`, `dnd` or `offline`',
            definition: [
                {
                    parameters: [],
                    description: 'Returns the status of the user.',
                    exampleCode: 'You are currently {userstatus}',
                    exampleOut: 'You are currently online',
                    returns: 'string',
                    execute: (ctx) => this.getUserStatus(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: 'Returns the status of `user`. If `quiet` is specified, if `user` can\'t be found it will simply return nothing.',
                    exampleCode: 'Stupid cat is currently {userstatus;stupid cat}',
                    exampleOut: 'Stupid cat is currently online',
                    returns: 'string',
                    execute: (ctx, [userId, quiet]) => this.getUserStatus(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserStatus(
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

        return member.status ?? 'offline';
    }
}
