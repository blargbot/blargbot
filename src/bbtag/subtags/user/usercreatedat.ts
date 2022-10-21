import moment from 'moment-timezone';

import { BBTagContext } from '../../BBTagContext';
import { CompiledSubtag } from '../../compilation';
import { UserNotFoundError } from '../../errors';
import templates from '../../text';
import { SubtagType } from '../../utils';

const tag = templates.subtags.usercreatedat;

export class UserCreatedAtSubtag extends CompiledSubtag {
    public constructor() {
        super({
            name: 'usercreatedat',
            category: SubtagType.USER,
            definition: [
                {
                    parameters: ['format?:YYYY-MM-DDTHH:mm:ssZ'],
                    description: tag.target.description,
                    exampleCode: tag.target.exampleCode,
                    exampleOut: tag.target.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format]) => this.getUserCreatedAt(ctx, format.value, '', true)
                },
                {
                    parameters: ['format:YYYY-MM-DDTHH:mm:ssZ', 'user', 'quiet?'],
                    description: tag.user.description,
                    exampleCode: tag.user.exampleCode,
                    exampleOut: tag.user.exampleOut,
                    returns: 'string',
                    execute: (ctx, [format, user, quiet]) => this.getUserCreatedAt(ctx, format.value, user.value, quiet.value !== '')
                }
            ]
        });
    }

    public async getUserCreatedAt(context: BBTagContext, format: string, userStr: string, quiet: boolean): Promise<string> {
        quiet ||= context.scopes.local.quiet ?? false;
        const user = await context.queryUser(userStr, { noLookup: quiet });

        if (user === undefined) {
            throw new UserNotFoundError(userStr)
                .withDisplay(quiet ? '' : undefined);
        }

        return moment(user.createdAt).utcOffset(0).format(format);
    }
}
