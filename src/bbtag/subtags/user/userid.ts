import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.userid;

export class UserIdSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'userid',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: [],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'id',
                    execute: (ctx) => this.getUserId(ctx, '', true)
                },
                {
                    parameters: ['user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'id',
                    execute: (ctx, [userId, quiet]) => this.getUserId(ctx, userId.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserId(
        context: BBTagContext,
        userStr: string,
        quiet: boolean
    ): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userStr, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return user.id;
    }
}
